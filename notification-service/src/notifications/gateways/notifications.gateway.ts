import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');
  private connectedUsers: Map<number, string[]> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove client from all user rooms
    this.connectedUsers.forEach((sockets, userId) => {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const { userId } = data;
    if (!userId) return;

    // Join user-specific room
    client.join(`user-${userId}`);

    // Track connected sockets for this user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.push(client.id);
    }

    this.logger.log(`User ${userId} subscribed with socket ${client.id}`);

    return { event: 'subscribed', data: { userId, socketId: client.id } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const { userId } = data;
    if (!userId) return;

    client.leave(`user-${userId}`);

    const sockets = this.connectedUsers.get(userId);
    if (sockets) {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
      }
    }

    this.logger.log(`User ${userId} unsubscribed`);
  }

  // Send notification to a specific user
  sendToUser(userId: number, notification: any) {
    this.server.to(`user-${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user ${userId}`);
  }

  // Send notification to all connected clients
  sendBroadcast(notification: any) {
    this.server.emit('broadcast', notification);
    this.logger.log('Broadcast notification sent');
  }

  // Check if user is connected
  isUserConnected(userId: number): boolean {
    const sockets = this.connectedUsers.get(userId);
    return sockets !== undefined && sockets.length > 0;
  }
}
