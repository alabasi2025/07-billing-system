import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../src/modules/reports/reports.service';
import { PrismaService } from '../src/database/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrismaService = {
    billCustomer: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    billInvoice: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    billPayment: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    billMeter: {
      count: jest.fn(),
    },
    billMeterReading: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      mockPrismaService.billCustomer.count.mockResolvedValue(100);
      mockPrismaService.billInvoice.count.mockResolvedValue(500);
      mockPrismaService.billPayment.aggregate.mockResolvedValue({ _sum: { amount: 50000 } });
      mockPrismaService.billMeter.count.mockResolvedValue(150);

      const result = await service.getDashboardStats();

      expect(result.totalCustomers).toBe(100);
      expect(result.totalInvoices).toBe(500);
      expect(result.totalCollections).toBe(50000);
    });
  });

  describe('getRevenueReport', () => {
    it('should return revenue report for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrismaService.billPayment.findMany.mockResolvedValue([
        { amount: 1000, paymentDate: new Date('2024-01-15') },
        { amount: 2000, paymentDate: new Date('2024-01-20') },
      ]);

      const result = await service.getRevenueReport(startDate, endDate);

      expect(result.totalRevenue).toBe(3000);
      expect(result.transactions).toHaveLength(2);
    });
  });

  describe('getAgingReport', () => {
    it('should return aging report', async () => {
      mockPrismaService.billInvoice.findMany.mockResolvedValue([
        { id: 'inv-1', totalAmount: 1000, dueDate: new Date(Date.now() - 10 * 86400000), status: 'unpaid' },
        { id: 'inv-2', totalAmount: 2000, dueDate: new Date(Date.now() - 40 * 86400000), status: 'unpaid' },
        { id: 'inv-3', totalAmount: 3000, dueDate: new Date(Date.now() - 100 * 86400000), status: 'unpaid' },
      ]);

      const result = await service.getAgingReport();

      expect(result.current).toBeDefined();
      expect(result.days30).toBeDefined();
      expect(result.days60).toBeDefined();
      expect(result.days90Plus).toBeDefined();
    });
  });

  describe('getCollectionReport', () => {
    it('should return collection report', async () => {
      mockPrismaService.billPayment.findMany.mockResolvedValue([
        { amount: 1000, paymentMethod: 'cash' },
        { amount: 2000, paymentMethod: 'card' },
        { amount: 500, paymentMethod: 'cash' },
      ]);

      const result = await service.getCollectionReport(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(result.byMethod.cash).toBe(1500);
      expect(result.byMethod.card).toBe(2000);
    });
  });

  describe('getConsumptionReport', () => {
    it('should return consumption report', async () => {
      mockPrismaService.billMeterReading.aggregate.mockResolvedValue({
        _sum: { consumption: 50000 },
        _avg: { consumption: 500 },
      });

      const result = await service.getConsumptionReport(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(result.totalConsumption).toBe(50000);
      expect(result.averageConsumption).toBe(500);
    });
  });

  describe('getCustomerStatement', () => {
    it('should return customer statement', async () => {
      const customerId = 'customer-uuid';
      mockPrismaService.billInvoice.findMany.mockResolvedValue([
        { id: 'inv-1', totalAmount: 1000, status: 'paid' },
        { id: 'inv-2', totalAmount: 2000, status: 'unpaid' },
      ]);
      mockPrismaService.billPayment.findMany.mockResolvedValue([
        { amount: 1000, invoiceId: 'inv-1' },
      ]);

      const result = await service.getCustomerStatement(customerId);

      expect(result.invoices).toHaveLength(2);
      expect(result.payments).toHaveLength(1);
      expect(result.balance).toBe(2000);
    });
  });
});
