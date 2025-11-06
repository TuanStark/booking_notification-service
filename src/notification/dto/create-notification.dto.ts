// src/notification/dto/create-notification.dto.ts
import { IsString, IsEnum, IsArray, IsOptional, IsObject, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationPriority } from '../interfaces/notification.interface';
import { NotificationType, ChannelType } from '@prisma/client';

export class NotificationChannelDto {
  @IsEnum(ChannelType)
  type: ChannelType;

  @IsString()
  recipient: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationChannelDto)
  channels: NotificationChannelDto[];

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}