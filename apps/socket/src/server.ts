import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as webPush from 'web-push';
import { ApplicationModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(ApplicationModule, {
    cors: {
      credentials: true,
      origin: true,
    },
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  const vapidEmail = configService.getOrThrow<string>('vapid.email');
  const vapidPublicKey = configService.getOrThrow<string>('vapid.publicKey');
  const vapidPrivateKey = configService.getOrThrow<string>('vapid.privateKey');

  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  const port = configService.getOrThrow<number>('server.port');
  const host = configService.getOrThrow<string>('server.host');

  await app.listen(port, host);
  logger.log(`Application listening on ${host}:${port}`);
}

bootstrap();
