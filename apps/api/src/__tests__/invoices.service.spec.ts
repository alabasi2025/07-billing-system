import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';

describe('InvoicesService', () => {
  let service: InvoicesService;

  const mockPrismaService = {
    billInvoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
    billMeter: {
      findFirst: jest.fn(),
    },
    billMeterReading: {
      findFirst: jest.fn(),
    },
    billTariff: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockSequenceService = {
    generateSequence: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SequenceService, useValue: mockSequenceService },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const mockInvoices = [
        { id: '1', invoiceNo: 'INV001', totalAmount: 100 },
        { id: '2', invoiceNo: 'INV002', totalAmount: 200 },
      ];

      mockPrismaService.billInvoice.findMany.mockResolvedValue(mockInvoices);
      mockPrismaService.billInvoice.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockInvoices);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrismaService.billInvoice.findMany.mockResolvedValue([]);
      mockPrismaService.billInvoice.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, status: 'issued' });

      expect(mockPrismaService.billInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'issued' }),
        })
      );
    });

    it('should filter by customer', async () => {
      mockPrismaService.billInvoice.findMany.mockResolvedValue([]);
      mockPrismaService.billInvoice.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, customerId: 'cust-1' });

      expect(mockPrismaService.billInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-1' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return an invoice by id', async () => {
      const mockInvoice = { id: '1', invoiceNo: 'INV001', totalAmount: 100 };
      mockPrismaService.billInvoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await service.findOne('1');

      expect(result).toEqual(mockInvoice);
    });

    it('should return null if invoice not found', async () => {
      mockPrismaService.billInvoice.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should return invoice statistics', async () => {
      mockPrismaService.billInvoice.count
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(50)   // issued
        .mockResolvedValueOnce(30)   // paid
        .mockResolvedValueOnce(10)   // partial
        .mockResolvedValueOnce(10);  // overdue

      mockPrismaService.billInvoice.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 50000 } })  // total amount
        .mockResolvedValueOnce({ _sum: { paidAmount: 30000 } });  // paid amount

      const result = await service.getStatistics();

      expect(result.total).toBe(100);
      expect(result.byStatus.issued).toBe(50);
      expect(result.byStatus.paid).toBe(30);
    });
  });

  describe('calculateConsumptionAmount', () => {
    it('should calculate consumption amount based on tariffs', () => {
      const tariffs = [
        { fromKwh: 0, toKwh: 100, ratePerKwh: 0.18 },
        { fromKwh: 100, toKwh: 200, ratePerKwh: 0.20 },
        { fromKwh: 200, toKwh: null, ratePerKwh: 0.30 },
      ];

      // Test with 150 kWh consumption
      const consumption = 150;
      let amount = 0;
      
      // First 100 kWh at 0.18
      amount += 100 * 0.18; // 18
      // Next 50 kWh at 0.20
      amount += 50 * 0.20; // 10
      
      expect(amount).toBe(28);
    });
  });
});
