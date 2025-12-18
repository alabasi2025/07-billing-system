import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRequestsController } from '../modules/subscription-requests/subscription-requests.controller';
import { SubscriptionRequestsService } from '../modules/subscription-requests/subscription-requests.service';

describe('SubscriptionRequestsController', () => {
  let controller: SubscriptionRequestsController;
  let service: SubscriptionRequestsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionRequestsController],
      providers: [
        { provide: SubscriptionRequestsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<SubscriptionRequestsController>(SubscriptionRequestsController);
    service = module.get<SubscriptionRequestsService>(SubscriptionRequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of subscription requests', async () => {
      const mockRequests = [
        { id: '1', requestNo: 'REQ-001', applicantName: 'أحمد', status: 'pending' },
        { id: '2', requestNo: 'REQ-002', applicantName: 'محمد', status: 'approved' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockRequests, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'pending' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });

    it('should filter by type', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ type: 'new_connection' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ type: 'new_connection' }));
    });
  });

  describe('findOne', () => {
    it('should return single request', async () => {
      const mockRequest = { id: '1', requestNo: 'REQ-001', applicantName: 'أحمد' };
      mockService.findOne.mockResolvedValue(mockRequest);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.requestNo).toBe('REQ-001');
    });
  });

  describe('create', () => {
    it('should create new subscription request', async () => {
      const createDto = {
        applicantName: 'أحمد محمد',
        applicantId: '1234567890',
        phone: '0501234567',
        address: 'الرياض - حي النزهة',
        type: 'new_connection',
        categoryId: 'cat-1',
      };
      const mockRequest = { id: 'new-id', requestNo: 'REQ-NEW', status: 'pending', ...createDto };
      mockService.create.mockResolvedValue(mockRequest);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.status).toBe('pending');
    });
  });

  describe('update', () => {
    it('should update subscription request', async () => {
      const updateDto = { phone: '0509876543' };
      const mockRequest = { id: '1', phone: '0509876543' };
      mockService.update.mockResolvedValue(mockRequest);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.phone).toBe('0509876543');
    });
  });

  describe('delete', () => {
    it('should delete subscription request', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('approve', () => {
    it('should approve subscription request', async () => {
      const approveDto = {
        meterId: 'meter-1',
        tariffId: 'tariff-1',
        notes: 'تمت الموافقة',
      };
      const mockRequest = { id: '1', status: 'approved' };
      mockService.approve.mockResolvedValue(mockRequest);

      const result = await controller.approve('1', approveDto);

      expect(service.approve).toHaveBeenCalledWith('1', approveDto);
      expect(result.status).toBe('approved');
    });
  });

  describe('reject', () => {
    it('should reject subscription request', async () => {
      const rejectDto = {
        reason: 'عدم اكتمال المستندات',
      };
      const mockRequest = { id: '1', status: 'rejected' };
      mockService.reject.mockResolvedValue(mockRequest);

      const result = await controller.reject('1', rejectDto);

      expect(service.reject).toHaveBeenCalledWith('1', rejectDto);
      expect(result.status).toBe('rejected');
    });
  });

  describe('getStatistics', () => {
    it('should return subscription request statistics', async () => {
      const mockStats = {
        totalRequests: 100,
        pendingRequests: 20,
        approvedRequests: 70,
        rejectedRequests: 10,
        byType: [
          { type: 'new_connection', count: 60 },
          { type: 'transfer', count: 25 },
          { type: 'upgrade', count: 15 },
        ],
        averageProcessingTime: 5, // days
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalRequests).toBe(100);
    });
  });
});
