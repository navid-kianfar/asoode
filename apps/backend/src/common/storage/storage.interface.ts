import { Readable } from 'stream';

export interface IStorageService {
  upload(key: string, buffer: Buffer, contentType: string, size?: number): Promise<string>;
  getPublicUrl(key: string): string;
  getPresignedUrl(key: string, expiry?: number): Promise<string>;
  delete(key: string): Promise<void>;
  getStream(key: string): Promise<Readable>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
