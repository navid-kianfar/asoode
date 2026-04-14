import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { ActivityType } from '@asoode/shared';

/**
 * Socket handlers for the Files page.
 * Triggers a refresh of the current directory when file events occur.
 */
export function useFilesSocketHandlers(refreshFn: () => void) {
  useSocketNotifications({
    [ActivityType.FileUpload]: () => refreshFn(),
    [ActivityType.FileDelete]: () => refreshFn(),
    [ActivityType.FileRename]: () => refreshFn(),
  });
}
