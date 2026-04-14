import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

type MessageHandler = (content: string) => Promise<void>;

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private readonly handlers = new Map<string, MessageHandler>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000;
  private isShuttingDown = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    await this.close();
  }

  registerHandler(queueName: string, handler: MessageHandler): void {
    this.handlers.set(queueName, handler);
  }

  getQueueName(suffix: string): string {
    const prefix = this.configService.getOrThrow<string>('rabbitmq.queuePrefix');
    const language = this.configService.getOrThrow<string>('server.language');
    return `${prefix}-${language}-${suffix}`;
  }

  async connect(): Promise<void> {
    const url = this.configService.getOrThrow<string>('rabbitmq.url');
    try {
      this.logger.log(`Connecting to RabbitMQ at ${url}`);
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (err: Error) => {
        this.logger.error(
          `RabbitMQ connection error: ${err.message}`,
          err.stack,
        );
      });

      this.connection.on('close', () => {
        if (!this.isShuttingDown) {
          this.logger.warn(
            'RabbitMQ connection closed unexpectedly, attempting reconnect',
          );
          this.scheduleReconnect();
        }
      });

      for (const [queueName, handler] of this.handlers) {
        await this.bindQueue(queueName, handler);
      }

      this.reconnectAttempts = 0;
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (err) {
      this.logger.error(
        `Failed to connect to RabbitMQ (attempt ${this.reconnectAttempts + 1})`,
        err instanceof Error ? err.stack : String(err),
      );
      this.scheduleReconnect();
    }
  }

  private async bindQueue(
    queueName: string,
    handler: MessageHandler,
  ): Promise<void> {
    if (!this.channel) {
      this.logger.error(
        `Cannot bind queue ${queueName}: no channel available`,
      );
      return;
    }

    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.prefetch(10);
    await this.channel.consume(queueName, async (msg) => {
      if (msg === null) return;

      const content = msg.content.toString();
      try {
        await handler(content);
        this.channel?.ack(msg);
      } catch (err) {
        this.logger.error(
          `Error processing message from queue "${queueName}"`,
          err instanceof Error ? err.stack : String(err),
        );
        this.channel?.nack(msg, false, true);
      }
    });

    this.logger.log(`Bound to queue: ${queueName}`);
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`,
      );
      return;
    }

    const delay =
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    this.logger.warn(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
    );

    setTimeout(async () => {
      await this.close();
      await this.connect();
    }, delay);
  }

  private async close(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;
    this.channel = null;
    this.connection = null;

    try {
      await channel?.close();
    } catch {
      // Channel may already be closed after a connection drop
    }

    try {
      await connection?.close();
    } catch {
      // Connection may already be closed
    }
  }
}
