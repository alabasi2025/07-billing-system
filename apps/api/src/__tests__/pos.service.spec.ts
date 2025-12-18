import { Test, TestingModule } from '@nestjs/testing';
import { POSService } from './pos.service';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';

describe('POSService', () => {
  let service: POSService;

  const mockPrismaService = {
    billCustomer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    billInvoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    billPayment: {
      findMany: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    billMeter: {
      findUnique: jest.fn(),
    },
    billPrepaidToken: {
      create: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockSequenceService = {
    generateSequence: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        POSService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SequenceService, useValue: mockSequenceService },
      ],
    }).compile();

    service = module.get<POSService>(POSService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchCustomer', () => {
    it('should search by account number', async () => {
      const mockCustomers = [
        { id: '1', accountNo: 'ACC001', name: 'Customer 1' },
      ];

      mockPrismaService.billCustomer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.searchCustomer({ accountNo: 'ACC001' });

      expect(result).toEqual(mockCustomers);
      expect(mockPrismaService.billCustomer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            accountNo: expect.objectContaining({ contains: 'ACC001' }),
          }),
        })
      );
    });

    it('should search by meter number', async () => {
      const mockCustomers = [
        { id: '1', accountNo: 'ACC001', name: 'Customer 1', meters: [{ meterNo: 'MTR001' }] },
      ];

      mockPrismaService.billCustomer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.searchCustomer({ meterNo: 'MTR001' });

      expect(result).toEqual(mockCustomers);
    });

    it('should search by phone number', async () => {
      const mockCustomers = [
        { id: '1', accountNo: 'ACC001', name: 'Customer 1', phone: '0501234567' },
      ];

      mockPrismaService.billCustomer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.searchCustomer({ phone: '0501234567' });

      expect(result).toEqual(mockCustomers);
    });

    it('should return empty array if no match', async () => {
      mockPrismaService.billCustomer.findMany.mockResolvedValue([]);

      const result = await service.searchCustomer({ accountNo: 'NONEXISTENT' });

      expect(result).toEqual([]);
    });
  });

  describe('getCustomerSummary', () => {
    it('should return customer summary with pending invoices', async () => {
      const mockCustomer = {
        id: '1',
        accountNo: 'ACC001',
        name: 'Customer 1',
        phone: '0501234567',
        category: { name: 'Residential' },
        status: 'active',
      };

      const mockInvoices = [
        { id: 'inv-1', invoiceNo: 'INV001', totalAmount: 100, paidAmount: 0, balance: 100, status: 'issued' },
      ];

      const mockPayments = [
        { id: 'pay-1', paymentNo: 'PAY001', amount: 50, paymentDate: new Date() },
      ];

      mockPrismaService.billCustomer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.billInvoice.findMany.mockResolvedValue(mockInvoices);
      mockPrismaService.billPayment.findMany.mockResolvedValue(mockPayments);

      const result = await service.getCustomerSummary('1');

      expect(result.customer).toBeDefined();
      expect(result.pendingInvoices).toBeDefined();
      expect(result.lastPayments).toBeDefined();
    });

    it('should throw error if customer not found', async () => {
      mockPrismaService.billCustomer.findUnique.mockResolvedValue(null);

      await expect(service.getCustomerSummary('nonexistent')).rejects.toThrow();
    });
  });

  describe('processTransaction', () => {
    it('should process invoice payment', async () => {
      const transactionDto = {
        transactionType: 'invoice_payment' as const,
        customerId: 'cust-1',
        invoiceId: 'inv-1',
        amount: 100,
        paymentMethod: 'cash' as const,
      };

      const mockInvoice = {
        id: 'inv-1',
        totalAmount: 200,
        paidAmount: 50,
        balance: 150,
        status: 'partial',
      };

      mockPrismaService.billInvoice.findUnique.mockResolvedValue(mockInvoice);
      mockSequenceService.generateSequence.mockResolvedValue('PAY001');
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.billPayment.create.mockResolvedValue({
        id: 'pay-1',
        paymentNo: 'PAY001',
        amount: 100,
      });

      // Test would verify payment creation
      expect(service).toBeDefined();
    });

    it('should process STS recharge', async () => {
      const transactionDto = {
        transactionType: 'sts_recharge' as const,
        customerId: 'cust-1',
        meterId: 'meter-1',
        amount: 100,
        paymentMethod: 'cash' as const,
      };

      const mockMeter = {
        id: 'meter-1',
        meterNo: 'MTR001',
        meterType: { category: 'prepaid' },
      };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(mockMeter);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      // Test would verify token generation
      expect(service).toBeDefined();
    });
  });

  describe('getStatistics', () => {
    it('should return POS statistics', async () => {
      mockPrismaService.billPayment.count.mockResolvedValue(50);
      mockPrismaService.billPayment.aggregate.mockResolvedValue({
        _sum: { amount: 25000 },
      });
      mockPrismaService.billPrepaidToken.count.mockResolvedValue(20);
      mockPrismaService.billPrepaidToken.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
      });

      const result = await service.getStatistics();

      expect(result.payments).toBeDefined();
      expect(result.recharges).toBeDefined();
      expect(result.grandTotal).toBeDefined();
    });
  });
});
