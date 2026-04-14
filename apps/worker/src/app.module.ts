import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  serverConfig,
  smtpConfig,
  rabbitmqConfig,
  templatesConfig,
} from './config/configuration';
import { EmailService } from './services/email.service';
import { TemplateService } from './services/template.service';
import { SmsService, ConsoleSmsProvider } from './services/sms.service';
import { EmailConsumer } from './consumers/email.consumer';
import { SmsConsumer } from './consumers/sms.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, smtpConfig, rabbitmqConfig, templatesConfig],
      envFilePath: '.env',
    }),
  ],
  providers: [EmailService, TemplateService, ConsoleSmsProvider, SmsService, EmailConsumer, SmsConsumer],
})
export class AppModule {}
