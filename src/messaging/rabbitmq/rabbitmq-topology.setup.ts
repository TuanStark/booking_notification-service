import * as amqp from 'amqplib';
import { Logger } from '@nestjs/common';

const logger = new Logger('RabbitMQTopology');

/**
 * Setup RabbitMQ topology: create exchanges, queue, bindings.
 * Notification needs to receive from:
 * - user_exchange: create.user, resend.verification.code (from auth-service)
 * - booking_topic_exchange: booking.created, booking.canceled (from booking-service)
 */
export async function setupRabbitMQTopology(options?: {
  url?: string;
  queue?: string;
}): Promise<void> {
  const url = options?.url || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const queue = options?.queue || process.env.RABBITMQ_QUEUE || 'notification_queue';
  const userExchange = 'user_exchange';
  const bookingExchange = 'booking_topic_exchange';

  let connection: amqp.Connection | null = null;

  try {
    connection = await amqp.connect(url);
    const channel = await connection.createChannel();

    // 1. Assert topic exchanges (idempotent - create if not exist)
    await channel.assertExchange(userExchange, 'topic', { durable: true });
    await channel.assertExchange(bookingExchange, 'topic', { durable: true });

    // 2. Assert queue (NestJS will use this same queue)
    await channel.assertQueue(queue, { durable: true });

    // 3. Bind queue to user_exchange (auth-service events)
    await channel.bindQueue(queue, userExchange, 'create.user');
    await channel.bindQueue(queue, userExchange, 'resend.verification.code');

    // 4. Bind queue to booking_topic_exchange (booking-service events)
    await channel.bindQueue(queue, bookingExchange, 'booking.created');
    await channel.bindQueue(queue, bookingExchange, 'booking.canceled');

    await channel.close();

    logger.log(
      `✅ RabbitMQ topology setup: ${queue} bound to ${userExchange} + ${bookingExchange}`,
    );
    logger.log(`   URL: ${url.replace(/:[^:@]+@/, ':****@')}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ RabbitMQ topology setup failed: ${msg}`);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
