import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from '../config/config.validation';
import {
  serverConfig,
  rabbitmqConfig,
  vapidConfig,
} from '../config/configuration';
import { QueueModule } from '../queue/queue.module';
import { HealthController } from './controllers/health.controller';
import { MainGateway } from './gateways/main.gateway';
import { NotificationService } from './services/notification.service';
import { PushService } from './services/push.service';
import { MessageHandlerService } from './services/message-handler.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, rabbitmqConfig, vapidConfig],
      validationSchema: configValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    QueueModule,
  ],
  controllers: [HealthController],
  providers: [
    MainGateway,
    NotificationService,
    PushService,
    MessageHandlerService,
  ],
})
export class ApplicationModule {}
