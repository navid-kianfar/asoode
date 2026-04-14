import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { EmailService } from '../services/email.service';
import { TemplateService } from '../services/template.service';

interface EmailJob {
  to: string;
  template: string;
  culture: string;
  data: Record<string, unknown>;
  subject?: string;
  createdAt: string;
}

const SUBJECT_MAP: Record<string, Record<string, string>> = {
  en: {
    'welcome': 'Welcome to Asoode!',
    'verify-email': 'Verify your email address',
    'reset-password': 'Reset your password',
    'invite-group': 'You\'ve been invited to a group',
    'invite-project': 'You\'ve been invited to a project',
    'invite-workpackage': 'You\'ve been invited to a work package',
    'task-assigned': 'You\'ve been assigned to a task',
    'task-updated': 'A task has been updated',
    'task-comment': 'New comment on a task',
    'task-attachment': 'New attachment on a task',
    'digest': 'Your activity digest',
  },
  fa: {
    'welcome': 'به آسوده خوش آمدید!',
    'verify-email': 'تایید آدرس ایمیل',
    'reset-password': 'بازیابی رمز عبور',
    'invite-group': 'دعوت به گروه',
    'invite-project': 'دعوت به پروژه',
    'invite-workpackage': 'دعوت به بسته کاری',
    'task-assigned': 'وظیفه جدید',
    'task-updated': 'به‌روزرسانی وظیفه',
    'task-comment': 'نظر جدید',
    'task-attachment': 'پیوست جدید',
    'digest': 'خلاصه فعالیت‌ها',
  },
  ar: {
    'welcome': 'مرحبًا بك في Asoode!',
    'verify-email': 'تأكيد عنوان البريد الإلكتروني',
    'reset-password': 'إعادة تعيين كلمة المرور',
    'invite-group': 'تمت دعوتك إلى مجموعة',
    'invite-project': 'تمت دعوتك إلى مشروع',
    'invite-workpackage': 'تمت دعوتك إلى حزمة عمل',
    'task-assigned': 'تم تعيين مهمة لك',
    'task-updated': 'تم تحديث المهمة',
    'task-comment': 'تعليق جديد',
    'task-attachment': 'مرفق جديد',
    'digest': 'ملخص النشاط',
  },
  fr: {
    'welcome': 'Bienvenue sur Asoode !',
    'verify-email': 'Vérifiez votre adresse e-mail',
    'reset-password': 'Réinitialiser votre mot de passe',
    'invite-group': 'Invitation à un groupe',
    'invite-project': 'Invitation à un projet',
    'invite-workpackage': 'Invitation à un lot de travail',
    'task-assigned': 'Tâche attribuée',
    'task-updated': 'Tâche mise à jour',
    'task-comment': 'Nouveau commentaire',
    'task-attachment': 'Nouvelle pièce jointe',
    'digest': 'Résumé d\'activité',
  },
};

@Injectable()
export class EmailConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailConsumer.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private isShuttingDown = false;

  constructor(
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
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
    return `${prefix}-${language}-email`;
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
          const job: EmailJob = JSON.parse(msg.content.toString());
          await this.processJob(job);
          this.channel?.ack(msg);
        } catch (err) {
          this.logger.error(`Failed to process email job: ${err instanceof Error ? err.message : String(err)}`);
          // Reject and don't requeue failed messages to avoid infinite loops
          this.channel?.nack(msg, false, false);
        }
      });

      this.logger.log(`Email consumer listening on queue: ${queueName}`);
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err instanceof Error ? err.stack : String(err));
      if (!this.isShuttingDown) {
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  private async processJob(job: EmailJob): Promise<void> {
    const { to, template, culture, data, subject: customSubject } = job;

    this.logger.log(`Processing email job: ${template} -> ${to} (culture: ${culture})`);

    // Render template
    const html = this.templateService.render(template, culture, data);

    // Determine subject
    const subject = customSubject
      || SUBJECT_MAP[culture]?.[template]
      || SUBJECT_MAP['en']?.[template]
      || this.templateService.extractSubject(html, `Asoode - ${template}`);

    // Send email
    await this.emailService.send(to, subject, html);
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
