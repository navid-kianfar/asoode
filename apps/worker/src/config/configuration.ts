import { registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  language: process.env.LANGUAGE || 'en',
}));

export const smtpConfig = registerAs('smtp', () => ({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'Asoode <noreply@asoode.work>',
}));

export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queuePrefix: process.env.QUEUE_PREFIX || 'asoode',
}));

export const templatesConfig = registerAs('templates', () => ({
  dir: process.env.TEMPLATES_DIR || '../backend/templates',
}));
