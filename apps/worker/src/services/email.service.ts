import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('smtp.host'),
      port: config.getOrThrow<number>('smtp.port'),
      secure: config.get<boolean>('smtp.secure') || false,
      auth: {
        user: config.getOrThrow<string>('smtp.user'),
        pass: config.getOrThrow<string>('smtp.pass'),
      },
    });

    this.logger.log(`SMTP transport configured: ${config.get<string>('smtp.host')}:${config.get<number>('smtp.port')}`);
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    const from = this.config.getOrThrow<string>('smtp.from');

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }
}
