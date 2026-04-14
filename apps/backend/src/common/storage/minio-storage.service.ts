import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { IStorageService } from './storage.interface';

@Injectable()
export class MinioStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private client!: Minio.Client;
  private bucket!: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.bucket = this.configService.getOrThrow<string>('minio.bucket');
    this.client = new Minio.Client({
      endPoint: this.configService.getOrThrow<string>('minio.endpoint'),
      port: this.configService.getOrThrow<number>('minio.port'),
      accessKey: this.configService.getOrThrow<string>('minio.accessKey'),
      secretKey: this.configService.getOrThrow<string>('minio.secretKey'),
      useSSL: this.configService.getOrThrow<boolean>('minio.useSSL'),
    });

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket: ${this.bucket}`);
      }
      this.logger.log('MinIO connected');
    } catch (err) {
      this.logger.error(
        'MinIO init error',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
    size?: number,
  ): Promise<string> {
    await this.client.putObject(this.bucket, key, buffer, size ?? buffer.length, {
      'Content-Type': contentType,
    });
    return key;
  }

  getPublicUrl(key: string): string {
    return `/storage/file/${key}`;
  }

  async getPresignedUrl(key: string, expiry = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expiry);
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  async getStream(key: string): Promise<Readable> {
    return this.client.getObject(this.bucket, key) as unknown as Readable;
  }
}
