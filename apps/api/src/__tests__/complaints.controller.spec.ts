import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintsController } from '../modules/complaints/complaints.controller';
import { ComplaintsService } from '../modules/complaints/complaints.service';

describe('ComplaintsController', () => {
  let controller: ComplaintsController;
  let service: ComplaintsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assign: jest.fn(),
    resolve: jest.fn(),
    close: jest.fn(),
    addComment: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplaintsController],
      providers: [
        { provide: ComplaintsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ComplaintsController>(ComplaintsController);
    service = module.get<ComplaintsService>(ComplaintsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of complaints', async () => {
      const mockComplaints = [
        { id: '1', complaintNo: 'CMP-001', subject: 'فاتورة مرتفعة', status: 'open' },
        { id: '2', complaintNo: 'CMP-002', subject: 'انقطاع الخدمة', status: 'in_progress' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockComplaints, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'open' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }));
    });

    it('should filter by priority', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ priority: 'high' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ priority: 'high' }));
    });
  });

  describe('findOne', () => {
    it('should return single complaint', async () => {
      const mockComplaint = { id: '1', complaintNo: 'CMP-001', subject: 'فاتورة مرتفعة' };
      mockService.findOne.mockResolvedValue(mockComplaint);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.complaintNo).toBe('CMP-001');
    });
  });

  describe('create', () => {
    it('should create new complaint', async () => {
      const createDto = {
        customerId: 'cust-1',
        subject: 'شكوى جديدة',
        description: 'وصف الشكوى',
        category: 'billing',
        priority: 'medium',
      };
      const mockComplaint = { id: 'new-id', complaintNo: 'CMP-NEW', ...createDto };
      mockService.create.mockResolvedValue(mockComplaint);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update complaint', async () => {
      const updateDto = { priority: 'high' };
      const mockComplaint = { id: '1', priority: 'high' };
      mockService.update.mockResolvedValue(mockComplaint);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.priority).toBe('high');
    });
  });

  describe('delete', () => {
    it('should delete complaint', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('assign', () => {
    it('should assign complaint to user', async () => {
      const assignDto = { assigneeId: 'user-1' };
      const mockComplaint = { id: '1', assigneeId: 'user-1', status: 'in_progress' };
      mockService.assign.mockResolvedValue(mockComplaint);

      const result = await controller.assign('1', assignDto);

      expect(service.assign).toHaveBeenCalledWith('1', assignDto);
      expect(result.assigneeId).toBe('user-1');
    });
  });

  describe('resolve', () => {
    it('should resolve complaint', async () => {
      const resolveDto = { resolution: 'تم تعديل الفاتورة' };
      const mockComplaint = { id: '1', status: 'resolved' };
      mockService.resolve.mockResolvedValue(mockComplaint);

      const result = await controller.resolve('1', resolveDto);

      expect(service.resolve).toHaveBeenCalledWith('1', resolveDto);
      expect(result.status).toBe('resolved');
    });
  });

  describe('close', () => {
    it('should close complaint', async () => {
      const closeDto = { closureNotes: 'تم إغلاق الشكوى بعد موافقة العميل' };
      const mockComplaint = { id: '1', status: 'closed' };
      mockService.close.mockResolvedValue(mockComplaint);

      const result = await controller.close('1', closeDto);

      expect(service.close).toHaveBeenCalledWith('1', closeDto);
      expect(result.status).toBe('closed');
    });
  });

  describe('addComment', () => {
    it('should add comment to complaint', async () => {
      const commentDto = { comment: 'تعليق جديد', isInternal: false };
      const mockComment = { id: 'comment-1', ...commentDto };
      mockService.addComment.mockResolvedValue(mockComment);

      const result = await controller.addComment('1', commentDto);

      expect(service.addComment).toHaveBeenCalledWith('1', commentDto);
      expect(result.comment).toBe('تعليق جديد');
    });
  });

  describe('getStatistics', () => {
    it('should return complaint statistics', async () => {
      const mockStats = {
        totalComplaints: 100,
        openComplaints: 20,
        inProgressComplaints: 15,
        resolvedComplaints: 50,
        closedComplaints: 15,
        averageResolutionTime: 48, // hours
        byCategory: [
          { category: 'billing', count: 40 },
          { category: 'service', count: 35 },
          { category: 'technical', count: 25 },
        ],
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalComplaints).toBe(100);
    });
  });
});
