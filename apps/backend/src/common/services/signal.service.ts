import { Injectable, Logger } from '@nestjs/common';
import { ActivityType, ReceiveNotificationType } from '@asoode/shared';
import { PrismaService } from './prisma.service';
import { QueuePublisherService } from './queue-publisher.service';

export interface SignalMeta {
  title?: string;
  description?: string;
  avatar?: string;
  url?: string;
  userId?: string; // the actor who triggered the event
}

export interface SignalParams {
  users: string[];
  type: ActivityType;
  data: Record<string, any>;
  meta?: SignalMeta;
  pushEnabled?: boolean; // default true
}

@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);

  constructor(
    private readonly queuePublisher: QueuePublisherService,
    private readonly prisma: PrismaService,
  ) {}

  async notify(params: SignalParams): Promise<void> {
    const { users, type, data, meta = {}, pushEnabled = true } = params;

    // 1. Always emit socket event to all specified users
    await this.queuePublisher.emitSocket(users, type, data, meta);

    // 2. Emit push notification if enabled and meta has content
    if (!pushEnabled || !meta.title || users.length === 0) return;

    try {
      // Exclude the actor from push notifications
      let pushUsers = meta.userId
        ? users.filter((u) => u !== meta.userId)
        : users;

      if (pushUsers.length === 0) return;

      // Filter by per-work-package notification preferences
      pushUsers = await this.filterByNotificationPreference(pushUsers, data);

      if (pushUsers.length === 0) return;

      // Fetch active push subscriptions for remaining users
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId: { in: pushUsers } },
      });

      if (subscriptions.length === 0) return;

      await this.queuePublisher.emitPush(
        subscriptions.map((s) => ({
          id: s.id,
          userId: s.userId,
          endpoint: s.endpoint,
          auth: s.auth,
          p256dh: s.p256dh,
        })),
        meta.title || '',
        meta.description || '',
        meta.avatar || '',
        meta.url || '',
        data,
        type,
      );
    } catch (err) {
      this.logger.warn(
        'Failed to emit push notification',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async filterByNotificationPreference(
    users: string[],
    data: Record<string, any>,
  ): Promise<string[]> {
    const packageId = data.packageId as string | undefined;
    if (!packageId) return users;

    const settings = await this.prisma.workPackageUserSetting.findMany({
      where: { packageId, userId: { in: users } },
    });

    if (settings.length === 0) return users; // no settings = default ReceiveAll

    const settingsMap = new Map(
      settings.map((s) => [s.userId, s.receiveNotification]),
    );

    return users.filter((userId) => {
      const pref = settingsMap.get(userId);
      if (pref === undefined) return true; // no setting = ReceiveAll
      if (pref === ReceiveNotificationType.ReceiveNone) return false;
      // ReceiveAll and ReceiveMine both get push for now
      return true;
    });
  }
}
