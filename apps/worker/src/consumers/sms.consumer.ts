import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { SmsService } from '../services/sms.service';

interface SmsJob {
  to: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

@Injectable()
export class SmsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsConsumer.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private isShuttingDown = false;

  constructor(
    private readonly config: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    await this.close();
  }

  private getQueueName(): string {
    const prefix = this.config.getOrThrow<string>('rabbitmq.queuePrefix');
    const language = this.config.getOrThrow<string>('server.language');
    return `${prefix}-${language}-sms`;
  }

  private async connect(): Promise<void> {
    const url = this.config.getOrThrow<string>('rabbitmq.url');
    try {
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (err: Error) => {
        this.logger.error(`RabbitMQ error: ${err.message}`);
      });

      this.connection.on('close', () => {
        if (!this.isShuttingDown) {
          this.logger.warn('RabbitMQ closed, reconnecting...');
          setTimeout(() => this.connect(), 3000);
        }
      });

      const queueName = this.getQueueName();
      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.prefetch(5);

      this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const job: SmsJob = JSON.parse(msg.content.toString());
          await this.processJob(job);
          this.channel?.ack(msg);
        } catch (err) {
          this.logger.error(`Failed to process SMS job: ${err instanceof Error ? err.message : String(err)}`);
          this.channel?.nack(msg, false, false);
        }
      });

      this.logger.log(`SMS consumer listening on queue: ${queueName}`);
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err instanceof Error ? err.stack : String(err));
      if (!this.isShuttingDown) {
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  private async processJob(job: SmsJob): Promise<void> {
    this.logger.log(`Processing SMS job: ${job.to}`);
    await this.smsService.send(job.to, job.message);
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
