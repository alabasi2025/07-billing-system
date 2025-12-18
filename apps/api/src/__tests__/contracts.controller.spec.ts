import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from '../modules/contracts/contracts.controller';
import { ContractsService } from '../modules/contracts/contracts.service';

describe('ContractsController', () => {
  let controller: ContractsController;
  let service: ContractsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    activate: jest.fn(),
    terminate: jest.fn(),
    renew: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        { provide: ContractsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ContractsController>(ContractsController);
    service = module.get<ContractsService>(ContractsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of contracts', async () => {
      const mockContracts = [
        { id: '1', contractNo: 'CON-001', status: 'active' },
        { id: '2', contractNo: 'CON-002', status: 'pending' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockContracts, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should filter by customer', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ customerId: 'cust-1' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'cust-1' }));
    });
  });

  describe('findOne', () => {
    it('should return single contract', async () => {
      const mockContract = { id: '1', contractNo: 'CON-001' };
      mockService.findOne.mockResolvedValue(mockContract);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.contractNo).toBe('CON-001');
    });
  });

  describe('create', () => {
    it('should create new contract', async () => {
      const createDto = {
        customerId: 'cust-1',
        meterId: 'meter-1',
        startDate: '2024-01-01',
        tariffId: 'tariff-1',
      };
      const mockContract = { id: 'new-id', contractNo: 'CON-NEW', ...createDto };
      mockService.create.mockResolvedValue(mockContract);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update contract', async () => {
      const updateDto = { tariffId: 'tariff-2' };
      const mockContract = { id: '1', tariffId: 'tariff-2' };
      mockService.update.mockResolvedValue(mockContract);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.tariffId).toBe('tariff-2');
    });
  });

  describe('delete', () => {
    it('should delete contract', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('activate', () => {
    it('should activate contract', async () => {
      const mockContract = { id: '1', status: 'active' };
      mockService.activate.mockResolvedValue(mockContract);

      const result = await controller.activate('1');

      expect(service.activate).toHaveBeenCalledWith('1');
      expect(result.status).toBe('active');
    });
  });

  describe('terminate', () => {
    it('should terminate contract', async () => {
      const terminateDto = { reason: 'طلب العميل', terminationDate: '2024-06-30' };
      const mockContract = { id: '1', status: 'terminated' };
      mockService.terminate.mockResolvedValue(mockContract);

      const result = await controller.terminate('1', terminateDto);

      expect(service.terminate).toHaveBeenCalledWith('1', terminateDto);
      expect(result.status).toBe('terminated');
    });
  });

  describe('renew', () => {
    it('should renew contract', async () => {
      const renewDto = { newEndDate: '2025-12-31' };
      const mockContract = { id: '1', endDate: '2025-12-31' };
      mockService.renew.mockResolvedValue(mockContract);

      const result = await controller.renew('1', renewDto);

      expect(service.renew).toHaveBeenCalledWith('1', renewDto);
      expect(result.endDate).toBe('2025-12-31');
    });
  });

  describe('getStatistics', () => {
    it('should return contract statistics', async () => {
      const mockStats = {
        totalContracts: 200,
        activeContracts: 150,
        pendingContracts: 30,
        terminatedContracts: 20,
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalContracts).toBe(200);
    });
  });
});
