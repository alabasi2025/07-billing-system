import { Test, TestingModule } from '@nestjs/testing';
import { BillingCyclesController } from '../modules/billing-cycles/billing-cycles.controller';
import { BillingCyclesService } from '../modules/billing-cycles/billing-cycles.service';

describe('BillingCyclesController', () => {
  let controller: BillingCyclesController;
  let service: BillingCyclesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getCurrentCycle: jest.fn(),
    closeCycle: jest.fn(),
    generateInvoices: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingCyclesController],
      providers: [
        { provide: BillingCyclesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<BillingCyclesController>(BillingCyclesController);
    service = module.get<BillingCyclesService>(BillingCyclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of billing cycles', async () => {
      const mockCycles = [
        { id: '1', name: 'يناير 2024', status: 'closed' },
        { id: '2', name: 'فبراير 2024', status: 'active' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockCycles, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should filter by year', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ year: 2024 });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ year: 2024 }));
    });
  });

  describe('findOne', () => {
    it('should return single billing cycle', async () => {
      const mockCycle = { id: '1', name: 'يناير 2024' };
      mockService.findOne.mockResolvedValue(mockCycle);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.name).toBe('يناير 2024');
    });
  });

  describe('create', () => {
    it('should create new billing cycle', async () => {
      const createDto = {
        name: 'مارس 2024',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        readingStartDate: '2024-03-25',
        readingEndDate: '2024-03-31',
      };
      const mockCycle = { id: 'new-id', ...createDto };
      mockService.create.mockResolvedValue(mockCycle);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update billing cycle', async () => {
      const updateDto = { name: 'يناير 2024 - محدث' };
      const mockCycle = { id: '1', name: 'يناير 2024 - محدث' };
      mockService.update.mockResolvedValue(mockCycle);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.name).toBe('يناير 2024 - محدث');
    });
  });

  describe('delete', () => {
    it('should delete billing cycle', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentCycle', () => {
    it('should return current active cycle', async () => {
      const mockCycle = { id: '2', name: 'فبراير 2024', status: 'active' };
      mockService.getCurrentCycle.mockResolvedValue(mockCycle);

      const result = await controller.getCurrentCycle();

      expect(service.getCurrentCycle).toHaveBeenCalled();
      expect(result.status).toBe('active');
    });
  });

  describe('closeCycle', () => {
    it('should close billing cycle', async () => {
      const mockCycle = { id: '1', status: 'closed' };
      mockService.closeCycle.mockResolvedValue(mockCycle);

      const result = await controller.closeCycle('1');

      expect(service.closeCycle).toHaveBeenCalledWith('1');
      expect(result.status).toBe('closed');
    });
  });

  describe('generateInvoices', () => {
    it('should generate invoices for cycle', async () => {
      const mockResult = {
        cycleId: '1',
        generatedCount: 150,
        totalAmount: 75000,
        errors: [],
      };
      mockService.generateInvoices.mockResolvedValue(mockResult);

      const result = await controller.generateInvoices('1');

      expect(service.generateInvoices).toHaveBeenCalledWith('1');
      expect(result.generatedCount).toBe(150);
    });

    it('should return errors if any', async () => {
      const mockResult = {
        cycleId: '1',
        generatedCount: 148,
        totalAmount: 74000,
        errors: [
          { customerId: 'cust-1', error: 'No reading found' },
          { customerId: 'cust-2', error: 'Invalid tariff' },
        ],
      };
      mockService.generateInvoices.mockResolvedValue(mockResult);

      const result = await controller.generateInvoices('1');

      expect(result.errors.length).toBe(2);
    });
  });

  describe('getStatistics', () => {
    it('should return billing cycle statistics', async () => {
      const mockStats = {
        totalCycles: 12,
        activeCycles: 1,
        closedCycles: 11,
        totalInvoicesGenerated: 1800,
        totalRevenue: 900000,
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalCycles).toBe(12);
    });
  });
});
