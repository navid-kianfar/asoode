import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from '../../queue/queue.service';
import { QUEUE_SUFFIXES } from '../../queue/queue.constants';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import {
  PushNotificationData,
  SocketNotificationData,
} from '../dtos';

@Injectable()
export class MessageHandlerService implements OnModuleInit {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly notificationService: NotificationService,
    private readonly pushService: PushService,
  ) {}

  async onModuleInit(): Promise<void> {
    const pushQueue = this.queueService.getQueueName(QUEUE_SUFFIXES.PUSH);
    const socketQueue = this.queueService.getQueueName(QUEUE_SUFFIXES.SOCKET);

    this.queueService.registerHandler(pushQueue, (content) =>
      this.handlePushNotification(content),
    );
    this.queueService.registerHandler(socketQueue, (content) =>
      this.handleSocketNotification(content),
    );

    await this.queueService.connect();
  }

  private async handlePushNotification(content: string): Promise<void> {
    let parsed: PushNotificationData;
    try {
      parsed = JSON.parse(content) as PushNotificationData;
    } catch (err) {
      this.logger.error(
        'Failed to parse push notification message',
        err instanceof Error ? err.stack : String(err),
      );
      return;
    }

    if (!parsed.data?.users?.length) {
      this.logger.debug('Push notification has no target users, skipping');
      return;
    }

    const model = {
      notification: {
        body: parsed.description,
        title: parsed.title,
        vibrate: [300, 100, 400, 100, 400, 100, 400],
        requireInteraction: true,
        icon: parsed.avatar,
        data: { ...parsed.data.data, url: parsed.url },
        renotify: true,
        tag: parsed.title,
      },
    };

    // Filter out users currently focused on the same context (they see updates in real-time)
    const eventData = parsed.data?.data || {};
    const filteredUsers = parsed.data.users.filter((sub: any) => {
      const userId = typeof sub === 'string' ? sub : sub.userId;
      return !this.notificationService.isUserFocusedOn(userId, eventData);
    });

    if (filteredUsers.length === 0) {
      this.logger.debug('All push recipients are focused on this context, skipping push');
      return;
    }

    await this.pushService.sendToSubscriptions(filteredUsers, model);
  }

  private async handleSocketNotification(content: string): Promise<void> {
    let parsed: SocketNotificationData;
    try {
      parsed = JSON.parse(content) as SocketNotificationData;
    } catch (err) {
      this.logger.error(
        'Failed to parse socket notification message',
        err instanceof Error ? err.stack : String(err),
      );
      return;
    }

    if (!parsed.data?.users?.length) {
      this.logger.debug('Socket notification has no target users, skipping');
      return;
    }

    const model = {
      type: parsed.data.type,
      data: parsed.data.data,
      push: {
        title: parsed.title,
        description: parsed.description,
        avatar: parsed.avatar,
        url: parsed.url,
      },
    };

    this.logger.log(
      `Sending "${parsed.description}" to ${parsed.data.users.length} users`,
    );
    this.notificationService.sendToSelected(
      parsed.data.users,
      'push-notification',
      model,
    );
  }
}
