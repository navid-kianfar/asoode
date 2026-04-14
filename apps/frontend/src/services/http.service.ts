import axios, { type AxiosInstance, type AxiosProgressEvent } from 'axios';
import { OperationResult, OperationResultStatus, type GridFilter, type GridResult } from '@asoode/shared';
import router from '@/router';
import { runtimeConfig } from './runtime-config.service';

class HttpService {
  private client!: AxiosInstance;

  init() {
    this.client = axios.create({
      baseURL: runtimeConfig.apiUrl,
    });

    this.client.interceptors.request.use((config) => {
      const raw = localStorage.getItem('ASOODE_AUTH');
      if (raw) {
        try {
          const identity = JSON.parse(raw);
          if (identity?.token) {
            config.headers.Authorization = `Bearer ${identity.token}`;
          }
        } catch {}
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('ASOODE_AUTH');
          router.push('/login');
        }
        return Promise.reject(error);
      }
    );
  }

  async post<T>(section: string, data?: any, handleNoneSuccess = true): Promise<OperationResult<T>> {
    try {
      const response = await this.client.post<OperationResult<T>>(section, data);
      const result = response.data;
      if (handleNoneSuccess && result.status !== OperationResultStatus.Success) {
        return result;
      }
      return result;
    } catch (error) {
      return OperationResult.Failed<T>(error as Error);
    }
  }

  async upload<T>(
    section: string,
    files: File | File[],
    data: any,
    onProgress: (percent: number) => void
  ): Promise<OperationResult<T>> {
    try {
      const formData = new FormData();
      const fileArr = Array.isArray(files) ? files : [files];
      fileArr.forEach((file) => formData.append('files', file));
      if (data) {
        Object.keys(data).forEach((key) => {
          if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        });
      }
      const response = await this.client.post<OperationResult<T>>(section, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });
      return response.data;
    } catch (error) {
      return OperationResult.Failed<T>(error as Error);
    }
  }

  async grid<T>(param: GridFilter): Promise<OperationResult<GridResult<T>>> {
    return this.post<GridResult<T>>(param.backend, {
      page: param.page,
      pageSize: param.pageSize,
      ...param.params,
    });
  }

  async download(section: string, data: any): Promise<void> {
    try {
      const response = await this.client.post(section, data, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'];
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/"/g, '') || 'download'
        : 'download';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  }

  async formUpload<T>(
    section: string,
    model: any,
    onProgress?: (percent: number) => void
  ): Promise<OperationResult<T>> {
    try {
      const formData = new FormData();
      Object.keys(model).forEach((key) => {
        const val = model[key];
        if (val instanceof File) {
          formData.append(key, val);
        } else if (val !== undefined && val !== null) {
          formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
        }
      });
      const response = await this.client.post<OperationResult<T>>(section, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e: AxiosProgressEvent) => {
              if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
            }
          : undefined,
      });
      return response.data;
    } catch (error) {
      return OperationResult.Failed<T>(error as Error);
    }
  }
}

export const httpService = new HttpService();
