import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  LANGUAGE: Joi.string().valid('en', 'fa', 'ar', 'tr').default('en'),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('30d'),
  RABBITMQ_URL: Joi.string().required(),
  QUEUE_PREFIX: Joi.string().default('asoode'),
  // Storage
  STORAGE_DRIVER: Joi.string().valid('minio', 'local').default('minio'),
  STORAGE_LOCAL_PATH: Joi.string().default('./uploads'),

  // MinIO (only required when STORAGE_DRIVER=minio)
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_ACCESS_KEY: Joi.string().when('STORAGE_DRIVER', {
    is: 'minio',
    then: Joi.required(),
    otherwise: Joi.optional().default(''),
  }),
  MINIO_SECRET_KEY: Joi.string().when('STORAGE_DRIVER', {
    is: 'minio',
    then: Joi.required(),
    otherwise: Joi.optional().default(''),
  }),
  MINIO_USE_SSL: Joi.string().default('false'),
  MINIO_BUCKET: Joi.string().default('asoode'),
});
