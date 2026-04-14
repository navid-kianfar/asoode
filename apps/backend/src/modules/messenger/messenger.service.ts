import { Injectable, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ActivityType,
  ConversationType,
  ChannelRepository,
  ChannelViewModel,
  ConversationViewModel,
  MemberInfoViewModel,
  SendMessageDto,
} from '@asoode/shared';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { DomainEventService } from '../../common/services/domain-event.service';
import { IStorageService, STORAGE_SERVICE } from '../../common/storage';

const RECENT_MESSAGES_LIMIT = 20;

@Injectable()
export class MessengerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvent: DomainEventService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────

  private toMemberInfo(user: {
    id: string;
    email: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
  }): MemberInfoViewModel {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const initials = [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
    return {
      id: user.id,
      email: user.email,
      avatar: user.avatar ?? '',
      firstName: user.firstName,
      lastName: user.lastName,
      fullName,
      initials,
      username: user.username,
      bio: user.bio,
    };
  }

  private toConversationViewModel(
    conversation: {
      id: string;
      channelId: string;
      userId: string;
      message: string;
      path: string | null;
      type: number;
      replyId: string | null;
      fromBot: boolean;
      createdAt: Date;
      updatedAt: Date;
      user?: {
        id: string;
        email: string;
        avatar: string | null;
        firstName: string;
        lastName: string;
        username: string;
        bio: string;
      };
    },
  ): ConversationViewModel {
    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      channelId: conversation.channelId,
      userId: conversation.userId,
      message: conversation.message,
      path: conversation.path ?? undefined,
      type: conversation.type as ConversationType,
      replyId: conversation.replyId ?? undefined,
      fromBot: conversation.fromBot,
      member: conversation.user ? this.toMemberInfo(conversation.user) : undefined,
    };
  }

  private async verifyChannelMembership(
    channelId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this channel');
    }
  }

  private async getChannelMemberUserIds(channelId: string): Promise<string[]> {
    const members = await this.prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  // ─── CHANNELS ─────────────────────────────────────────────────

  async channels(userId: string): Promise<ChannelRepository> {
    const channelMemberships = await this.prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });

    const channelIds = channelMemberships.map((cm) => cm.channelId);

    if (channelIds.length === 0) {
      return { directs: [] };
    }

    const channels = await this.prisma.channel.findMany({
      where: { id: { in: channelIds }, active: true },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                avatar: true,
                firstName: true,
                lastName: true,
                username: true,
                bio: true,
              },
            },
          },
        },
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: RECENT_MESSAGES_LIMIT,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                avatar: true,
                firstName: true,
                lastName: true,
                username: true,
                bio: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const directs: ChannelViewModel[] = channels.map((channel) => ({
      id: channel.id,
      type: channel.type,
      userId: channel.userId,
      rootId: channel.rootId ?? undefined,
      title: channel.title,
      attachmentSize: 0,
      members: channel.members.map((m) => this.toMemberInfo(m.user)),
      messages: channel.conversations
        .reverse()
        .map((c) => this.toConversationViewModel(c)),
    }));

    return { directs };
  }

  // ─── FETCH ────────────────────────────────────────────────────

  async fetch(userId: string, channelId: string): Promise<ConversationViewModel[]> {
    await this.verifyChannelMembership(channelId, userId);

    const conversations = await this.prisma.conversation.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            firstName: true,
            lastName: true,
            username: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return conversations.reverse().map((c) => this.toConversationViewModel(c));
  }

  // ─── SEND ─────────────────────────────────────────────────────

  async send(
    userId: string,
    channelId: string,
    dto: SendMessageDto,
  ): Promise<boolean> {
    await this.verifyChannelMembership(channelId, userId);

    if (!dto.message?.trim()) {
      return false;
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        channelId,
        userId,
        message: dto.message.trim(),
        type: ConversationType.Text,
        replyId: dto.replyId || null,
        fromBot: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            firstName: true,
            lastName: true,
            username: true,
            bio: true,
          },
        },
      },
    });

    // Update channel's updatedAt
    await this.prisma.channel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    // Emit domain event to all channel members
    const memberIds = await this.getChannelMemberUserIds(channelId);
    this.domainEvent.emit({
      type: ActivityType.ChannelMessage,
      actorId: userId,
      entityId: channelId,
      entityType: 'channel',
      recipientUserIds: memberIds,
      data: {
        channelId,
        conversation: this.toConversationViewModel(conversation),
      },
      push: {
        title: 'New message',
        description: `New message in channel`,
        url: `/messenger/${channelId}`,
      },
    });

    return true;
  }

  // ─── CHANNEL FILES ───────────────────────────────────────────

  async channelFiles(
    userId: string,
    channelId: string,
  ): Promise<ConversationViewModel[]> {
    await this.verifyChannelMembership(channelId, userId);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        channelId,
        type: ConversationType.Upload,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            firstName: true,
            lastName: true,
            username: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((c) => {
      const vm = this.toConversationViewModel(c);
      if (vm.path) {
        vm.path = this.storage.getPublicUrl(vm.path);
      }
      return vm;
    });
  }

  // ─── CREATE ENTITY CHANNEL ────────────────────────────────────

  async createEntityChannel(
    userId: string,
    type: number,
    rootId: string,
    title: string,
    memberUserIds: string[],
    active = true,
  ): Promise<string> {
    const channel = await this.prisma.channel.create({
      data: {
        userId,
        type,
        rootId,
        title,
        active,
      },
    });

    // Add all members (deduplicated, including the creator)
    const uniqueIds = [...new Set([userId, ...memberUserIds])];
    for (const memberId of uniqueIds) {
      await this.prisma.channelMember.create({
        data: {
          channelId: channel.id,
          userId: memberId,
        },
      });
    }

    this.domainEvent.emit({
      type: ActivityType.ChannelCreate,
      actorId: userId,
      entityId: channel.id,
      entityType: 'channel',
      recipientUserIds: uniqueIds,
      data: {
        channelId: channel.id,
        title,
        type,
        rootId,
      },
      push: {
        title: 'Channel created',
        description: `Channel "${title}" was created`,
      },
    });

    return channel.id;
  }

  // ─── ATTACH ───────────────────────────────────────────────────

  async attach(
    userId: string,
    channelId: string,
    file: Express.Multer.File,
  ): Promise<boolean> {
    await this.verifyChannelMembership(channelId, userId);

    if (!file) {
      return false;
    }

    const extension = file.originalname.split('.').pop() ?? '';
    const key = `messenger/${channelId}/${uuidv4()}.${extension}`;

    await this.storage.upload(key, file.buffer, file.mimetype, file.size);

    const conversation = await this.prisma.conversation.create({
      data: {
        channelId,
        userId,
        message: file.originalname,
        path: key,
        type: ConversationType.Upload,
        fromBot: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            firstName: true,
            lastName: true,
            username: true,
            bio: true,
          },
        },
      },
    });

    // Update channel's updatedAt
    await this.prisma.channel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    // Emit domain event to all channel members
    const memberIds = await this.getChannelMemberUserIds(channelId);
    this.domainEvent.emit({
      type: ActivityType.ChannelUpload,
      actorId: userId,
      entityId: channelId,
      entityType: 'channel',
      recipientUserIds: memberIds,
      data: {
        channelId,
        conversation: this.toConversationViewModel(conversation),
      },
      push: {
        title: 'File shared',
        description: `A file was shared in channel`,
        url: `/messenger/${channelId}`,
      },
    });

    return true;
  }

  // ─── DELETE ENTITY CHANNELS ───────────────────────────────────

  async deleteEntityChannels(rootIds: string[]): Promise<void> {
    if (rootIds.length === 0) return;

    // First find all channels to be deleted to emit events if needed (optional)
    const channels = await this.prisma.channel.findMany({
      where: { rootId: { in: rootIds } },
      select: { id: true },
    });

    const channelIds = channels.map((c) => c.id);
    if (channelIds.length === 0) return;

    // Delete channels - this will cascade delete Conversations and ChannelMembers
    await this.prisma.channel.deleteMany({
      where: { id: { in: channelIds } },
    });
  }
}
