/**
 * Electricity Billing System API
 * نظام فوترة الكهرباء - الخادم الخلفي
 */

import { Logger, ValidationPipe, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

// Custom JSON Logger for production
class JsonLogger extends Logger {
  private formatMessage(level: string, message: string, context?: string) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      message,
      service: 'billing-api',
      version: '1.0.0',
    });
  }

  log(message: string, context?: string) {
    if (process.env.NODE_ENV === 'production') {
      console.log(this.formatMessage('info', message, context));
    } else {
      super.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string) {
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        context: context || 'Application',
        message,
        trace,
        service: 'billing-api',
        version: '1.0.0',
      }));
    } else {
      super.error(message, trace, context);
    }
  }

  warn(message: string, context?: string) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(this.formatMessage('warn', message, context));
    } else {
      super.warn(message, context);
    }
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'production') {
      console.debug(this.formatMessage('debug', message, context));
    } else {
      super.debug(message, context);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV === 'production') {
      console.log(this.formatMessage('verbose', message, context));
    } else {
      super.verbose(message, context);
    }
  }
}

async function bootstrap() {
  // Determine log levels based on environment
  const logLevels: LogLevel[] = process.env.NODE_ENV === 'production'
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? new JsonLogger() 
      : new Logger(),
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('نظام فوترة الكهرباء - Electricity Billing System API')
    .setDescription(`
## وصف النظام
نظام متكامل لإدارة فواتير الكهرباء والعملاء والمدفوعات.

## المميزات الرئيسية
- إدارة العملاء وتصنيفاتهم
- إدارة العدادات والقراءات
- إصدار الفواتير وحساب الاستهلاك
- تسجيل المدفوعات ونقاط البيع
- إدارة الديون وخطط السداد
- التقارير والإحصائيات

## المصادقة
يستخدم النظام JWT للمصادقة. يجب إرسال التوكن في هيدر Authorization.
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'أدخل التوكن الخاص بك',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('العملاء - Customers', 'إدارة العملاء وتصنيفاتهم')
    .addTag('العدادات - Meters', 'إدارة العدادات والقراءات')
    .addTag('الفواتير - Invoices', 'إصدار وإدارة الفواتير')
    .addTag('المدفوعات - Payments', 'تسجيل وإدارة المدفوعات')
    .addTag('نقاط البيع - POS', 'إدارة نقاط البيع والجلسات')
    .addTag('الديون - Debts', 'إدارة الديون وخطط السداد')
    .addTag('التقارير - Reports', 'التقارير والإحصائيات')
    .addTag('الإعدادات - Settings', 'إعدادات النظام')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'نظام الفوترة - API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2rem; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Billing API is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`📚 API endpoints available at: http://localhost:${port}/api/v1`);
}

bootstrap();
