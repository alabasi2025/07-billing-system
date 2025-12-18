import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from '../modules/pos/pos.controller';
import { PosService } from '../modules/pos/pos.service';

describe('PosController', () => {
  let controller: PosController;
  let service: PosService;

  const mockService = {
    searchCustomer: jest.fn(),
    getCustomerBalance: jest.fn(),
    getCustomerInvoices: jest.fn(),
    processPayment: jest.fn(),
    printReceipt: jest.fn(),
    getTransactionHistory: jest.fn(),
    getDailySummary: jest.fn(),
    openSession: jest.fn(),
    closeSession: jest.fn(),
    getCurrentSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [
        { provide: PosService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<PosController>(PosController);
    service = module.get<PosService>(PosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchCustomer', () => {
    it('should search customer by account number', async () => {
      const mockCustomer = { id: '1', name: 'عميل 1', accountNo: 'ACC-001', balance: 500 };
      mockService.searchCustomer.mockResolvedValue(mockCustomer);

      const result = await controller.searchCustomer({ accountNo: 'ACC-001' });

      expect(service.searchCustomer).toHaveBeenCalledWith({ accountNo: 'ACC-001' });
      expect(result.accountNo).toBe('ACC-001');
    });

    it('should search customer by meter number', async () => {
      const mockCustomer = { id: '1', name: 'عميل 1', meterNo: 'MTR-001' };
      mockService.searchCustomer.mockResolvedValue(mockCustomer);

      const result = await controller.searchCustomer({ meterNo: 'MTR-001' });

      expect(service.searchCustomer).toHaveBeenCalledWith({ meterNo: 'MTR-001' });
    });

    it('should search customer by phone', async () => {
      const mockCustomer = { id: '1', name: 'عميل 1', phone: '0501234567' };
      mockService.searchCustomer.mockResolvedValue(mockCustomer);

      const result = await controller.searchCustomer({ phone: '0501234567' });

      expect(service.searchCustomer).toHaveBeenCalledWith({ phone: '0501234567' });
    });
  });

  describe('getCustomerBalance', () => {
    it('should return customer balance', async () => {
      const mockBalance = {
        customerId: 'cust-1',
        totalBalance: 1500,
        currentInvoices: 1000,
        overdueInvoices: 500,
      };
      mockService.getCustomerBalance.mockResolvedValue(mockBalance);

      const result = await controller.getCustomerBalance('cust-1');

      expect(service.getCustomerBalance).toHaveBeenCalledWith('cust-1');
      expect(result.totalBalance).toBe(1500);
    });
  });

  describe('getCustomerInvoices', () => {
    it('should return customer unpaid invoices', async () => {
      const mockInvoices = [
        { id: '1', invoiceNo: 'INV-001', amount: 500, status: 'unpaid' },
        { id: '2', invoiceNo: 'INV-002', amount: 1000, status: 'partial' },
      ];
      mockService.getCustomerInvoices.mockResolvedValue(mockInvoices);

      const result = await controller.getCustomerInvoices('cust-1');

      expect(service.getCustomerInvoices).toHaveBeenCalledWith('cust-1');
      expect(result.length).toBe(2);
    });
  });

  describe('processPayment', () => {
    it('should process cash payment', async () => {
      const paymentDto = {
        customerId: 'cust-1',
        invoiceIds: ['inv-1', 'inv-2'],
        amount: 1500,
        paymentMethod: 'cash',
        receivedAmount: 2000,
      };
      const mockResult = {
        success: true,
        receiptNo: 'RCP-001',
        change: 500,
        payment: { id: 'pay-1', amount: 1500 },
      };
      mockService.processPayment.mockResolvedValue(mockResult);

      const result = await controller.processPayment(paymentDto);

      expect(service.processPayment).toHaveBeenCalledWith(paymentDto);
      expect(result.success).toBe(true);
      expect(result.change).toBe(500);
    });

    it('should process card payment', async () => {
      const paymentDto = {
        customerId: 'cust-1',
        invoiceIds: ['inv-1'],
        amount: 500,
        paymentMethod: 'card',
        cardLastFour: '1234',
      };
      const mockResult = {
        success: true,
        receiptNo: 'RCP-002',
        payment: { id: 'pay-2', amount: 500 },
      };
      mockService.processPayment.mockResolvedValue(mockResult);

      const result = await controller.processPayment(paymentDto);

      expect(result.success).toBe(true);
    });
  });

  describe('printReceipt', () => {
    it('should return receipt data for printing', async () => {
      const mockReceipt = {
        receiptNo: 'RCP-001',
        date: '2024-02-15',
        customer: { name: 'عميل 1', accountNo: 'ACC-001' },
        amount: 1500,
        paymentMethod: 'cash',
        invoices: [],
      };
      mockService.printReceipt.mockResolvedValue(mockReceipt);

      const result = await controller.printReceipt('pay-1');

      expect(service.printReceipt).toHaveBeenCalledWith('pay-1');
      expect(result.receiptNo).toBe('RCP-001');
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      const mockHistory = [
        { id: '1', type: 'payment', amount: 500, date: '2024-02-15' },
        { id: '2', type: 'payment', amount: 1000, date: '2024-02-14' },
      ];
      mockService.getTransactionHistory.mockResolvedValue(mockHistory);

      const result = await controller.getTransactionHistory({});

      expect(service.getTransactionHistory).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary', async () => {
      const mockSummary = {
        date: '2024-02-15',
        totalTransactions: 25,
        totalAmount: 12500,
        byCash: 8000,
        byCard: 3000,
        byBank: 1500,
      };
      mockService.getDailySummary.mockResolvedValue(mockSummary);

      const result = await controller.getDailySummary({ date: '2024-02-15' });

      expect(service.getDailySummary).toHaveBeenCalledWith('2024-02-15');
      expect(result.totalTransactions).toBe(25);
    });
  });

  describe('Session Management', () => {
    describe('openSession', () => {
      it('should open new POS session', async () => {
        const openDto = { terminalId: 'term-1', openingBalance: 500 };
        const mockSession = { id: 'session-1', status: 'open', ...openDto };
        mockService.openSession.mockResolvedValue(mockSession);

        const result = await controller.openSession(openDto);

        expect(service.openSession).toHaveBeenCalledWith(openDto);
        expect(result.status).toBe('open');
      });
    });

    describe('closeSession', () => {
      it('should close POS session', async () => {
        const closeDto = { closingBalance: 5500, notes: 'إغلاق نهاية اليوم' };
        const mockSession = { id: 'session-1', status: 'closed', closingBalance: 5500 };
        mockService.closeSession.mockResolvedValue(mockSession);

        const result = await controller.closeSession('session-1', closeDto);

        expect(service.closeSession).toHaveBeenCalledWith('session-1', closeDto);
        expect(result.status).toBe('closed');
      });
    });

    describe('getCurrentSession', () => {
      it('should return current active session', async () => {
        const mockSession = { id: 'session-1', status: 'open', terminalId: 'term-1' };
        mockService.getCurrentSession.mockResolvedValue(mockSession);

        const result = await controller.getCurrentSession('term-1');

        expect(service.getCurrentSession).toHaveBeenCalledWith('term-1');
        expect(result.status).toBe('open');
      });
    });
  });
});
