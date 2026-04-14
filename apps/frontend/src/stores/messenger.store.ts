import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type ChannelRepository, type ChannelViewModel, type ConversationViewModel,
  type OperationResult, OperationResultStatus, API,
  type SendMessageDto,
} from '@asoode/shared';
import { httpService } from '@/services/http.service';

export const useMessengerStore = defineStore('messenger', () => {
  const channels = ref<ChannelRepository>({ directs: [] });
  const lock = ref(false);

  async function load(): Promise<void> {
    const result = await httpService.post<ChannelRepository>(API.MESSENGER_CHANNELS);
    if (result.status === OperationResultStatus.Success) {
      channels.value = result.data || { directs: [] };
    }
  }

  async function fetchChannel(recordId: string): Promise<OperationResult<ChannelViewModel>> {
    return httpService.post<ChannelViewModel>(API.MESSENGER_FETCH(recordId));
  }

  async function send(recordId: string, model: SendMessageDto): Promise<OperationResult<ConversationViewModel>> {
    return httpService.post<ConversationViewModel>(API.MESSENGER_SEND(recordId), model);
  }

  async function attach(recordId: string, files: File[], onProgress: (p: number) => void): Promise<OperationResult<any>> {
    return httpService.upload<any>(API.MESSENGER_ATTACH(recordId), files, {}, onProgress);
  }

  async function channelFiles(recordId: string): Promise<OperationResult<ConversationViewModel[]>> {
    return httpService.post<ConversationViewModel[]>(API.MESSENGER_CHANNEL_FILES(recordId));
  }

  return { channels, lock, load, fetchChannel, send, attach, channelFiles };
});
