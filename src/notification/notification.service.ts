import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { 
  INotificationService, 
  INotificationData, 
  INotificationResult, 
  NotificationStatus
} from './interfaces/notification.interface';
import { NotificationType, ChannelType, ChannelStatus } from '@prisma/client';
import { EmailService } from './services/email.service';
import { WebSocketService } from './services/websocket.service';
import { TemplateService } from './services/template.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './gateways/notification.gateway';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly webSocketService: WebSocketService,
    private readonly templateService: TemplateService,
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async send(notification: INotificationData): Promise<INotificationResult[]> {
    this.logger.log(`Sending notification: ${notification.title} to user ${notification.userId}`);
    
    const results: INotificationResult[] = [];
    
    // Process each channel
    for (const channel of notification.channels) {
      try {
        const result = await this.sendToChannel(notification, channel);
        results.push(result);
        
        if (result.success) {
          this.logger.log(`✅ Notification sent via ${channel.type} to ${channel.recipient}`);
        } else {
          this.logger.warn(`⚠️ Failed to send notification via ${channel.type}: ${result.error}`);
        }
      } catch (error) {
        this.logger.error(`❌ Error sending notification via ${channel.type}: ${error.message}`, error.stack);
        results.push({
          success: false,
          channel: channel.type,
          error: error.message,
        });
      }
    }

    return results;
  }

  async create(createNotificationDto: CreateNotificationDto, userId: string): Promise<INotificationResult[]> {
    try {
      // Create notification in database
      const notification = await this.prisma.notification.create({
        data: {
          userId: userId,
          type: createNotificationDto.type,
          title: createNotificationDto.title,
          content: createNotificationDto.content,
          data: createNotificationDto.data,
          status: NotificationStatus.PENDING,
          scheduledAt: createNotificationDto.scheduledAt ? new Date(createNotificationDto.scheduledAt) : null,
          channels: createNotificationDto.channels as any,
        },
      });

      this.logger.log(`✅ Notification created in database: ${notification.id}`);

      // Convert to INotificationData format
      const notificationData: INotificationData = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        content: notification.content,
        data: notification.data as any,
        channels: notification.channels as any,
        priority: createNotificationDto.priority,
        scheduledAt: notification.scheduledAt ?? undefined,
        expiresAt: createNotificationDto.expiresAt ? new Date(createNotificationDto.expiresAt) : undefined,
      };

      // Send notification
      const results = await this.send(notificationData);

      // Update notification status
      const allSuccessful = results.every(r => r.success);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: allSuccessful ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: allSuccessful ? new Date() : null,
        },
      });

      return results;
    } catch (error) {
      this.logger.error(`❌ Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<INotificationData[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        content: notification.content,
        data: notification.data as any,
        channels: notification.channels as any,
        scheduledAt: notification.scheduledAt ?? undefined,
        expiresAt: undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<INotificationData | null> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return null;
      }

      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        content: notification.content,
        data: notification.data as any,
        channels: notification.channels as any,
        scheduledAt: notification.scheduledAt ?? undefined,
        expiresAt: undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch notification ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto, userId: string): Promise<INotificationData | null> {
    try {
      const notification = await this.prisma.notification.update({
        where: { id, userId },
        data: {
          ...(updateNotificationDto.title && { title: updateNotificationDto.title }),
          ...(updateNotificationDto.content && { content: updateNotificationDto.content }),
          ...(updateNotificationDto.data && { data: updateNotificationDto.data }),
          ...(updateNotificationDto.scheduledAt && { scheduledAt: new Date(updateNotificationDto.scheduledAt) }),
        },
      });

      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        content: notification.content,
        data: notification.data as any,
        channels: notification.channels as any,
        scheduledAt: notification.scheduledAt ?? undefined,
        expiresAt: undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to update notification ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.notification.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete notification ${id}: ${error.message}`, error.stack);
      return false;
    }
  }

  async getUserNotifications(userId: string): Promise<INotificationData[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        content: notification.content,
        data: notification.data as any,
        channels: notification.channels as any,
        scheduledAt: notification.scheduledAt ?? undefined,
        expiresAt: undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch notifications for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPendingNotifications(userId: string): Promise<INotificationData[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { 
          userId,
          status: NotificationStatus.PENDING,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        content: notification.content,
        data: notification.data as any,
        channels: notification.channels as any,
        scheduledAt: notification.scheduledAt ?? undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch pending notifications for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.notification.update({
        where: { 
          id: notificationId,
          userId,
        },
        data: { 
          readAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to mark notification ${notificationId} as read: ${error.message}`, error.stack);
      return false;
    }
  }

  async dismissNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.notification.update({
        where: { 
          id: notificationId,
          userId, // Ensure user can only dismiss their own notifications
        },
        data: { 
          status: NotificationStatus.CANCELLED,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to dismiss notification ${notificationId}: ${error.message}`, error.stack);
      return false;
    }
  }

  // Convenience methods for common notification types
  async sendBookingConfirmation(userId: string, bookingData: any): Promise<INotificationResult[]> {
    return this.create({
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Đặt phòng thành công',
      content: `Đặt phòng của bạn đã được xác nhận. Mã đặt phòng: ${bookingData.bookingId}`,
      data: bookingData,
      channels: [
        { type: ChannelType.EMAIL, recipient: bookingData.email, template: 'notification' },
        { type: ChannelType.IN_APP, recipient: userId },
      ],
    }, userId);
  }

  async sendPaymentSuccess(userId: string, paymentData: any): Promise<INotificationResult[]> {
    return this.create({
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Thanh toán thành công',
      content: `Thanh toán ${paymentData.amount} VND đã được xử lý thành công.`,
      data: paymentData,
      channels: [
        { type: ChannelType.EMAIL, recipient: paymentData.email, template: 'notification' },
        { type: ChannelType.IN_APP, recipient: userId },
      ],
    }, userId);
  }

  async sendWelcomeEmail(userId: string, userData: any): Promise<INotificationResult[]> {
    return this.create({
      type: NotificationType.WELCOME,
      title: 'Chào mừng đến với Dorm Booking System',
      content: `Chào mừng ${userData.name || 'bạn'}! Cảm ơn bạn đã đăng ký tài khoản.`,
      data: {
        ...userData,
        codeId: userData.codeId,
        codeExpired: userData.codeExpired,
      },
      channels: [
        { type: ChannelType.EMAIL, recipient: userData.email, template: 'notification' },
        { type: ChannelType.IN_APP, recipient: userId },
      ],
    }, userId);
  }

  private async sendToChannel(notification: INotificationData, channel: any): Promise<INotificationResult> {
    switch (channel.type) {
      case ChannelType.EMAIL:
        return this.sendEmailNotification(notification, channel);
      
      case ChannelType.IN_APP:
        return this.sendWebSocketNotification(notification, channel);
      
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  private async sendEmailNotification(notification: INotificationData, channel: any): Promise<INotificationResult> {
    try {
      let content = notification.content;
      
      // Use template if specified
      if (channel.template) {
        const templateData = {
          ...notification.data,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          userId: notification.userId,
        };
        content = await this.templateService.renderEmailTemplate(channel.template, templateData);
      }

      return await this.emailService.sendEmail(
        channel.recipient,
        channel.subject || notification.title,
        content,
        channel.template,
        notification.data
      );
    } catch (error) {
      this.logger.error(`Email notification failed: ${error.message}`, error.stack);
      return {
        success: false,
        channel: 'EMAIL' as any,
        error: error.message,
      };
    }
  }

  private async sendWebSocketNotification(notification: INotificationData, channel: any): Promise<INotificationResult> {
    try {
      const result = await this.webSocketService.sendToUser(channel.recipient, notification);
      
      if (result.success) {
        // Also send via gateway for real-time delivery
        await this.notificationGateway.sendToUser(channel.recipient, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          data: notification.data,
          priority: notification.priority,
          timestamp: new Date().toISOString(),
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`WebSocket notification failed: ${error.message}`, error.stack);
      return {
        success: false,
        channel: 'IN_APP' as any,
        error: error.message,
      };
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
