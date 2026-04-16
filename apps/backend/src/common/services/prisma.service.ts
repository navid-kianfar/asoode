import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable({ scope: Scope.DEFAULT })
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool | null = null;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      this.logger.error('DATABASE_URL is not defined');
      throw new Error('DATABASE_URL is required');
    }
    this.pool = new Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);
    Object.assign(this, { adapter });
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
    this.logger.log('Disconnected from PostgreSQL');
  }
}
