import { Module, Logger } from '@nestjs/common';
import { KafkaProducerService } from './kafka.producer.service';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [
    NotificationModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        useFactory: (configService: ConfigService) => {
          const logger = new Logger('KafkaModule');
          const clientId = configService.get<string>('KAFKA_CLIENT_ID') || 'notification-service';
          const brokers = configService.get<string>('KAFKA_BROKER')?.split(',') || ['localhost:9092'];
          
          logger.log(`🔗 Connecting to Kafka brokers: ${brokers.join(', ')}`);
          logger.log(`🆔 Client ID: ${clientId}`);
          
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: clientId,
                brokers: brokers,
              },
              consumer: {
                groupId: 'notification-consumer',
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
