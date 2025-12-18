import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from '../src/modules/debts/debts.service';
import { PrismaService } from '../src/database/prisma.service';

describe('DebtsService', () => {
  let service: DebtsService;
  let prisma: PrismaService;

  const mockPrisma = {
    billDebt: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated debts', async () => {
      const mockDebts = [
        { id: '1', debtType: 'invoice', originalAmount: 1000, remainingAmount: 500 },
        { id: '2', debtType: 'penalty', originalAmount: 200, remainingAmount: 200 },
      ];

      mockPrisma.billDebt.findMany.mockResolvedValue(mockDebts);
      mockPrisma.billDebt.count.mockResolvedValue(2);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.data).toEqual(mockDebts);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrisma.billDebt.findMany.mockResolvedValue([]);
      mockPrisma.billDebt.count.mockResolvedValue(0);

      await service.findAll({ status: 'outstanding' });

      expect(mockPrisma.billDebt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'outstanding', isDeleted: false }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a debt by id', async () => {
      const mockDebt = { id: '1', debtType: 'invoice', originalAmount: 1000 };
      mockPrisma.billDebt.findFirst.mockResolvedValue(mockDebt);

      const result = await service.findOne('1');

      expect(result).toEqual(mockDebt);
    });

    it('should throw NotFoundException if debt not found', async () => {
      mockPrisma.billDebt.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('الدين غير موجود');
    });
  });

  describe('create', () => {
    it('should create a new debt', async () => {
      const dto = {
        customerId: 'customer-1',
        debtType: 'invoice',
        originalAmount: 1000,
        dueDate: '2024-12-31',
      };

      mockPrisma.billCustomer.findUnique.mockResolvedValue({ id: 'customer-1' });
      mockPrisma.billDebt.create.mockResolvedValue({
        id: 'debt-1',
        ...dto,
        remainingAmount: 1000,
        status: 'outstanding',
      });

      const result = await service.create(dto);

      expect(result.originalAmount).toBe(1000);
      expect(mockPrisma.billDebt.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      const dto = { customerId: 'nonexistent', debtType: 'invoice', originalAmount: 1000, dueDate: '2024-12-31' };
      mockPrisma.billCustomer.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow('العميل غير موجود');
    });
  });

  describe('payDebt', () => {
    it('should pay debt partially', async () => {
      const mockDebt = {
        id: '1',
        originalAmount: 1000,
        paidAmount: 0,
        remainingAmount: 1000,
        status: 'outstanding',
      };

      mockPrisma.billDebt.findFirst.mockResolvedValue(mockDebt);
      mockPrisma.billDebt.update.mockResolvedValue({
        ...mockDebt,
        paidAmount: 500,
        remainingAmount: 500,
        status: 'partial',
      });

      const result = await service.payDebt('1', { amount: 500 });

      expect(result.paidAmount).toBe(500);
      expect(result.status).toBe('partial');
    });

    it('should mark debt as paid when fully paid', async () => {
      const mockDebt = {
        id: '1',
        originalAmount: 1000,
        paidAmount: 500,
        remainingAmount: 500,
        status: 'partial',
      };

      mockPrisma.billDebt.findFirst.mockResolvedValue(mockDebt);
      mockPrisma.billDebt.update.mockResolvedValue({
        ...mockDebt,
        paidAmount: 1000,
        remainingAmount: 0,
        status: 'paid',
      });

      const result = await service.payDebt('1', { amount: 500 });

      expect(result.status).toBe('paid');
    });
  });

  describe('getStatistics', () => {
    it('should return debt statistics', async () => {
      mockPrisma.billDebt.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(50)  // outstanding
        .mockResolvedValueOnce(20)  // partial
        .mockResolvedValueOnce(25)  // paid
        .mockResolvedValueOnce(5);  // written_off

      mockPrisma.billDebt.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 50000 },
      });

      const result = await service.getStatistics();

      expect(result.total).toBe(100);
      expect(result.outstanding).toBe(50);
      expect(result.totalOutstandingAmount).toBe(50000);
    });
  });

  describe('getAgingReport', () => {
    it('should return aging report', async () => {
      const now = new Date();
      const mockDebts = [
        { remainingAmount: 1000, dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) }, // 10 days
        { remainingAmount: 2000, dueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) }, // 45 days
        { remainingAmount: 3000, dueDate: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000) }, // 75 days
      ];

      mockPrisma.billDebt.findMany.mockResolvedValue(mockDebts);

      const result = await service.getAgingReport();

      expect(result.total).toBe(6000);
      expect(result.aging.current).toBe(1000);
      expect(result.aging.days30).toBe(2000);
      expect(result.aging.days60).toBe(3000);
    });
  });
});
