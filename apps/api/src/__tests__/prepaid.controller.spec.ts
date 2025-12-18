import { Test, TestingModule } from '@nestjs/testing';
import { PrepaidController } from '../modules/prepaid/prepaid.controller';
import { PrepaidService } from '../modules/prepaid/prepaid.service';

describe('PrepaidController', () => {
  let controller: PrepaidController;
  let service: PrepaidService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    recharge: jest.fn(),
    getBalance: jest.fn(),
    getTransactions: jest.fn(),
    generateToken: jest.fn(),
    validateToken: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrepaidController],
      providers: [
        { provide: PrepaidService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<PrepaidController>(PrepaidController);
    service = module.get<PrepaidService>(PrepaidService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of prepaid meters', async () => {
      const mockMeters = [
        { id: '1', meterNo: 'PREP-001', balance: 100, status: 'active' },
        { id: '2', meterNo: 'PREP-002', balance: 50, status: 'active' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockMeters, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should filter by low balance', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ lowBalance: true });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ lowBalance: true }));
    });
  });

  describe('findOne', () => {
    it('should return single prepaid meter', async () => {
      const mockMeter = { id: '1', meterNo: 'PREP-001', balance: 100 };
      mockService.findOne.mockResolvedValue(mockMeter);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.meterNo).toBe('PREP-001');
    });
  });

  describe('create', () => {
    it('should create new prepaid meter', async () => {
      const createDto = {
        customerId: 'cust-1',
        meterNo: 'PREP-NEW',
        initialBalance: 0,
        tariffId: 'tariff-1',
      };
      const mockMeter = { id: 'new-id', ...createDto };
      mockService.create.mockResolvedValue(mockMeter);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update prepaid meter', async () => {
      const updateDto = { tariffId: 'tariff-2' };
      const mockMeter = { id: '1', tariffId: 'tariff-2' };
      mockService.update.mockResolvedValue(mockMeter);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.tariffId).toBe('tariff-2');
    });
  });

  describe('delete', () => {
    it('should delete prepaid meter', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('recharge', () => {
    it('should recharge prepaid meter', async () => {
      const rechargeDto = {
        amount: 100,
        paymentMethod: 'cash',
      };
      const mockResult = {
        success: true,
        newBalance: 200,
        token: 'TOKEN-123456',
        units: 200,
      };
      mockService.recharge.mockResolvedValue(mockResult);

      const result = await controller.recharge('1', rechargeDto);

      expect(service.recharge).toHaveBeenCalledWith('1', rechargeDto);
      expect(result.newBalance).toBe(200);
      expect(result.token).toBeDefined();
    });
  });

  describe('getBalance', () => {
    it('should return meter balance', async () => {
      const mockBalance = {
        meterId: '1',
        balance: 150,
        units: 300,
        lastRecharge: '2024-02-10',
      };
      mockService.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance('1');

      expect(service.getBalance).toHaveBeenCalledWith('1');
      expect(result.balance).toBe(150);
    });
  });

  describe('getTransactions', () => {
    it('should return meter transactions', async () => {
      const mockTransactions = [
        { id: '1', type: 'recharge', amount: 100, date: '2024-02-15' },
        { id: '2', type: 'consumption', amount: -50, date: '2024-02-16' },
      ];
      mockService.getTransactions.mockResolvedValue(mockTransactions);

      const result = await controller.getTransactions('1', {});

      expect(service.getTransactions).toHaveBeenCalledWith('1', {});
      expect(result.length).toBe(2);
    });
  });

  describe('generateToken', () => {
    it('should generate recharge token', async () => {
      const tokenDto = { amount: 100 };
      const mockToken = {
        token: '1234-5678-9012-3456',
        amount: 100,
        units: 200,
        expiresAt: '2024-02-22',
      };
      mockService.generateToken.mockResolvedValue(mockToken);

      const result = await controller.generateToken('1', tokenDto);

      expect(service.generateToken).toHaveBeenCalledWith('1', tokenDto);
      expect(result.token).toBeDefined();
    });
  });

  describe('validateToken', () => {
    it('should validate recharge token', async () => {
      const validateDto = { token: '1234-5678-9012-3456' };
      const mockResult = {
        valid: true,
        amount: 100,
        units: 200,
      };
      mockService.validateToken.mockResolvedValue(mockResult);

      const result = await controller.validateToken('1', validateDto);

      expect(service.validateToken).toHaveBeenCalledWith('1', validateDto);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid token', async () => {
      const validateDto = { token: 'INVALID-TOKEN' };
      const mockResult = {
        valid: false,
        error: 'Invalid or expired token',
      };
      mockService.validateToken.mockResolvedValue(mockResult);

      const result = await controller.validateToken('1', validateDto);

      expect(result.valid).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return prepaid statistics', async () => {
      const mockStats = {
        totalMeters: 50,
        activeMeters: 45,
        totalBalance: 5000,
        totalRecharges: 200,
        totalRechargeAmount: 20000,
        lowBalanceMeters: 10,
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalMeters).toBe(50);
    });
  });
});
