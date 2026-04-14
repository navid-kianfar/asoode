import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { IStorageService } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private basePath!: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.basePath = this.configService.get<string>(
      'storage.localPath',
      './uploads',
    );
    await fs.mkdir(this.basePath, { recursive: true });
    this.logger.log(
      `Local storage initialized at: ${path.resolve(this.basePath)}`,
    );
  }

  private safePath(key: string): string {
    const resolved = path.resolve(this.basePath, key);
    if (!resolved.startsWith(path.resolve(this.basePath))) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    return resolved;
  }

  async upload(
    key: string,
    buffer: Buffer,
    _contentType: string,
    _size?: number,
  ): Promise<string> {
    const filePath = this.safePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  }

  getPublicUrl(key: string): string {
    return `/storage/file/${key}`;
  }

  async getPresignedUrl(key: string, _expiry = 3600): Promise<string> {
    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.safePath(key);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async getStream(key: string): Promise<Readable> {
    const filePath = this.safePath(key);
    return createReadStream(filePath);
  }
}
