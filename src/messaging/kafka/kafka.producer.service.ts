import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopics } from './kafka-topics.enum';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('🚀 Initializing Kafka Producer...');
      
      Object.values(KafkaTopics).forEach((topic) => {
        this.kafkaClient.subscribeToResponseOf(topic);
        this.logger.log(`📡 Subscribed to topic: ${topic}`);
      });
      
      await this.kafkaClient.connect();
      this.logger.log('✅ Kafka Producer connected successfully');
    } catch (error) {
      this.logger.warn(`⚠️ Kafka not available, skipping producer setup: ${error.message}`);
    }
  }

  // Building events
  async emitBuildingCreatedEvent(payload: any) {
    try {
      this.logger.log(`📤 Emitting BUILDING_CREATED event: ${JSON.stringify(payload)}`);
      await this.kafkaClient.emit(KafkaTopics.BUILDING_CREATED, payload);
      this.logger.log('✅ BUILDING_CREATED event emitted successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to emit BUILDING_CREATED event: ${error.message}`);
      throw error;
    }
  }

  async emitBuildingUpdatedEvent(payload: any) {
    try {
      this.logger.log(`📤 Emitting BUILDING_UPDATED event: ${JSON.stringify(payload)}`);
      await this.kafkaClient.emit(KafkaTopics.BUILDING_UPDATED, payload);
      this.logger.log('✅ BUILDING_UPDATED event emitted successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to emit BUILDING_UPDATED event: ${error.message}`);
      throw error;
    }
  }

  async emitBuildingDeletedEvent(payload: any) {
    try {
      this.logger.log(`📤 Emitting BUILDING_DELETED event: ${JSON.stringify(payload)}`);
      await this.kafkaClient.emit(KafkaTopics.BUILDING_DELETED, payload);
      this.logger.log('✅ BUILDING_DELETED event emitted successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to emit BUILDING_DELETED event: ${error.message}`);
      throw error;
    }
  }
}
