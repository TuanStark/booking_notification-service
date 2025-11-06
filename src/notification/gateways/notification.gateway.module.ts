// src/notification/gateways/notification.gateway.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { NotificationGateway } from './notification.gateway';
import { WebSocketService } from '../services/websocket.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    NotificationGateway,
    WebSocketService,
  ],
  exports: [
    NotificationGateway,
    WebSocketService,
  ],
})
export class NotificationGatewayModule {}
