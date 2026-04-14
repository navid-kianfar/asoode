import { onUnmounted } from 'vue';
import { useSocket } from '@/composables/useSocket';

export type ContextType = 'work-package' | 'channel' | 'task-modal' | 'files' | 'workflow' | 'dashboard';

/**
 * Tells the socket server what the user is currently viewing.
 * This is used to suppress push notifications for events the user
 * can already see in real-time via socket updates.
 *
 * Call this in any page/modal component that shows real-time data.
 * Focus is automatically cleared when the component unmounts.
 */
export function useViewContext(contextType: ContextType, contextId: string) {
  const { emit } = useSocket();

  if (contextId) {
    emit('focus:set', { contextType, contextId });
  }

  onUnmounted(() => {
    emit('focus:clear', {});
  });

  function updateContext(newContextId: string) {
    if (newContextId) {
      emit('focus:set', { contextType, contextId: newContextId });
    } else {
      emit('focus:clear', {});
    }
  }

  return { updateContext };
}
