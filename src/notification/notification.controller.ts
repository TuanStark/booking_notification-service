// src/notification/notification.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException, HttpStatus } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationType, ChannelType } from './interfaces/notification.interface';
import { ResponseData } from 'src/common/global/globalClass';
import { HttpMessage } from 'src/common/global/globalEnum';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto, @Req() req: Request) {
    // Extract userId from x-user-id header sent by API Gateway
    const userId = req.headers['x-user-id'] as string;
    console.log('Create booking request received:', createNotificationDto);
    console.log('Create booking request received:', req);
    console.log('UserId from header:', userId);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    try {
      const notification = await this.notificationService.create(createNotificationDto, userId);
      return new ResponseData(notification, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  async findAll() {
    try {
      const notifications = await this.notificationService.findAll();
      return new ResponseData(notifications, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const notification = await this.notificationService.findOne(id);
      return new ResponseData(notification, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto, @Req() req: Request) {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    try {
      const notification = await this.notificationService.update(id, updateNotificationDto, userId);
      return new ResponseData(notification, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const notification = await this.notificationService.remove(id);
      return new ResponseData(notification, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('user/:userId')
  async getUserNotifications(@Param('userId') userId: string) {
    try {
      const notifications = await this.notificationService.getUserNotifications(userId);
      return new ResponseData(notifications, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('user/:userId/pending')
  getPendingNotifications(@Param('userId') userId: string) {
    return this.notificationService.getPendingNotifications(userId);
  }

  @Post('mark-read/:notificationId/:userId')
  markAsRead(
    @Param('notificationId') notificationId: string,
    @Param('userId') userId: string
  ) {
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Post('dismiss/:notificationId/:userId')
  dismissNotification(
    @Param('notificationId') notificationId: string,
    @Param('userId') userId: string
  ) {
    return this.notificationService.dismissNotification(notificationId, userId);
  }

  // Convenience endpoints for common notification types
  @Post('booking-confirmation')
  sendBookingConfirmation(@Body() body: { userId: string; bookingData: any }) {
    return this.notificationService.sendBookingConfirmation(body.userId, body.bookingData);
  }

  @Post('payment-success')
  sendPaymentSuccess(@Body() body: { userId: string; paymentData: any }) {
    return this.notificationService.sendPaymentSuccess(body.userId, body.paymentData);
  }

  @Post('welcome')
  sendWelcomeEmail(@Body() body: { userId: string; userData: any }) {
    return this.notificationService.sendWelcomeEmail(body.userId, body.userData);
  }

  // Test RabbitMQ connection - simple endpoint
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      rabbitmq: 'ready'
    };
  }

  // Test RabbitMQ connection
  @Get('test-rabbitmq')
  async testRabbitMQ() {
    return new ResponseData({
      message: 'Notification service is running and ready to receive RabbitMQ messages',
      timestamp: new Date().toISOString(),
      status: 'ready'
    }, HttpStatus.OK, HttpMessage.SUCCESS);
  }

  // Test endpoint
  @Post('test')
  async testNotification(@Body() body: { email: string }, @Req() req: Request) {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    try {
      const notification = await this.notificationService.create({
        type: NotificationType.WELCOME,
        title: 'Test Notification',
        content: 'This is a test notification to verify the system is working.',
        channels: [
          { type: ChannelType.EMAIL, recipient: body.email, template: 'notification' },
          { type: ChannelType.IN_APP, recipient: userId },
        ],
      }, userId);
      return new ResponseData(notification, HttpStatus.CREATED, HttpMessage.CREATED);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}