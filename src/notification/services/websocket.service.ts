// src/notification/services/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { IWebSocketService, INotificationData, INotificationResult, ChannelType } from '../interfaces/notification.interface';

@Injectable()
export class WebSocketService implements IWebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor() {}

  // Track user connections
  addConnection(userId: string, socketId: string): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
    this.logger.log(`User ${userId} connected with socket ${socketId}`);
  }

  removeConnection(userId: string, socketId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
    this.logger.log(`User ${userId} disconnected socket ${socketId}`);
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  getUserConnections(userId: string): string[] {
    const userSockets = this.connectedUsers.get(userId);
    return userSockets ? Array.from(userSockets) : [];
  }

  async sendToUser(userId: string, notification: INotificationData): Promise<INotificationResult> {
    try {
      const userSockets = this.connectedUsers.get(userId);
      
      if (!userSockets || userSockets.size === 0) {
        this.logger.warn(`User ${userId} is not connected`);
        return {
          success: false,
          channel: ChannelType.WEBSOCKET,
          error: 'User not connected',
        };
      }

      const notificationPayload = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        data: notification.data,
        priority: notification.priority,
        timestamp: new Date().toISOString(),
      };

      // This would be called from WebSocket Gateway
      // For now, we'll simulate the success
      this.logger.log(`📡 Sending WebSocket notification to user ${userId}: ${notification.title}`);

      return {
        success: true,
        channel: ChannelType.WEBSOCKET,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send WebSocket notification to user ${userId}: ${error.message}`, error.stack);
      
      return {
        success: false,
        channel: ChannelType.WEBSOCKET,
        error: error.message,
      };
    }
  }

  async sendToRoom(room: string, notification: INotificationData): Promise<INotificationResult> {
    try {
      this.logger.log(`📡 Broadcasting WebSocket notification to room ${room}: ${notification.title}`);

      // This would be called from WebSocket Gateway
      // For now, we'll simulate the success
      return {
        success: true,
        channel: ChannelType.WEBSOCKET,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to broadcast WebSocket notification to room ${room}: ${error.message}`, error.stack);
      
      return {
        success: false,
        channel: ChannelType.WEBSOCKET,
        error: error.message,
      };
    }
  }

  async broadcast(notification: INotificationData): Promise<INotificationResult> {
    try {
      this.logger.log(`📡 Broadcasting WebSocket notification to all users: ${notification.title}`);

      // This would be called from WebSocket Gateway
      // For now, we'll simulate the success
      return {
        success: true,
        channel: ChannelType.WEBSOCKET,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to broadcast WebSocket notification: ${error.message}`, error.stack);
      
      return {
        success: false,
        channel: ChannelType.WEBSOCKET,
        error: error.message,
      };
    }
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  getAllConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
