import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from '../modules/payments/payments.controller';
import { PaymentsService } from '../modules/payments/payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPaymentNo: jest.fn(),
    getCustomerPayments: jest.fn(),
    getInvoicePayments: jest.fn(),
    cancel: jest.fn(),
    getDailySummary: jest.fn(),
    getPaymentMethods: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createDto = {
        customerId: 'cust-1',
        invoiceId: 'inv-1',
        amount: 500,
        paymentMethod: 'cash',
        paymentDate: '2024-01-15',
      };

      const mockPayment = {
        id: 'pay-1',
        paymentNo: 'PAY-2024-001',
        ...createDto,
      };
      mockPaymentsService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(createDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
      expect(mockPaymentsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should create payment without invoice', async () => {
      const createDto = {
        customerId: 'cust-1',
        amount: 500,
        paymentMethod: 'bank',
      };

      const mockPayment = {
        id: 'pay-1',
        paymentNo: 'PAY-2024-001',
        ...createDto,
      };
      mockPaymentsService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(createDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
    });
  });

  describe('findAll', () => {
    it('should return paginated payments', async () => {
      const mockResult = {
        data: [{ id: 'pay-1', paymentNo: 'PAY-001' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      mockPaymentsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockPaymentsService.findAll).toHaveBeenCalled();
    });

    it('should filter by payment method', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockPaymentsService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ paymentMethod: 'cash' });

      expect(mockPaymentsService.findAll).toHaveBeenCalledWith({ paymentMethod: 'cash' });
    });

    it('should filter by customer', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockPaymentsService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ customerId: 'cust-1' });

      expect(mockPaymentsService.findAll).toHaveBeenCalledWith({ customerId: 'cust-1' });
    });

    it('should filter by date range', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockPaymentsService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ fromDate: '2024-01-01', toDate: '2024-01-31' });

      expect(mockPaymentsService.findAll).toHaveBeenCalledWith({
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
      });
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const mockPayment = { id: 'pay-1', paymentNo: 'PAY-001', amount: 500 };
      mockPaymentsService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('pay-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
      expect(mockPaymentsService.findOne).toHaveBeenCalledWith('pay-1');
    });
  });

  describe('findByPaymentNo', () => {
    it('should return a payment by payment number', async () => {
      const mockPayment = { id: 'pay-1', paymentNo: 'PAY-001', amount: 500 };
      mockPaymentsService.findByPaymentNo.mockResolvedValue(mockPayment);

      const result = await controller.findByPaymentNo('PAY-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
      expect(mockPaymentsService.findByPaymentNo).toHaveBeenCalledWith('PAY-001');
    });
  });

  describe('getCustomerPayments', () => {
    it('should return customer payments', async () => {
      const mockPayments = [
        { id: 'pay-1', paymentNo: 'PAY-001' },
        { id: 'pay-2', paymentNo: 'PAY-002' },
      ];
      mockPaymentsService.getCustomerPayments.mockResolvedValue(mockPayments);

      const result = await controller.getCustomerPayments('cust-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayments);
      expect(mockPaymentsService.getCustomerPayments).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('getInvoicePayments', () => {
    it('should return invoice payments', async () => {
      const mockPayments = [{ id: 'pay-1', paymentNo: 'PAY-001', invoiceId: 'inv-1' }];
      mockPaymentsService.getInvoicePayments.mockResolvedValue(mockPayments);

      const result = await controller.getInvoicePayments('inv-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayments);
      expect(mockPaymentsService.getInvoicePayments).toHaveBeenCalledWith('inv-1');
    });
  });

  describe('cancel', () => {
    it('should cancel a payment', async () => {
      const cancelDto = { reason: 'Test cancellation' };
      const mockPayment = { id: 'pay-1', status: 'cancelled' };
      mockPaymentsService.cancel.mockResolvedValue(mockPayment);

      const result = await controller.cancel('pay-1', cancelDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
      expect(mockPaymentsService.cancel).toHaveBeenCalledWith('pay-1', cancelDto);
    });
  });

  describe('getDailySummary', () => {
    it('should return daily payment summary', async () => {
      const mockSummary = {
        date: '2024-01-15',
        totalPayments: 10,
        totalAmount: 5000,
        byMethod: {
          cash: { count: 5, amount: 2500 },
          bank: { count: 5, amount: 2500 },
        },
      };
      mockPaymentsService.getDailySummary.mockResolvedValue(mockSummary);

      const result = await controller.getDailySummary('2024-01-15');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
      expect(mockPaymentsService.getDailySummary).toHaveBeenCalledWith('2024-01-15');
    });
  });
});
