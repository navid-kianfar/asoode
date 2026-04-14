import { onUnmounted } from 'vue';
import { useSocket } from '@/composables/useSocket';
import { ActivityType } from '@asoode/shared';

export interface SocketNotification {
  type: ActivityType;
  data: any;
}

export type NotificationHandler = (notification: SocketNotification) => void;

/**
 * Composable for listening to socket push-notification events.
 * Automatically registers/unregisters handlers on component lifecycle.
 */
export function useSocketNotifications(
  handlers: Partial<Record<ActivityType, (data: any) => void>>,
) {
  const { on, off } = useSocket();

  const handler: NotificationHandler = (notification) => {
    const fn = handlers[notification.type];
    if (fn) {
      fn(notification.data);
    }
  };

  on('push-notification', handler);

  onUnmounted(() => {
    off('push-notification', handler);
  });

  return { handler };
}
