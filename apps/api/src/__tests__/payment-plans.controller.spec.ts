import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPlansController } from '../modules/payment-plans/payment-plans.controller';
import { PaymentPlansService } from '../modules/payment-plans/payment-plans.service';

describe('PaymentPlansController', () => {
  let controller: PaymentPlansController;
  let service: PaymentPlansService;

  const mockPaymentPlansService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getInstallments: jest.fn(),
    payInstallment: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentPlansController],
      providers: [
        { provide: PaymentPlansService, useValue: mockPaymentPlansService },
      ],
    }).compile();

    controller = module.get<PaymentPlansController>(PaymentPlansController);
    service = module.get<PaymentPlansService>(PaymentPlansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of payment plans', async () => {
      const mockPlans = [
        { id: '1', customerId: 'cust-1', totalAmount: 5000, installments: 6 },
        { id: '2', customerId: 'cust-2', totalAmount: 3000, installments: 3 },
      ];
      mockPaymentPlansService.findAll.mockResolvedValue({ data: mockPlans, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockPaymentPlansService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });
  });

  describe('findOne', () => {
    it('should return single payment plan', async () => {
      const mockPlan = { id: '1', customerId: 'cust-1', totalAmount: 5000 };
      mockPaymentPlansService.findOne.mockResolvedValue(mockPlan);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
    });
  });

  describe('create', () => {
    it('should create new payment plan', async () => {
      const createDto = {
        customerId: 'cust-1',
        debtId: 'debt-1',
        totalAmount: 5000,
        numberOfInstallments: 6,
        startDate: '2024-02-01',
      };
      const mockPlan = { id: 'new-id', ...createDto };
      mockPaymentPlansService.create.mockResolvedValue(mockPlan);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update payment plan', async () => {
      const updateDto = { numberOfInstallments: 12 };
      const mockPlan = { id: '1', numberOfInstallments: 12 };
      mockPaymentPlansService.update.mockResolvedValue(mockPlan);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.numberOfInstallments).toBe(12);
    });
  });

  describe('delete', () => {
    it('should delete payment plan', async () => {
      mockPaymentPlansService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('getInstallments', () => {
    it('should return installments for plan', async () => {
      const mockInstallments = [
        { id: '1', amount: 833, dueDate: '2024-02-01', status: 'paid' },
        { id: '2', amount: 833, dueDate: '2024-03-01', status: 'pending' },
      ];
      mockPaymentPlansService.getInstallments.mockResolvedValue(mockInstallments);

      const result = await controller.getInstallments('plan-1');

      expect(service.getInstallments).toHaveBeenCalledWith('plan-1');
      expect(result.length).toBe(2);
    });
  });

  describe('payInstallment', () => {
    it('should pay installment', async () => {
      const payDto = { paymentMethod: 'cash', paymentDate: '2024-02-15' };
      const mockResult = { success: true, installment: { status: 'paid' } };
      mockPaymentPlansService.payInstallment.mockResolvedValue(mockResult);

      const result = await controller.payInstallment('plan-1', 'inst-1', payDto);

      expect(service.payInstallment).toHaveBeenCalledWith('plan-1', 'inst-1', payDto);
      expect(result.success).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return payment plan statistics', async () => {
      const mockStats = {
        totalPlans: 25,
        activePlans: 15,
        completedPlans: 10,
        totalAmount: 150000,
        collectedAmount: 75000,
      };
      mockPaymentPlansService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalPlans).toBe(25);
    });
  });
});
