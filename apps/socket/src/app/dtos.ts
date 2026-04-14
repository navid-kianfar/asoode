interface BaseNotification {
  url: string;
  title: string;
  avatar: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface SocketNotificationData extends BaseNotification {
  data: {
    users: string[];
    data: Record<string, unknown>;
    type: number;
  };
}

export interface PushNotificationData extends BaseNotification {
  data: {
    users: PushNotificationDTO[];
    data: Record<string, unknown>;
    type: number;
  };
}

export interface PushNotificationDTO {
  id: string;
  userId: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  expirationTime?: number | null;
  createdAt: string;
}
