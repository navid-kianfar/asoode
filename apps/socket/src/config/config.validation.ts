import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  LANGUAGE: Joi.string().valid('en', 'fa', 'ar').default('en'),
  PORT: Joi.number().default(8020),
  BACKEND_SERVER: Joi.string().default('0.0.0.0'),
  RABBITMQ_URL: Joi.string().required(),
  QUEUE_PREFIX: Joi.string().default('asoode'),
  VAPID_EMAIL: Joi.string().required(),
  VAPID_PUBLIC_KEY: Joi.string().required(),
  VAPID_PRIVATE_KEY: Joi.string().required(),
});
