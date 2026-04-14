import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

@Injectable()
export class QueuePublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueuePublisherService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private isShuttingDown = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    await this.close();
  }

  private getQueueName(suffix: string): string {
    const prefix = this.configService.getOrThrow<string>('rabbitmq.queuePrefix');
    const language = this.configService.getOrThrow<string>('server.language');
    return `${prefix}-${language}-${suffix}`;
  }

  async connect(): Promise<void> {
    const url = this.configService.getOrThrow<string>('rabbitmq.url');
    try {
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (err: Error) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`);
      });

      this.connection.on('close', () => {
        if (!this.isShuttingDown) {
          this.logger.warn('RabbitMQ connection closed, reconnecting...');
          setTimeout(() => this.connect(), 3000);
        }
      });

      const socketQueue = this.getQueueName('socket');
      const pushQueue = this.getQueueName('push');
      const emailQueue = this.getQueueName('email');
      const smsQueue = this.getQueueName('sms');
      await this.channel.assertQueue(socketQueue, { durable: true });
      await this.channel.assertQueue(pushQueue, { durable: true });
      await this.channel.assertQueue(emailQueue, { durable: true });
      await this.channel.assertQueue(smsQueue, { durable: true });

      this.logger.log('Connected to RabbitMQ');
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err instanceof Error ? err.stack : String(err));
      if (!this.isShuttingDown) {
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  async emitSocket(
    users: string[],
    type: number,
    data: Record<string, any>,
    meta: { title?: string; description?: string; avatar?: string; url?: string; userId?: string } = {},
  ): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`Cannot emit socket event (type=${type}): RabbitMQ channel not connected`);
      return;
    }
    const queueName = this.getQueueName('socket');
    const message = {
      url: meta.url || '',
      title: meta.title || '',
      avatar: meta.avatar || '',
      description: meta.description || '',
      userId: meta.userId || '',
      createdAt: new Date().toISOString(),
      data: { users, data, type },
    };
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
  }

  async emitPush(
    users: Array<{ id: string; userId: string; endpoint: string; auth: string; p256dh: string }>,
    title: string,
    description: string,
    avatar: string,
    url: string,
    data: Record<string, any>,
    type: number,
  ): Promise<void> {
    if (!this.channel) return;
    const queueName = this.getQueueName('push');
    const message = {
      url,
      title,
      avatar,
      description,
      userId: '',
      createdAt: new Date().toISOString(),
      data: { users, data, type },
    };
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
  }

  emitEmail(job: {
    to: string;
    template: string;
    culture: string;
    data: Record<string, any>;
    subject?: string;
  }): void {
    if (!this.channel) {
      this.logger.warn('Cannot emit email: RabbitMQ channel not connected');
      return;
    }
    const queueName = this.getQueueName('email');
    const message = {
      ...job,
      createdAt: new Date().toISOString(),
    };
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
    this.logger.debug(`Email job queued: ${job.template} -> ${job.to}`);
  }

  emitSms(job: {
    to: string;
    message: string;
    data?: Record<string, any>;
  }): void {
    if (!this.channel) {
      this.logger.warn('Cannot emit SMS: RabbitMQ channel not connected');
      return;
    }
    const queueName = this.getQueueName('sms');
    const message = {
      ...job,
      createdAt: new Date().toISOString(),
    };
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
    this.logger.debug(`SMS job queued: ${job.to}`);
  }

  private async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (err) {
      this.logger.warn('Error closing RabbitMQ', err instanceof Error ? err.stack : String(err));
    }
  }
}
