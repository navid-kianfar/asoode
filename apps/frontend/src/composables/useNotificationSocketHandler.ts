import { useSocket } from '@/composables/useSocket';
import { useNotificationStore } from '@/stores/notification.store';
import { onUnmounted } from 'vue';

/**
 * Listens to all push-notification socket events and feeds them into
 * the notification store for the in-app notification center.
 * Call once in App.vue.
 */
export function useNotificationSocketHandler() {
  const { on, off } = useSocket();
  const notificationStore = useNotificationStore();

  const handler = (notification: any) => {
    if (!notification?.type) return;

    // Socket payload: { type, data, push: { title, description, avatar, url } }
    const push = notification.push || {};
    notificationStore.addNotification({
      type: notification.type,
      title: push.title || '',
      description: push.description || '',
      avatar: push.avatar || '',
      url: push.url || '',
      data: notification.data,
      createdAt: new Date().toISOString(),
    });
  };

  on('push-notification', handler);

  onUnmounted(() => {
    off('push-notification', handler);
  });
}
