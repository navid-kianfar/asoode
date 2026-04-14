import { BaseViewModel } from '../core/base.model';
import { ChannelType, ConversationType } from '../../enums';
import { MemberInfoViewModel } from '../auth/identity.model';

export interface ChannelRepository {
  directs: ChannelViewModel[];
}

export interface ChannelViewModel {
  attachmentSize: number;
  title: string;
  id: string;
  type: ChannelType;
  userId?: string;
  rootId?: string;
  members: MemberInfoViewModel[];
  messages: ConversationViewModel[];
}

export interface MappedConversationViewModel {
  date: string;
  messages: ConversationViewModel[];
}

export interface ConversationViewModel extends BaseViewModel {
  upload?: any;
  uploadId?: string;
  channelId: string;
  message: string;
  path?: string;
  replyId?: string;
  type: ConversationType;
  userId: string;
  fromBot: boolean;
  member?: MemberInfoViewModel;
}
