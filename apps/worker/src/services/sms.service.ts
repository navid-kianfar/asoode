import { Injectable, Logger } from '@nestjs/common';

export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

/**
 * Console SMS provider — logs OTP to console for development.
 * Replace with a real provider (Kavenegar, Twilio, etc.) when needed.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async send(to: string, message: string): Promise<void> {
    this.logger.log(`\n========== SMS ==========`);
    this.logger.log(`To:      ${to}`);
    this.logger.log(`Message: ${message}`);
    this.logger.log(`=========================\n`);
  }
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly provider: ConsoleSmsProvider) {}

  async send(to: string, message: string): Promise<void> {
    try {
      await this.provider.send(to, message);
      this.logger.log(`SMS sent to ${to}`);
    } catch (err) {
      this.logger.error(
        `Failed to send SMS to ${to}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }
}
