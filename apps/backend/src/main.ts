import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Asoode API')
    .setDescription('Asoode project management REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('server.port');
  const host = configService.getOrThrow<string>('server.host');

  await app.listen(port, host);
  logger.log(`Asoode Backend running on http://${host}:${port}`);
  logger.log(`Swagger docs available at http://${host}:${port}/docs`);
}

bootstrap();
