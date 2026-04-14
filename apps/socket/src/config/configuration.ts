import { registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  language: process.env.LANGUAGE || 'en',
  port: parseInt(process.env.PORT || '8020', 10),
  host: process.env.BACKEND_SERVER || '0.0.0.0',
}));

export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queuePrefix: process.env.QUEUE_PREFIX || 'asoode',
}));

export const vapidConfig = registerAs('vapid', () => ({
  email: process.env.VAPID_EMAIL || 'mailto:admin@asoode.work',
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
}));
