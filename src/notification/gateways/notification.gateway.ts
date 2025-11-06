// src/notification/gateways/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketService } from '../services/websocket.service';
import { NotificationService } from '../notification.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly webSocketService: WebSocketService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate WebSocket connection
      const token = client.handshake.auth.token || 
                   client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn('No token provided for WebSocket connection');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn('Invalid token payload for WebSocket connection');
        client.disconnect();
        return;
      }

      // Store connection
      this.webSocketService.addConnection(userId, client.id);

      // Join user-specific room
      client.join(`user:${userId}`);
      
      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to notification service',
        userId,
        timestamp: new Date().toISOString(),
      });

      // Send pending notifications
      const pendingNotifications = await this.notificationService.getPendingNotifications(userId);
      if (pendingNotifications.length > 0) {
        client.emit('pending_notifications', pendingNotifications);
      }

      this.logger.log(`✅ User ${userId} connected via WebSocket (${client.id})`);
    } catch (error) {
      this.logger.error(`❌ WebSocket authentication failed: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      // Find user by socket ID and remove connection
      const userId = this.findUserBySocketId(client.id);
      if (userId) {
        this.webSocketService.removeConnection(userId, client.id);
        this.logger.log(`👋 User ${userId} disconnected WebSocket (${client.id})`);
      }
    } catch (error) {
      this.logger.error(`Error handling WebSocket disconnect: ${error.message}`);
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string }
  ) {
    try {
      const userId = this.findUserBySocketId(client.id);
      if (!userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      await this.notificationService.markAsRead(data.notificationId, userId);
      
      client.emit('notification_read', {
        notificationId: data.notificationId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${userId} marked notification ${data.notificationId} as read`);
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  @SubscribeMessage('dismiss_notification')
  async handleDismissNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string }
  ) {
    try {
      const userId = this.findUserBySocketId(client.id);
      if (!userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      await this.notificationService.dismissNotification(data.notificationId, userId);
      
      client.emit('notification_dismissed', {
        notificationId: data.notificationId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${userId} dismissed notification ${data.notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to dismiss notification: ${error.message}`);
      client.emit('error', { message: 'Failed to dismiss notification' });
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(@ConnectedSocket() client: Socket) {
    try {
      const userId = this.findUserBySocketId(client.id);
      if (!userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const notifications = await this.notificationService.getUserNotifications(userId);
      client.emit('notifications_list', notifications);
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error.message}`);
      client.emit('error', { message: 'Failed to get notifications' });
    }
  }

  // Method to send notification to specific user
  async sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }

  // Method to send notification to all connected users
  async broadcast(notification: any) {
    this.server.emit('broadcast_notification', notification);
  }

  // Method to send notification to a specific room
  async sendToRoom(room: string, notification: any) {
    this.server.to(room).emit('room_notification', notification);
  }

  private findUserBySocketId(socketId: string): string | null {
    // This is a simplified implementation
    // In a real application, you might want to store this mapping in Redis or database
    for (const [userId, sockets] of this.webSocketService['connectedUsers']) {
      if (sockets.has(socketId)) {
        return userId;
      }
    }
    return null;
  }
}
