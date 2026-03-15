import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateNotificationDto } from '../../notification/dto/create-notification.dto';
import { NotificationService } from '../../notification/notification.service';
import { RabbitMQTopics } from './rabbitmq.topic';

@Controller()
export class RabbitMQConsumerController implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumerController.name);

  constructor(private readonly notificationService: NotificationService) {}

  onModuleInit() {
    this.logger.log('🚀 RabbitMQ Consumer initialized successfully');
    this.logger.log(
      '📡 Listening for events: booking.created, booking.canceled, create.user, resend.verification.code',
    );
    this.logger.log('🔗 Ready to receive messages from RabbitMQ');
    this.logger.log('✅ Consumer is ready to process messages');
  }

  @EventPattern('booking.created')
  async handleBookingCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log(
        `Received booking.created event: ${JSON.stringify(data)}`,
      );

      if (!data.userId || !data.bookingId) {
        throw new Error('Missing required fields: userId, bookingId');
      }

      // Send booking confirmation notification
      await this.notificationService.sendBookingConfirmation(data.userId, data);

      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.error(
        `Error processing booking.created: ${error.message}`,
        error.stack,
      );
      const channel = context.getChannelRef();
      channel.nack(context.getMessage(), false, true);
    }
  }

  @EventPattern('booking.canceled')
  async handleBookingCanceled(
    @Payload() data: { bookingId: string; userId: string; reason?: string },
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(
        `Received booking.canceled event: ${JSON.stringify(data)}`,
      );

      // Send booking cancellation notification
      await this.notificationService.create(
        {
          type: 'BOOKING_CANCELED' as any,
          title: 'Đặt phòng đã bị hủy',
          content: `Đặt phòng ${data.bookingId} đã bị hủy${data.reason ? `. Lý do: ${data.reason}` : '.'}`,
          data: data,
          channels: [{ type: 'WEBSOCKET' as any, recipient: data.userId }],
        },
        data.userId,
      );

      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.error(
        `Error processing booking.canceled: ${error.message}`,
        error.stack,
      );
      const channel = context.getChannelRef();
      channel.nack(context.getMessage(), false, true);
    }
  }

  @EventPattern(RabbitMQTopics.CREATE_NOTIFICATION)
  async handleCreateNotification(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(
        `Received create notification event: ${JSON.stringify(data)}`,
      );

      // Create notification
      await this.notificationService.create(data, data.userId);

      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.error(
        `Error processing create notification: ${error.message}`,
        error.stack,
      );
      const channel = context.getChannelRef();
      channel.nack(context.getMessage(), false, true);
    }
  }

  @EventPattern(RabbitMQTopics.SEND_NOTIFICATION)
  async handleSendNotification(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(
        `Received send notification event: ${JSON.stringify(data)}`,
      );

      // Send notification
      await this.notificationService.send(data);

      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.error(
        `Error processing send notification: ${error.message}`,
        error.stack,
      );
      const channel = context.getChannelRef();
      channel.nack(context.getMessage(), false, true);
    }
  }

  @EventPattern(RabbitMQTopics.CREATE_USER)
  async handleCreateUser(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log(`🎯 CREATE_USER event received!`);
      this.logger.log(`📦 Data: ${JSON.stringify(data)}`);

      // Check if required fields exist
      if (!data.id) {
        this.logger.error(`❌ Missing required field: id`);
        throw new Error('Missing required field: id');
      }

      this.logger.log(`👤 Processing user creation for ID: ${data.id}`);

      // Create user - use data.id as userId
      const result = await this.notificationService.sendWelcomeEmail(
        data.id,
        data,
      );

      this.logger.log(
        `✅ Welcome email sent successfully: ${JSON.stringify(result)}`,
      );

      const channel = context.getChannelRef();
      channel.ack(context.getMessage());

      this.logger.log(`✅ Message acknowledged successfully`);
    } catch (error) {
      this.logger.error(
        `❌ Error processing create user: ${error.message}`,
        error.stack,
      );
      const channel = context.getChannelRef();
      channel.nack(context.getMessage(), false, true);
    }
  }

  @EventPattern(RabbitMQTopics.RESEND_VERIFICATION_CODE)
  async handleResendVerificationCode(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`🎯 RESEND_VERIFICATION_CODE event received!`);
      this.logger.log(`📦 Data: ${JSON.stringify(data)}`);

      if (!data.id || !data.email || !data.codeId || !data.codeExpired) {
        this.logger.error(`❌ Missing required fields: id, email, codeId, codeExpired`);
        throw new Error(
          'Missing required fields: id, email, codeId, codeExpired',
        );
      }

      const result = await this.notificationService.sendResendVerificationEmail(
        data.id,
        {
          email: data.email,
          name: data.name,
          codeId: data.codeId,
          codeExpired: data.codeExpired,
        },
      );

      this.logger.log(
        `✅ Resend verification email sent successfully: ${JSON.stringify(result)}`,
      );

      const channel = context.getChannelRef();
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.error(
        `❌ Error processing resend verification: ${error.message}`,
        error.stack,
      );
      const channel = context.getChannelRef();
      channel.nack(context.getMessage(), false, true);
    }
  }
}
