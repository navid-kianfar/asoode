import { Injectable, Logger } from '@nestjs/common';
import * as webPush from 'web-push';
import { PushNotificationDTO } from '../dtos';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async sendToSubscriptions(
    subscriptions: PushNotificationDTO[],
    payload: object,
  ): Promise<void> {
    const payloadString = JSON.stringify(payload);

    const validSubscriptions = subscriptions.filter(
      (sub) => sub.endpoint && sub.auth && sub.p256dh,
    );

    const results = await Promise.allSettled(
      validSubscriptions.map((subscription) =>
        webPush
          .sendNotification(
            {
              endpoint: subscription.endpoint,
              expirationTime: subscription.expirationTime ?? null,
              keys: {
                auth: subscription.auth,
                p256dh: subscription.p256dh,
              },
            },
            payloadString,
          )
          .then(() => {
            this.logger.debug(
              `Push sent to user=${subscription.userId} endpoint=${subscription.endpoint}`,
            );
          }),
      ),
    );

    const expired: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const sub = validSubscriptions[i];
        const reason = result.reason as { statusCode?: number; message?: string };
        if (reason?.statusCode === 410) {
          this.logger.warn(
            `Subscription expired (410 Gone): id=${sub.id} user=${sub.userId} endpoint=${sub.endpoint}`,
          );
          expired.push(sub.id);
        } else {
          this.logger.error(
            `Push failed for id=${sub.id} user=${sub.userId}: ${reason?.message || String(result.reason)}`,
          );
        }
      }
    }

    if (expired.length > 0) {
      this.logger.warn(`${expired.length} expired subscriptions detected: ${expired.join(', ')}`);
    }
  }
}
