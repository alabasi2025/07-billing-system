import { Test, TestingModule } from '@nestjs/testing';
import { BillingCyclesService } from '../src/modules/billing-cycles/billing-cycles.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BillingCyclesService', () => {
  let service: BillingCyclesService;

  const mockPrismaService = {
    billBillingCycle: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billInvoice: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingCyclesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BillingCyclesService>(BillingCyclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new billing cycle', async () => {
      const dto = {
        name: 'يناير 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        dueDate: new Date('2024-02-15'),
      };
      const expected = { id: 'uuid-1', ...dto, status: 'open' };

      mockPrismaService.billBillingCycle.findFirst.mockResolvedValue(null);
      mockPrismaService.billBillingCycle.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result.status).toBe('open');
    });

    it('should throw BadRequestException if dates overlap', async () => {
      const dto = {
        name: 'يناير 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      mockPrismaService.billBillingCycle.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated billing cycles', async () => {
      const cycles = [
        { id: 'uuid-1', name: 'يناير 2024', status: 'closed' },
        { id: 'uuid-2', name: 'فبراير 2024', status: 'open' },
      ];

      mockPrismaService.billBillingCycle.findMany.mockResolvedValue(cycles);
      mockPrismaService.billBillingCycle.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(cycles);
    });
  });

  describe('getCurrentCycle', () => {
    it('should return the current open cycle', async () => {
      const cycle = { id: 'uuid-1', name: 'يناير 2024', status: 'open' };
      mockPrismaService.billBillingCycle.findFirst.mockResolvedValue(cycle);

      const result = await service.getCurrentCycle();

      expect(result.status).toBe('open');
    });
  });

  describe('closeCycle', () => {
    it('should close an open billing cycle', async () => {
      const cycle = { id: 'uuid-1', status: 'open' };
      const closed = { ...cycle, status: 'closed', closedAt: new Date() };

      mockPrismaService.billBillingCycle.findUnique.mockResolvedValue(cycle);
      mockPrismaService.billBillingCycle.update.mockResolvedValue(closed);

      const result = await service.closeCycle('uuid-1');

      expect(result.status).toBe('closed');
    });

    it('should throw BadRequestException if cycle already closed', async () => {
      const cycle = { id: 'uuid-1', status: 'closed' };
      mockPrismaService.billBillingCycle.findUnique.mockResolvedValue(cycle);

      await expect(service.closeCycle('uuid-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCycleStatistics', () => {
    it('should return cycle statistics', async () => {
      const cycle = { id: 'uuid-1', name: 'يناير 2024' };
      mockPrismaService.billBillingCycle.findUnique.mockResolvedValue(cycle);
      mockPrismaService.billInvoice.count.mockResolvedValue(100);
      mockPrismaService.billInvoice.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000 },
      });

      const result = await service.getCycleStatistics('uuid-1');

      expect(result.invoiceCount).toBe(100);
      expect(result.totalAmount).toBe(50000);
    });
  });
});
