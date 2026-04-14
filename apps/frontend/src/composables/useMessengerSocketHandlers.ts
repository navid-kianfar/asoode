import { type Ref } from 'vue';
import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { ActivityType, type ChannelViewModel, type ConversationViewModel } from '@asoode/shared';

/**
 * Socket handlers for the Messenger page.
 * Appends incoming messages and uploads to the active channel in real-time.
 */
export function useMessengerSocketHandlers(
  activeChannel: Ref<ChannelViewModel | null>,
  activeChannelId: Ref<string>,
) {
  useSocketNotifications({
    [ActivityType.ChannelMessage]: (data: any) => {
      if (!activeChannel.value) return;
      if (data?.channelId !== activeChannelId.value) return;

      const messages = activeChannel.value.messages || [];
      // Avoid duplicates
      if (messages.find((m: ConversationViewModel) => m.id === data.id)) return;
      messages.push(data);
      activeChannel.value.messages = messages;
    },

    [ActivityType.ChannelUpload]: (data: any) => {
      if (!activeChannel.value) return;
      if (data?.channelId !== activeChannelId.value) return;

      const messages = activeChannel.value.messages || [];
      if (messages.find((m: ConversationViewModel) => m.id === data.id)) return;
      messages.push(data);
      activeChannel.value.messages = messages;
    },
  });
}
