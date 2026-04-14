import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificationService, FocusContext } from '../services/notification.service';

@WebSocketGateway()
export class MainGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MainGateway.name);

  constructor(private readonly notificationService: NotificationService) {}

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server): void {
    this.notificationService.setServer(server);
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket): void {
    const userId = client.handshake.query['userId'] as string | undefined;
    if (!userId) return;
    this.notificationService.onConnect(userId, client.id);
  }

  handleDisconnect(client: Socket): void {
    const userId = client.handshake.query['userId'] as string | undefined;
    if (!userId) return;
    this.notificationService.onDisconnect(userId, client.id);
    this.notificationService.clearFocus(userId);
  }

  @SubscribeMessage('focus:set')
  handleFocusSet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: FocusContext,
  ): void {
    const userId = client.handshake.query['userId'] as string | undefined;
    if (!userId || !data?.contextType || !data?.contextId) return;
    this.notificationService.setFocus(userId, data);
  }

  @SubscribeMessage('focus:clear')
  handleFocusClear(@ConnectedSocket() client: Socket): void {
    const userId = client.handshake.query['userId'] as string | undefined;
    if (!userId) return;
    this.notificationService.clearFocus(userId);
  }
}
