// src/notification/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IEmailService, INotificationResult, ChannelType } from '../interfaces/notification.interface';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    template?: string,
    data?: Record<string, any>
  ): Promise<INotificationResult> {
    try {
      this.logger.log(`Sending email to ${to} with subject: ${subject}`);

      const mailOptions: any = {
        to,
        subject,
        html: content,
      };

      // If template is provided, use it
      if (template && data) {
        mailOptions.template = template;
        mailOptions.context = data;
      }

      const result = await this.mailerService.sendMail(mailOptions);

      this.logger.log(`✅ Email sent successfully to ${to}, messageId: ${result.messageId}`);

      return {
        success: true,
        channel: ChannelType.EMAIL,
        messageId: result.messageId,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`, error.stack);

      return {
        success: false,
        channel: ChannelType.EMAIL,
        error: error.message,
      };
    }
  }

  async sendBulkEmails(
    emails: Array<{
      to: string;
      subject: string;
      content: string;
      template?: string;
      data?: Record<string, any>;
    }>
  ): Promise<INotificationResult[]> {
    const results: INotificationResult[] = [];

    // Send emails in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(emails, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map(email => this.sendEmail(
        email.to,
        email.subject,
        email.content,
        email.template,
        email.data
      ));

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
