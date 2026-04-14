import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

export interface FocusContext {
  contextType: string; // 'work-package' | 'channel' | 'task-modal' | 'files' | 'workflow'
  contextId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private server!: Server;
  private readonly onlineUsers = new Map<string, string[]>();
  private readonly userFocus = new Map<string, FocusContext>();

  setServer(server: Server): void {
    this.server = server;
  }

  onConnect(userId: string, clientId: string): void {
    const clients = this.getOrCreateUserClients(userId);
    clients.unshift(clientId);
    this.logger.log(`User ${userId} connected (client: ${clientId})`);
  }

  onDisconnect(userId: string, clientId: string): void {
    const clients = this.onlineUsers.get(userId);
    if (!clients) return;

    const filtered = clients.filter((c) => c !== clientId);
    if (filtered.length === 0) {
      this.onlineUsers.delete(userId);
    } else {
      this.onlineUsers.set(userId, filtered);
    }
    this.logger.log(`User ${userId} disconnected (client: ${clientId})`);
  }

  setFocus(userId: string, context: FocusContext): void {
    this.userFocus.set(userId, context);
  }

  clearFocus(userId: string): void {
    this.userFocus.delete(userId);
  }

  /**
   * Check if a user's current focus matches the event context.
   * If so, push notification should be suppressed (socket still delivered).
   */
  isUserFocusedOn(userId: string, eventData: any): boolean {
    const focus = this.userFocus.get(userId);
    if (!focus) return false;

    switch (focus.contextType) {
      case 'work-package':
        return eventData?.packageId === focus.contextId;
      case 'channel':
        return eventData?.channelId === focus.contextId;
      case 'task-modal':
        return eventData?.taskId === focus.contextId || eventData?.id === focus.contextId;
      case 'files':
        return !!eventData?.isFolder !== undefined; // suppress for any file event when on files page
      case 'workflow':
        return eventData?.id === focus.contextId || eventData?.workflowId === focus.contextId;
      default:
        return false;
    }
  }

  /**
   * Filter out users whose focus context matches the event data.
   * These users don't need push notifications since they can see the update in real-time.
   */
  filterFocusedUsers(userIds: string[], eventData: any): string[] {
    return userIds.filter(userId => !this.isUserFocusedOn(userId, eventData));
  }

  sendToSelected<T>(users: string[], eventName: string, model: T): void {
    users.forEach((userId) => {
      this.sendToOne(userId, eventName, model);
    });
  }

  private sendToOne<T>(
    userId: string,
    eventName: string,
    model: T,
  ): void {
    const clients = this.getOrCreateUserClients(userId);
    this.sendToClients(eventName, clients, model);
  }

  private sendToClients<T>(
    eventName: string,
    clients: string[],
    model: T,
  ): void {
    if (clients.length === 0) {
      this.logger.debug('No connected clients to send to');
      return;
    }

    for (const clientId of clients) {
      try {
        const socket = this.server.sockets.sockets.get(clientId);
        if (socket) {
          socket.emit(eventName, model);
          this.logger.debug(
            `Event "${eventName}" sent to client ${clientId}`,
          );
        } else {
          this.logger.warn(
            `Client ${clientId} not found in connected sockets`,
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed to emit event "${eventName}" to client ${clientId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }

  private getOrCreateUserClients(userId: string): string[] {
    let clients = this.onlineUsers.get(userId);
    if (!clients) {
      clients = [];
      this.onlineUsers.set(userId, clients);
    }
    return clients;
  }
}
