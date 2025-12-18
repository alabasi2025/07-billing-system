import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../modules/notifications/notifications.controller';
import { NotificationsService } from '../modules/notifications/notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    delete: jest.fn(),
    sendBulk: jest.fn(),
    getTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of notifications', async () => {
      const mockNotifications = [
        { id: '1', title: 'إشعار 1', type: 'info', read: false },
        { id: '2', title: 'إشعار 2', type: 'warning', read: true },
      ];
      mockNotificationsService.findAll.mockResolvedValue({ data: mockNotifications, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by read status', async () => {
      mockNotificationsService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ read: false });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ read: false }));
    });

    it('should filter by type', async () => {
      mockNotificationsService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ type: 'warning' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
    });
  });

  describe('findOne', () => {
    it('should return single notification', async () => {
      const mockNotification = { id: '1', title: 'إشعار 1' };
      mockNotificationsService.findOne.mockResolvedValue(mockNotification);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
    });
  });

  describe('create', () => {
    it('should create new notification', async () => {
      const createDto = {
        title: 'إشعار جديد',
        message: 'محتوى الإشعار',
        type: 'info',
        recipientId: 'user-1',
      };
      const mockNotification = { id: 'new-id', ...createDto };
      mockNotificationsService.create.mockResolvedValue(mockNotification);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = { id: '1', read: true };
      mockNotificationsService.markAsRead.mockResolvedValue(mockNotification);

      const result = await controller.markAsRead('1');

      expect(service.markAsRead).toHaveBeenCalledWith('1');
      expect(result.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await controller.markAllAsRead('user-1');

      expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(result.count).toBe(5);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      mockNotificationsService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('sendBulk', () => {
    it('should send bulk notifications', async () => {
      const bulkDto = {
        title: 'إشعار جماعي',
        message: 'محتوى الإشعار',
        recipientIds: ['user-1', 'user-2', 'user-3'],
      };
      mockNotificationsService.sendBulk.mockResolvedValue({ sent: 3 });

      const result = await controller.sendBulk(bulkDto);

      expect(service.sendBulk).toHaveBeenCalledWith(bulkDto);
      expect(result.sent).toBe(3);
    });
  });

  describe('Templates', () => {
    describe('getTemplates', () => {
      it('should return notification templates', async () => {
        const mockTemplates = [
          { id: '1', name: 'قالب 1', type: 'invoice_due' },
          { id: '2', name: 'قالب 2', type: 'payment_received' },
        ];
        mockNotificationsService.getTemplates.mockResolvedValue(mockTemplates);

        const result = await controller.getTemplates();

        expect(service.getTemplates).toHaveBeenCalled();
        expect(result.length).toBe(2);
      });
    });

    describe('createTemplate', () => {
      it('should create notification template', async () => {
        const createDto = {
          name: 'قالب جديد',
          type: 'custom',
          titleTemplate: 'عنوان {{variable}}',
          messageTemplate: 'محتوى {{variable}}',
        };
        const mockTemplate = { id: 'new-id', ...createDto };
        mockNotificationsService.createTemplate.mockResolvedValue(mockTemplate);

        const result = await controller.createTemplate(createDto);

        expect(service.createTemplate).toHaveBeenCalledWith(createDto);
        expect(result.id).toBe('new-id');
      });
    });

    describe('updateTemplate', () => {
      it('should update notification template', async () => {
        const updateDto = { name: 'اسم محدث' };
        const mockTemplate = { id: '1', name: 'اسم محدث' };
        mockNotificationsService.updateTemplate.mockResolvedValue(mockTemplate);

        const result = await controller.updateTemplate('1', updateDto);

        expect(service.updateTemplate).toHaveBeenCalledWith('1', updateDto);
        expect(result.name).toBe('اسم محدث');
      });
    });

    describe('deleteTemplate', () => {
      it('should delete notification template', async () => {
        mockNotificationsService.deleteTemplate.mockResolvedValue({ success: true });

        const result = await controller.deleteTemplate('1');

        expect(service.deleteTemplate).toHaveBeenCalledWith('1');
        expect(result.success).toBe(true);
      });
    });
  });
});
