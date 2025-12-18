import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    billNotification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    billNotificationTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should send a notification', async () => {
      const dto = {
        customerId: 'customer-uuid',
        type: 'sms',
        subject: 'تذكير بالدفع',
        message: 'يرجى سداد الفاتورة',
      };
      const customer = { id: 'customer-uuid', phone: '0501234567' };
      const expected = { id: 'uuid-1', ...dto, status: 'sent', sentAt: new Date() };

      mockPrismaService.billCustomer.findUnique.mockResolvedValue(customer);
      mockPrismaService.billNotification.create.mockResolvedValue(expected);

      const result = await service.send(dto);

      expect(result.status).toBe('sent');
    });
  });

  describe('sendBulk', () => {
    it('should send bulk notifications', async () => {
      const dto = {
        customerIds: ['uuid-1', 'uuid-2'],
        type: 'email',
        subject: 'إشعار جماعي',
        message: 'رسالة للجميع',
      };

      mockPrismaService.billCustomer.findUnique
        .mockResolvedValueOnce({ id: 'uuid-1', email: 'a@test.com' })
        .mockResolvedValueOnce({ id: 'uuid-2', email: 'b@test.com' });
      mockPrismaService.billNotification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.sendBulk(dto);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  describe('getCustomerNotifications', () => {
    it('should return customer notifications', async () => {
      const notifications = [
        { id: 'uuid-1', subject: 'إشعار 1', status: 'read' },
        { id: 'uuid-2', subject: 'إشعار 2', status: 'sent' },
      ];

      mockPrismaService.billNotification.findMany.mockResolvedValue(notifications);
      mockPrismaService.billNotification.count.mockResolvedValue(2);

      const result = await service.getCustomerNotifications('customer-uuid', { page: 1, limit: 10 });

      expect(result.data).toEqual(notifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = { id: 'uuid-1', status: 'sent' };
      const updated = { ...notification, status: 'read', readAt: new Date() };

      mockPrismaService.billNotification.findUnique.mockResolvedValue(notification);
      mockPrismaService.billNotification.update.mockResolvedValue(updated);

      const result = await service.markAsRead('uuid-1');

      expect(result.status).toBe('read');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all customer notifications as read', async () => {
      mockPrismaService.billNotification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('customer-uuid');

      expect(result.count).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPrismaService.billNotification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('customer-uuid');

      expect(result).toBe(3);
    });
  });

  describe('createTemplate', () => {
    it('should create a notification template', async () => {
      const dto = {
        code: 'PAYMENT_REMINDER',
        nameAr: 'تذكير بالدفع',
        type: 'sms',
        templateAr: 'عزيزي {{name}}، يرجى سداد فاتورتك',
      };
      const expected = { id: 'uuid-1', ...dto, isActive: true };

      mockPrismaService.billNotificationTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.billNotificationTemplate.create.mockResolvedValue(expected);

      const result = await service.createTemplate(dto);

      expect(result.code).toBe('PAYMENT_REMINDER');
    });
  });
});
