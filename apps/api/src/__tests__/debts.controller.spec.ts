import { Test, TestingModule } from '@nestjs/testing';
import { DebtsController } from '../modules/debts/debts.controller';
import { DebtsService } from '../modules/debts/debts.service';

describe('DebtsController', () => {
  let controller: DebtsController;
  let service: DebtsService;

  const mockDebtsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getStatistics: jest.fn(),
    getCustomerDebts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebtsController],
      providers: [
        { provide: DebtsService, useValue: mockDebtsService },
      ],
    }).compile();

    controller = module.get<DebtsController>(DebtsController);
    service = module.get<DebtsService>(DebtsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of debts', async () => {
      const mockDebts = [
        { id: '1', customerId: 'cust-1', amount: 1000, status: 'active' },
        { id: '2', customerId: 'cust-2', amount: 2000, status: 'active' },
      ];
      mockDebtsService.findAll.mockResolvedValue({ data: mockDebts, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockDebtsService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should filter by customer', async () => {
      mockDebtsService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ customerId: 'cust-1' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'cust-1' }));
    });
  });

  describe('findOne', () => {
    it('should return single debt', async () => {
      const mockDebt = { id: '1', customerId: 'cust-1', amount: 1000 };
      mockDebtsService.findOne.mockResolvedValue(mockDebt);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
    });

    it('should throw if debt not found', async () => {
      mockDebtsService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new debt', async () => {
      const createDto = {
        customerId: 'cust-1',
        amount: 1000,
        reason: 'فاتورة متأخرة',
        dueDate: '2024-02-15',
      };
      const mockDebt = { id: 'new-id', ...createDto };
      mockDebtsService.create.mockResolvedValue(mockDebt);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update debt', async () => {
      const updateDto = { amount: 1500 };
      const mockDebt = { id: '1', amount: 1500 };
      mockDebtsService.update.mockResolvedValue(mockDebt);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.amount).toBe(1500);
    });
  });

  describe('delete', () => {
    it('should delete debt', async () => {
      mockDebtsService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return debt statistics', async () => {
      const mockStats = {
        totalDebts: 50,
        totalAmount: 100000,
        activeDebts: 30,
        paidDebts: 20,
      };
      mockDebtsService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalDebts).toBe(50);
    });
  });

  describe('getCustomerDebts', () => {
    it('should return customer debts', async () => {
      const mockDebts = [
        { id: '1', amount: 1000 },
        { id: '2', amount: 500 },
      ];
      mockDebtsService.getCustomerDebts.mockResolvedValue(mockDebts);

      const result = await controller.getCustomerDebts('cust-1');

      expect(service.getCustomerDebts).toHaveBeenCalledWith('cust-1');
      expect(result.length).toBe(2);
    });
  });
});
