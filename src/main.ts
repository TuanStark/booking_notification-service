import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupRabbitMQTopology } from './messaging/rabbitmq/rabbitmq-topology.setup';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create HTTP application first so ConfigModule loads .env
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Setup RabbitMQ topology: bind notification_queue to user_exchange + booking_topic_exchange
  // Must use same RABBITMQ_URL as auth-service (e.g. amqp://admin:admin@booking_rabbitmq:5672)
  await setupRabbitMQTopology({
    url: config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
    queue: config.get<string>('RABBITMQ_QUEUE') || 'notification_queue',
  });

  // Connect to RabbitMQ as microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RABBITMQ_QUEUE || 'notification_queue',
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 1,
    },
  });

  // Start microservice
  await app.startAllMicroservices();

  // Start HTTP server so API Gateway can proxy REST requests like /notifications/contact
  const port = Number(process.env.PORT ?? 3007);
  await app.listen(port);

  const rabbitUrl = config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
  const queue = config.get<string>('RABBITMQ_QUEUE') || 'notification_queue';
  logger.log(
    `✅ Notification Service is running on port ${port}`,
  );
  logger.log(`🔗 RabbitMQ: ${rabbitUrl.replace(/:[^:@]+@/, ':****@')}`);
  logger.log(`📨 Queue: ${queue} (listening for create.user, resend.verification.code, password.reset.requested, booking.created, booking.canceled)`);
  logger.log(`🚀 Microservices started successfully`);
  logger.log(`📡 Ready to receive RabbitMQ messages`);
  console.log(
    `🔗 Notification Service is running on port ${port}`,
  );
}
bootstrap();
