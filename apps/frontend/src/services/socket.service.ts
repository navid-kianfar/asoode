import { io, type Socket } from 'socket.io-client';
import { runtimeConfig } from './runtime-config.service';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string, endpoint?: string): void {
    if (this.socket?.connected) return;

    const url = endpoint || runtimeConfig.socketUrl || window.location.origin;
    this.socket = io(url, {
      query: { userId },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Re-attach stored listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb as any);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback as any);
  }

  off(event: string, callback?: Function): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
