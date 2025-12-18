import { Test, TestingModule } from '@nestjs/testing';
import { DisconnectionsController } from '../modules/disconnections/disconnections.controller';
import { DisconnectionsService } from '../modules/disconnections/disconnections.service';

describe('DisconnectionsController', () => {
  let controller: DisconnectionsController;
  let service: DisconnectionsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reconnect: jest.fn(),
    getStatistics: jest.fn(),
    getCustomerDisconnections: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisconnectionsController],
      providers: [
        { provide: DisconnectionsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<DisconnectionsController>(DisconnectionsController);
    service = module.get<DisconnectionsService>(DisconnectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of disconnections', async () => {
      const mockDisconnections = [
        { id: '1', customerId: 'cust-1', reason: 'عدم السداد', status: 'active' },
        { id: '2', customerId: 'cust-2', reason: 'طلب العميل', status: 'reconnected' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockDisconnections, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should filter by reason', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ reason: 'عدم السداد' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ reason: 'عدم السداد' }));
    });
  });

  describe('findOne', () => {
    it('should return single disconnection', async () => {
      const mockDisconnection = { id: '1', customerId: 'cust-1', reason: 'عدم السداد' };
      mockService.findOne.mockResolvedValue(mockDisconnection);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.reason).toBe('عدم السداد');
    });
  });

  describe('create', () => {
    it('should create new disconnection', async () => {
      const createDto = {
        customerId: 'cust-1',
        meterId: 'meter-1',
        reason: 'عدم السداد',
        disconnectionDate: '2024-02-15',
      };
      const mockDisconnection = { id: 'new-id', ...createDto };
      mockService.create.mockResolvedValue(mockDisconnection);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update disconnection', async () => {
      const updateDto = { notes: 'ملاحظات إضافية' };
      const mockDisconnection = { id: '1', notes: 'ملاحظات إضافية' };
      mockService.update.mockResolvedValue(mockDisconnection);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.notes).toBe('ملاحظات إضافية');
    });
  });

  describe('delete', () => {
    it('should delete disconnection', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('reconnect', () => {
    it('should reconnect customer', async () => {
      const reconnectDto = {
        reconnectionDate: '2024-02-20',
        reconnectionFee: 50,
        notes: 'تم السداد',
      };
      const mockDisconnection = { id: '1', status: 'reconnected' };
      mockService.reconnect.mockResolvedValue(mockDisconnection);

      const result = await controller.reconnect('1', reconnectDto);

      expect(service.reconnect).toHaveBeenCalledWith('1', reconnectDto);
      expect(result.status).toBe('reconnected');
    });
  });

  describe('getStatistics', () => {
    it('should return disconnection statistics', async () => {
      const mockStats = {
        totalDisconnections: 50,
        activeDisconnections: 20,
        reconnected: 30,
        byReason: [
          { reason: 'عدم السداد', count: 40 },
          { reason: 'طلب العميل', count: 10 },
        ],
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalDisconnections).toBe(50);
    });
  });

  describe('getCustomerDisconnections', () => {
    it('should return customer disconnection history', async () => {
      const mockHistory = [
        { id: '1', disconnectionDate: '2024-01-15', reconnectionDate: '2024-01-20' },
        { id: '2', disconnectionDate: '2024-02-15', reconnectionDate: null },
      ];
      mockService.getCustomerDisconnections.mockResolvedValue(mockHistory);

      const result = await controller.getCustomerDisconnections('cust-1');

      expect(service.getCustomerDisconnections).toHaveBeenCalledWith('cust-1');
      expect(result.length).toBe(2);
    });
  });
});
