import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create HTTP application
  const app = await NestFactory.create(AppModule);
  
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
  
  logger.log(`✅ Notification Service is running on port ${process.env.PORT ?? 3007}`);
  logger.log(`🔗 Connected to RabbitMQ: amqp://localhost:5672`);
  logger.log(`📨 Queue: ${process.env.RABBITMQ_QUEUE || 'notification_queue'}`);
  logger.log(`🚀 Microservices started successfully`);
  logger.log(`📡 Ready to receive RabbitMQ messages`);
  console.log(`🔗 Notification Service is running on port ${process.env.PORT ?? 3007}`);
}
bootstrap();
