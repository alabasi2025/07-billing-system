import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentsService } from '../src/modules/installments/installments.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('InstallmentsService', () => {
  let service: InstallmentsService;

  const mockPrismaService = {
    billInstallmentPlan: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billInstallment: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    billInvoice: {
      findUnique: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InstallmentsService>(InstallmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlan', () => {
    it('should create an installment plan', async () => {
      const dto = {
        customerId: 'customer-uuid',
        invoiceId: 'invoice-uuid',
        totalAmount: 1000,
        numberOfInstallments: 4,
        startDate: new Date(),
      };
      const expected = {
        id: 'uuid-1',
        ...dto,
        installmentAmount: 250,
        status: 'active',
      };

      mockPrismaService.billCustomer.findUnique.mockResolvedValue({ id: 'customer-uuid' });
      mockPrismaService.billInvoice.findUnique.mockResolvedValue({ id: 'invoice-uuid', totalAmount: 1000 });
      mockPrismaService.billInstallmentPlan.create.mockResolvedValue(expected);
      mockPrismaService.billInstallment.createMany.mockResolvedValue({ count: 4 });

      const result = await service.createPlan(dto);

      expect(result.installmentAmount).toBe(250);
      expect(result.status).toBe('active');
    });
  });

  describe('findAll', () => {
    it('should return paginated installment plans', async () => {
      const plans = [
        { id: 'uuid-1', totalAmount: 1000, status: 'active' },
        { id: 'uuid-2', totalAmount: 2000, status: 'completed' },
      ];

      mockPrismaService.billInstallmentPlan.findMany.mockResolvedValue(plans);
      mockPrismaService.billInstallmentPlan.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(plans);
    });
  });

  describe('payInstallment', () => {
    it('should pay an installment', async () => {
      const installment = {
        id: 'uuid-1',
        planId: 'plan-uuid',
        amount: 250,
        status: 'pending',
      };
      const paid = { ...installment, status: 'paid', paidAt: new Date() };

      mockPrismaService.billInstallment.findUnique.mockResolvedValue(installment);
      mockPrismaService.billInstallment.update.mockResolvedValue(paid);

      const result = await service.payInstallment('uuid-1', 250);

      expect(result.status).toBe('paid');
    });

    it('should throw BadRequestException if already paid', async () => {
      const installment = { id: 'uuid-1', status: 'paid' };
      mockPrismaService.billInstallment.findUnique.mockResolvedValue(installment);

      await expect(service.payInstallment('uuid-1', 250)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPlanInstallments', () => {
    it('should return installments for a plan', async () => {
      const installments = [
        { id: 'uuid-1', amount: 250, status: 'paid', dueDate: new Date() },
        { id: 'uuid-2', amount: 250, status: 'pending', dueDate: new Date() },
      ];

      mockPrismaService.billInstallment.findMany.mockResolvedValue(installments);

      const result = await service.getPlanInstallments('plan-uuid');

      expect(result).toHaveLength(2);
    });
  });

  describe('getOverdueInstallments', () => {
    it('should return overdue installments', async () => {
      const overdue = [
        { id: 'uuid-1', amount: 250, dueDate: new Date(Date.now() - 86400000) },
      ];

      mockPrismaService.billInstallment.findMany.mockResolvedValue(overdue);

      const result = await service.getOverdueInstallments();

      expect(result).toHaveLength(1);
    });
  });
});
