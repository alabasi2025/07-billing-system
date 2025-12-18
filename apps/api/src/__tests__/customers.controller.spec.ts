import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from '../modules/customers/customers.controller';
import { CustomersService } from '../modules/customers/customers.service';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  const mockCustomersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByAccountNo: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    suspend: jest.fn(),
    activate: jest.fn(),
    remove: jest.fn(),
    getStatistics: jest.fn(),
    getCustomerInvoices: jest.fn(),
    getCustomerPayments: jest.fn(),
    getCustomerBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createDto = {
        name: 'Test Customer',
        categoryId: 'cat-1',
        idType: 'national_id',
        idNumber: '1234567890',
        phone: '0501234567',
        address: 'Test Address',
      };

      const mockCustomer = { id: 'new-id', accountNo: 'ACC001', ...createDto };
      mockCustomersService.create.mockResolvedValue(mockCustomer);

      const result = await controller.create(createDto as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockCustomersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockResult = {
        data: [{ id: '1', name: 'Customer 1' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      mockCustomersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 10 } as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockCustomersService.findAll).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockCustomersService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ status: 'active' } as any);

      expect(mockCustomersService.findAll).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = { id: '1', name: 'Customer 1' };
      mockCustomersService.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.findOne('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockCustomersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByAccountNo', () => {
    it('should return a customer by account number', async () => {
      const mockCustomer = { id: '1', accountNo: 'ACC001', name: 'Customer 1' };
      mockCustomersService.findByAccountNo.mockResolvedValue(mockCustomer);

      const result = await controller.findByAccountNo('ACC001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockCustomersService.findByAccountNo).toHaveBeenCalledWith('ACC001');
    });
  });

  describe('update', () => {
    it('should update an existing customer', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockCustomer = { id: '1', name: 'Updated Name' };
      mockCustomersService.update.mockResolvedValue(mockCustomer);

      const result = await controller.update('1', updateDto as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockCustomersService.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('changeStatus', () => {
    it('should change customer status', async () => {
      const statusDto = { status: 'suspended', reason: 'Test reason' };
      const mockCustomer = { id: '1', status: 'suspended' };
      mockCustomersService.changeStatus.mockResolvedValue(mockCustomer);

      const result = await controller.changeStatus('1', statusDto as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockCustomersService.changeStatus).toHaveBeenCalledWith('1', statusDto);
    });
  });

  describe('suspend', () => {
    it('should suspend a customer', async () => {
      const mockCustomer = { id: '1', status: 'suspended' };
      mockCustomersService.suspend.mockResolvedValue(mockCustomer);

      const result = await controller.suspend('1', 'Test reason');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockCustomersService.suspend).toHaveBeenCalledWith('1', 'Test reason');
    });
  });

  describe('activate', () => {
    it('should activate a customer', async () => {
      const mockCustomer = { id: '1', status: 'active' };
      mockCustomersService.activate.mockResolvedValue(mockCustomer);

      const result = await controller.activate('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockCustomersService.activate).toHaveBeenCalledWith('1');
    });
  });

  describe('remove', () => {
    it('should soft delete a customer', async () => {
      const mockResult = { message: 'تم إغلاق حساب العميل بنجاح' };
      mockCustomersService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResult.message);
      expect(mockCustomersService.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('getStatistics', () => {
    it('should return customer statistics', async () => {
      const mockStats = {
        total: 100,
        byStatus: { active: 80, suspended: 10, disconnected: 5, closed: 5 },
      };
      mockCustomersService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(mockCustomersService.getStatistics).toHaveBeenCalled();
    });
  });

  describe('getCustomerInvoices', () => {
    it('should return customer invoices', async () => {
      const mockResult = {
        data: [{ id: 'inv-1', invoiceNo: 'INV-001' }],
        meta: { total: 1 },
      };
      mockCustomersService.getCustomerInvoices.mockResolvedValue(mockResult);

      const result = await controller.getCustomerInvoices('1', '1', '10');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockCustomersService.getCustomerInvoices).toHaveBeenCalledWith('1', { page: 1, limit: 10 });
    });
  });

  describe('getCustomerPayments', () => {
    it('should return customer payments', async () => {
      const mockResult = {
        data: [{ id: 'pay-1', paymentNo: 'PAY-001' }],
        meta: { total: 1 },
      };
      mockCustomersService.getCustomerPayments.mockResolvedValue(mockResult);

      const result = await controller.getCustomerPayments('1', '1', '10');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockCustomersService.getCustomerPayments).toHaveBeenCalledWith('1', { page: 1, limit: 10 });
    });
  });

  describe('getCustomerBalance', () => {
    it('should return customer balance', async () => {
      const mockBalance = {
        totalInvoiced: 5000,
        totalPaid: 3000,
        balance: 2000,
      };
      mockCustomersService.getCustomerBalance.mockResolvedValue(mockBalance);

      const result = await controller.getCustomerBalance('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBalance);
      expect(mockCustomersService.getCustomerBalance).toHaveBeenCalledWith('1');
    });
  });
});
