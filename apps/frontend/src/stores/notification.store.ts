import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ActivityType } from '@asoode/shared';

export interface AppNotification {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  avatar?: string;
  url?: string;
  data: any;
  createdAt: string;
  read: boolean;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([]);
  const maxNotifications = 50;

  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);

  function addNotification(notification: Omit<AppNotification, 'id' | 'read'>) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    notifications.value.unshift({ ...notification, id, read: false });
    // Trim old notifications
    if (notifications.value.length > maxNotifications) {
      notifications.value = notifications.value.slice(0, maxNotifications);
    }
  }

  function markAsRead(id: string) {
    const found = notifications.value.find((n) => n.id === id);
    if (found) found.read = true;
  }

  function markAllAsRead() {
    notifications.value.forEach((n) => (n.read = true));
  }

  function clear() {
    notifications.value = [];
  }

  return { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clear };
});
