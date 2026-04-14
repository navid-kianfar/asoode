import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/stores/auth.store';

export function useSocket() {
  function connect(): void {
    const authStore = useAuthStore();
    if (authStore.isAuthenticated && authStore.userId) {
      socketService.connect(authStore.userId);
    }
  }

  function disconnect(): void {
    socketService.disconnect();
  }

  function on(event: string, callback: Function): void {
    socketService.on(event, callback);
  }

  function off(event: string, callback?: Function): void {
    socketService.off(event, callback);
  }

  function emit(event: string, data?: any): void {
    socketService.emit(event, data);
  }

  return { connect, disconnect, on, off, emit };
}
