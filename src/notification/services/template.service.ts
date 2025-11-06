// src/notification/services/template.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ITemplateService } from '../interfaces/notification.interface';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService implements ITemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesPath = path.join(process.cwd(), 'src', 'common', 'mail', 'templates');
  private readonly templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.registerHelpers();
  }

  async render(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      const template = this.getTemplate(templateName);
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  getTemplate(templateName: string): string {
    try {
      // Check cache first
      if (this.templateCache.has(templateName)) {
        return this.templateCache.get(templateName)!.toString();
      }

      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateName} not found at ${templatePath}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Cache the compiled template
      const compiledTemplate = handlebars.compile(templateContent);
      this.templateCache.set(templateName, compiledTemplate);

      return templateContent;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async renderEmailTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      appName: 'Dorm Booking System',
      supportEmail: 'support@dormbooking.com',
    };

    return this.render(templateName, templateData);
  }

  private registerHelpers(): void {
    // Format currency helper
    handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'VND') => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    });

    // Format date helper
    handlebars.registerHelper('formatDate', (date: Date | string, format: string = 'dd/MM/yyyy') => {
      const d = new Date(date);
      if (format === 'dd/MM/yyyy') {
        return d.toLocaleDateString('vi-VN');
      }
      return d.toLocaleString('vi-VN');
    });

    // Format phone helper
    handlebars.registerHelper('formatPhone', (phone: string) => {
      if (!phone) return '';
      return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    });

    // Conditional helper
    handlebars.registerHelper('if_eq', function(a: any, b: any, options: any) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Truncate text helper
    handlebars.registerHelper('truncate', (text: string, length: number) => {
      if (!text || text.length <= length) return text;
      return text.substring(0, length) + '...';
    });
  }

  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }

  getAvailableTemplates(): string[] {
    try {
      const files = fs.readdirSync(this.templatesPath);
      return files
        .filter(file => file.endsWith('.hbs'))
        .map(file => file.replace('.hbs', ''));
    } catch (error) {
      this.logger.error(`Failed to get available templates: ${error.message}`);
      return [];
    }
  }
}
