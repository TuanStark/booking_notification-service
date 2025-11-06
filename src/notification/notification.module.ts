// src/notification/notification.module.ts
import { forwardRef, Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailService } from './services/email.service';
import { TemplateService } from './services/template.service';
import { NotificationGatewayModule } from './gateways/notification.gateway.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => NotificationGatewayModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
          port: configService.get<number>('MAIL_PORT') || 587,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"${configService.get<string>('MAIL_FROM_NAME') || 'Dorm Booking System'}" <${configService.get<string>('MAIL_FROM_EMAIL') || 'noreply@dormbooking.com'}>`,
        },
        template: {
          dir: process.cwd() + '/src/common/mail/templates/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    TemplateService,
  ],
  exports: [
    NotificationService,
    EmailService,
    TemplateService,
  ],
})
export class NotificationModule {}