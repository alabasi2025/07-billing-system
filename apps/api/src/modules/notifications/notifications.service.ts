import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNotificationTemplateDto, UpdateNotificationTemplateDto, SendNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // ==================== قوالب الإشعارات ====================

  async findAllTemplates(params: { skip?: number; take?: number; templateType?: string; eventType?: string }) {
    const { skip = 0, take = 10, templateType, eventType } = params;

    const where: any = {};
    if (templateType) where.templateType = templateType;
    if (eventType) where.eventType = eventType;

    const [data, total] = await Promise.all([
      this.prisma.billNotificationTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { templateCode: 'asc' },
      }),
      this.prisma.billNotificationTemplate.count({ where }),
    ]);

    return { data, meta: { total, skip, take, hasMore: skip + take < total } };
  }

  async findOneTemplate(id: string) {
    const template = await this.prisma.billNotificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('قالب الإشعار غير موجود');
    }

    return template;
  }

  async createTemplate(dto: CreateNotificationTemplateDto) {
    const existing = await this.prisma.billNotificationTemplate.findUnique({
      where: { templateCode: dto.templateCode },
    });

    if (existing) {
      throw new ConflictException('رمز القالب موجود مسبقاً');
    }

    return this.prisma.billNotificationTemplate.create({
      data: dto,
    });
  }

  async updateTemplate(id: string, dto: UpdateNotificationTemplateDto) {
    await this.findOneTemplate(id);

    return this.prisma.billNotificationTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTemplate(id: string) {
    await this.findOneTemplate(id);

    return this.prisma.billNotificationTemplate.delete({
      where: { id },
    });
  }

  // ==================== الإشعارات ====================

  async findAllNotifications(params: {
    skip?: number;
    take?: number;
    customerId?: string;
    status?: string;
  }) {
    const { skip = 0, take = 10, customerId, status } = params;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.billNotification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      this.prisma.billNotification.count({ where }),
    ]);

    return { data, meta: { total, skip, take, hasMore: skip + take < total } };
  }

  async sendNotification(dto: SendNotificationDto) {
    // جلب القالب
    const template = await this.findOneTemplate(dto.templateId);

    // جلب بيانات العميل
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    // استبدال المتغيرات في النص
    let body = template.bodyTemplate;
    let subject = template.subject || '';

    const data = dto.data ? JSON.parse(dto.data) : {};
    
    // إضافة بيانات العميل الأساسية
    const variables = {
      customerName: customer.name,
      accountNo: customer.accountNo,
      phone: customer.phone,
      ...data,
    };

    // استبدال المتغيرات
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    });

    // إنشاء الإشعار
    const notification = await this.prisma.billNotification.create({
      data: {
        templateId: dto.templateId,
        customerId: dto.customerId,
        recipient: dto.recipient,
        subject,
        body,
        status: 'pending',
      },
    });

    // محاكاة إرسال الإشعار (في الإنتاج سيتم التكامل مع خدمات SMS/Email)
    await this.processNotification(notification.id);

    return notification;
  }

  async processNotification(id: string) {
    // في الإنتاج: التكامل مع خدمات SMS/Email/Push
    // حالياً: تحديث الحالة إلى "sent"
    
    await this.prisma.billNotification.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  async retryFailedNotifications() {
    const failed = await this.prisma.billNotification.findMany({
      where: { status: 'failed', retryCount: { lt: 3 } },
    });

    const results = [];
    for (const notification of failed) {
      try {
        await this.processNotification(notification.id);
        results.push({ id: notification.id, status: 'success' });
      } catch (error) {
        await this.prisma.billNotification.update({
          where: { id: notification.id },
          data: {
            retryCount: { increment: 1 },
            failureReason: error.message,
          },
        });
        results.push({ id: notification.id, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  async getStatistics() {
    const [total, pending, sent, delivered, failed] = await Promise.all([
      this.prisma.billNotification.count(),
      this.prisma.billNotification.count({ where: { status: 'pending' } }),
      this.prisma.billNotification.count({ where: { status: 'sent' } }),
      this.prisma.billNotification.count({ where: { status: 'delivered' } }),
      this.prisma.billNotification.count({ where: { status: 'failed' } }),
    ]);

    const templateCount = await this.prisma.billNotificationTemplate.count({
      where: { isActive: true },
    });

    return {
      total,
      pending,
      sent,
      delivered,
      failed,
      activeTemplates: templateCount,
    };
  }
}
