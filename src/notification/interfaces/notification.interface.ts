// src/notification/interfaces/notification.interface.ts

export interface INotificationData {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority?: NotificationPriority;
  scheduledAt?: Date;
  expiresAt?: Date;
  status?: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount?: number;
}

export interface INotificationChannel {
  type: ChannelType;
  recipient: string;
  subject?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface INotificationResult {
  success: boolean;
  channel: ChannelType;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

export interface INotificationService {
  send(notification: INotificationData): Promise<INotificationResult[]>;
}

export interface IEmailService {
  sendEmail(to: string, subject: string, content: string, template?: string, data?: Record<string, any>): Promise<INotificationResult>;
}

export interface IWebSocketService {
  sendToUser(userId: string, notification: INotificationData): Promise<INotificationResult>;
  sendToRoom(room: string, notification: INotificationData): Promise<INotificationResult>;
  broadcast(notification: INotificationData): Promise<INotificationResult>;
}

export interface ITemplateService {
  render(templateName: string, data: Record<string, any>): Promise<string>;
  getTemplate(templateName: string): string;
}

export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELED = 'BOOKING_CANCELED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  ROOM_DELETED = 'ROOM_DELETED',
  ROOM_UPDATED = 'ROOM_UPDATED',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  WELCOME = 'WELCOME',
  REMINDER = 'REMINDER',
}

export enum ChannelType {
  EMAIL = 'EMAIL',
  WEBSOCKET = 'WEBSOCKET',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export type NotificationChannel = {
  type: ChannelType;
  recipient: string;
  subject?: string;
  template?: string;
  data?: Record<string, any>;
};
