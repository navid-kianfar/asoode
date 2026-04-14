import { registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  language: process.env.LANGUAGE || 'en',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'asoode-jwt-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '30d',
}));

export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queuePrefix: process.env.QUEUE_PREFIX || 'asoode',
}));

export const minioConfig = registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  useSSL: process.env.MINIO_USE_SSL === 'true',
  bucket: process.env.MINIO_BUCKET || 'asoode',
}));

export const storageConfig = registerAs('storage', () => ({
  driver: (process.env.STORAGE_DRIVER || 'minio') as 'minio' | 'local',
  localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
}));
