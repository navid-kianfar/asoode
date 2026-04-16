import "dotenv/config";
import { defineConfig, env } from 'prisma/config';
import path from 'node:path';

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
  migrations: {
    path: 'prisma/migrations',
    // seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
