import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPlansService } from '../src/modules/payment-plans/payment-plans.service';
import { PrismaService } from '../src/database/prisma.service';
import { SequenceService } from '../src/common/utils/sequence.service';

describe('PaymentPlansService', () => {
  let service: PaymentPlansService;

  const mockPrisma = {
    billPaymentPlan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    billPaymentPlanInstallment: {
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
    billDebt: {
      updateMany: jest.fn(),
    },
  };

  const mockSequenceService = {
    getNextNumber: jest.fn().mockResolvedValue('PP202401001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentPlansService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SequenceService, useValue: mockSequenceService },
      ],
    }).compile();

    service = module.get<PaymentPlansService>(PaymentPlansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated payment plans', async () => {
      const mockPlans = [
        { id: '1', planNumber: 'PP001', totalAmount: 10000, status: 'active' },
        { id: '2', planNumber: 'PP002', totalAmount: 5000, status: 'completed' },
      ];

      mockPrisma.billPaymentPlan.findMany.mockResolvedValue(mockPlans);
      mockPrisma.billPaymentPlan.count.mockResolvedValue(2);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.data).toEqual(mockPlans);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by customer', async () => {
      mockPrisma.billPaymentPlan.findMany.mockResolvedValue([]);
      mockPrisma.billPaymentPlan.count.mockResolvedValue(0);

      await service.findAll({ customerId: 'customer-1' });

      expect(mockPrisma.billPaymentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'customer-1' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a payment plan by id', async () => {
      const mockPlan = {
        id: '1',
        planNumber: 'PP001',
        totalAmount: 10000,
        installments: [
          { id: 'i1', installmentNumber: 1, amount: 1000 },
          { id: 'i2', installmentNumber: 2, amount: 1000 },
        ],
      };

      mockPrisma.billPaymentPlan.findFirst.mockResolvedValue(mockPlan);

      const result = await service.findOne('1');

      expect(result).toEqual(mockPlan);
      expect(result.installments.length).toBe(2);
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockPrisma.billPaymentPlan.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('خطة السداد غير موجودة');
    });
  });

  describe('create', () => {
    it('should create a new payment plan with installments', async () => {
      const dto = {
        customerId: 'customer-1',
        totalAmount: 12000,
        downPayment: 2000,
        numberOfInstallments: 10,
        startDate: '2024-01-01',
      };

      mockPrisma.billCustomer.findUnique.mockResolvedValue({ id: 'customer-1' });
      mockPrisma.billPaymentPlan.create.mockResolvedValue({
        id: 'plan-1',
        planNumber: 'PP202401001',
        ...dto,
        remainingAmount: 10000,
        installmentAmount: 1000,
      });
      mockPrisma.billPaymentPlanInstallment.createMany.mockResolvedValue({ count: 10 });
      mockPrisma.billPaymentPlan.findFirst.mockResolvedValue({
        id: 'plan-1',
        planNumber: 'PP202401001',
        installments: Array(10).fill({ amount: 1000 }),
      });

      const result = await service.create(dto);

      expect(mockSequenceService.getNextNumber).toHaveBeenCalledWith('PP');
      expect(mockPrisma.billPaymentPlan.create).toHaveBeenCalled();
      expect(mockPrisma.billPaymentPlanInstallment.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      const dto = {
        customerId: 'nonexistent',
        totalAmount: 12000,
        numberOfInstallments: 10,
        startDate: '2024-01-01',
      };

      mockPrisma.billCustomer.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow('العميل غير موجود');
    });
  });

  describe('payInstallment', () => {
    it('should pay an installment', async () => {
      const mockPlan = {
        id: 'plan-1',
        totalAmount: 10000,
        downPayment: 0,
        installments: [
          { id: 'i1', installmentNumber: 1, amount: 1000, paidAmount: 0, status: 'pending' },
          { id: 'i2', installmentNumber: 2, amount: 1000, paidAmount: 0, status: 'pending' },
        ],
      };

      mockPrisma.billPaymentPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.billPaymentPlanInstallment.update.mockResolvedValue({
        ...mockPlan.installments[0],
        paidAmount: 1000,
        status: 'paid',
      });
      mockPrisma.billPaymentPlan.update.mockResolvedValue({
        ...mockPlan,
        remainingAmount: 9000,
      });

      const result = await service.payInstallment('plan-1', 'i1', { amount: 1000 });

      expect(mockPrisma.billPaymentPlanInstallment.update).toHaveBeenCalled();
      expect(mockPrisma.billPaymentPlan.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if installment not found', async () => {
      const mockPlan = {
        id: 'plan-1',
        installments: [{ id: 'i1', installmentNumber: 1 }],
      };

      mockPrisma.billPaymentPlan.findFirst.mockResolvedValue(mockPlan);

      await expect(service.payInstallment('plan-1', 'nonexistent', { amount: 1000 }))
        .rejects.toThrow('القسط غير موجود');
    });
  });

  describe('getStatistics', () => {
    it('should return payment plan statistics', async () => {
      mockPrisma.billPaymentPlan.count
        .mockResolvedValueOnce(50)  // total
        .mockResolvedValueOnce(30)  // active
        .mockResolvedValueOnce(15)  // completed
        .mockResolvedValueOnce(3)   // defaulted
        .mockResolvedValueOnce(2);  // cancelled

      mockPrisma.billPaymentPlan.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 150000 },
      });

      mockPrisma.billPaymentPlanInstallment.count.mockResolvedValue(5);

      const result = await service.getStatistics();

      expect(result.total).toBe(50);
      expect(result.active).toBe(30);
      expect(result.completed).toBe(15);
      expect(result.totalRemainingAmount).toBe(150000);
      expect(result.overdueInstallments).toBe(5);
    });
  });

  describe('checkOverdue', () => {
    it('should update overdue installments', async () => {
      mockPrisma.billPaymentPlanInstallment.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.billPaymentPlanInstallment.findMany.mockResolvedValue([
        { id: 'i1', status: 'overdue' },
        { id: 'i2', status: 'overdue' },
        { id: 'i3', status: 'overdue' },
      ]);

      const result = await service.checkOverdue();

      expect(result.count).toBe(3);
      expect(mockPrisma.billPaymentPlanInstallment.updateMany).toHaveBeenCalled();
    });
  });
});
