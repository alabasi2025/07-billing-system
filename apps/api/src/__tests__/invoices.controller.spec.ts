import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from '../modules/invoices/invoices.controller';
import { InvoicesService } from '../modules/invoices/invoices.service';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: InvoicesService;

  const mockInvoicesService = {
    generate: jest.fn(),
    generateBatch: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByInvoiceNo: jest.fn(),
    getCustomerInvoices: jest.fn(),
    getCustomerUnpaidInvoices: jest.fn(),
    cancel: jest.fn(),
    rebill: jest.fn(),
    updatePaymentStatus: jest.fn(),
    getOverdueInvoices: jest.fn(),
    calculateConsumption: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        { provide: InvoicesService, useValue: mockInvoicesService },
      ],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generate', () => {
    it('should generate a new invoice', async () => {
      const generateDto = {
        customerId: 'cust-1',
        billingPeriod: '2024-01',
        readingId: 'read-1',
      };

      const mockInvoice = {
        id: 'inv-1',
        invoiceNo: 'INV-2024-001',
        totalAmount: 500,
        ...generateDto,
      };
      mockInvoicesService.generate.mockResolvedValue(mockInvoice);

      const result = await controller.generate(generateDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
      expect(mockInvoicesService.generate).toHaveBeenCalledWith(generateDto);
    });
  });

  describe('generateBatch', () => {
    it('should generate batch invoices', async () => {
      const batchDto = {
        billingPeriod: '2024-01',
        categoryId: 'cat-1',
      };

      const mockResult = { generated: 50, failed: 2, errors: ['Error 1', 'Error 2'] };
      mockInvoicesService.generateBatch.mockResolvedValue(mockResult);

      const result = await controller.generateBatch(batchDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockInvoicesService.generateBatch).toHaveBeenCalledWith(batchDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const mockResult = {
        data: [{ id: 'inv-1', invoiceNo: 'INV-001' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      mockInvoicesService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockInvoicesService.findAll).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockInvoicesService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ status: 'paid' });

      expect(mockInvoicesService.findAll).toHaveBeenCalledWith({ status: 'paid' });
    });

    it('should filter by customer', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockInvoicesService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ customerId: 'cust-1' });

      expect(mockInvoicesService.findAll).toHaveBeenCalledWith({ customerId: 'cust-1' });
    });
  });

  describe('findOne', () => {
    it('should return an invoice by id', async () => {
      const mockInvoice = { id: 'inv-1', invoiceNo: 'INV-001', totalAmount: 500 };
      mockInvoicesService.findOne.mockResolvedValue(mockInvoice);

      const result = await controller.findOne('inv-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
      expect(mockInvoicesService.findOne).toHaveBeenCalledWith('inv-1');
    });
  });

  describe('findByInvoiceNo', () => {
    it('should return an invoice by invoice number', async () => {
      const mockInvoice = { id: 'inv-1', invoiceNo: 'INV-001', totalAmount: 500 };
      mockInvoicesService.findByInvoiceNo.mockResolvedValue(mockInvoice);

      const result = await controller.findByInvoiceNo('INV-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
      expect(mockInvoicesService.findByInvoiceNo).toHaveBeenCalledWith('INV-001');
    });
  });

  describe('getCustomerInvoices', () => {
    it('should return customer invoices', async () => {
      const mockInvoices = [
        { id: 'inv-1', invoiceNo: 'INV-001' },
        { id: 'inv-2', invoiceNo: 'INV-002' },
      ];
      mockInvoicesService.getCustomerInvoices.mockResolvedValue(mockInvoices);

      const result = await controller.getCustomerInvoices('cust-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoices);
      expect(mockInvoicesService.getCustomerInvoices).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('getCustomerUnpaidInvoices', () => {
    it('should return customer unpaid invoices', async () => {
      const mockInvoices = [{ id: 'inv-1', invoiceNo: 'INV-001', status: 'issued' }];
      mockInvoicesService.getCustomerUnpaidInvoices.mockResolvedValue(mockInvoices);

      const result = await controller.getCustomerUnpaidInvoices('cust-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoices);
      expect(mockInvoicesService.getCustomerUnpaidInvoices).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('cancel', () => {
    it('should cancel an invoice', async () => {
      const cancelDto = { reason: 'Test cancellation' };
      const mockInvoice = { id: 'inv-1', status: 'cancelled' };
      mockInvoicesService.cancel.mockResolvedValue(mockInvoice);

      const result = await controller.cancel('inv-1', cancelDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoice);
      expect(mockInvoicesService.cancel).toHaveBeenCalledWith('inv-1', cancelDto);
    });
  });

  describe('getOverdueInvoices', () => {
    it('should return overdue invoices', async () => {
      const mockInvoices = [{ id: 'inv-1', status: 'overdue' }];
      mockInvoicesService.getOverdueInvoices.mockResolvedValue(mockInvoices);

      const result = await controller.getOverdueInvoices();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvoices);
      expect(mockInvoicesService.getOverdueInvoices).toHaveBeenCalled();
    });
  });

  describe('calculateConsumption', () => {
    it('should calculate consumption', async () => {
      const calcDto = {
        customerId: 'cust-1',
        previousReading: 1000,
        currentReading: 1500,
      };

      const mockResult = {
        consumption: 500,
        consumptionAmount: 250,
        fixedCharges: 50,
        vatAmount: 45,
        totalAmount: 345,
      };
      mockInvoicesService.calculateConsumption.mockResolvedValue(mockResult);

      const result = await controller.calculateConsumption(calcDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockInvoicesService.calculateConsumption).toHaveBeenCalledWith(calcDto);
    });
  });
});
