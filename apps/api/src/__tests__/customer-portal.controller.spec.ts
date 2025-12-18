import { Test, TestingModule } from '@nestjs/testing';
import { CustomerPortalController } from '../modules/customer-portal/customer-portal.controller';
import { CustomerPortalService } from '../modules/customer-portal/customer-portal.service';

describe('CustomerPortalController', () => {
  let controller: CustomerPortalController;
  let service: CustomerPortalService;

  const mockService = {
    login: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getInvoices: jest.fn(),
    getInvoice: jest.fn(),
    getPayments: jest.fn(),
    makePayment: jest.fn(),
    getConsumptionHistory: jest.fn(),
    submitComplaint: jest.fn(),
    getComplaints: jest.fn(),
    submitServiceRequest: jest.fn(),
    getServiceRequests: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerPortalController],
      providers: [
        { provide: CustomerPortalService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<CustomerPortalController>(CustomerPortalController);
    service = module.get<CustomerPortalService>(CustomerPortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Authentication', () => {
    describe('login', () => {
      it('should login customer', async () => {
        const loginDto = { accountNo: 'ACC-001', password: 'password123' };
        const mockResult = {
          success: true,
          token: 'jwt-token',
          customer: { id: '1', name: 'عميل 1' },
        };
        mockService.login.mockResolvedValue(mockResult);

        const result = await controller.login(loginDto);

        expect(service.login).toHaveBeenCalledWith(loginDto);
        expect(result.token).toBeDefined();
      });

      it('should reject invalid credentials', async () => {
        const loginDto = { accountNo: 'ACC-001', password: 'wrong' };
        mockService.login.mockRejectedValue(new Error('Invalid credentials'));

        await expect(controller.login(loginDto)).rejects.toThrow();
      });
    });

    describe('register', () => {
      it('should register new customer', async () => {
        const registerDto = {
          accountNo: 'ACC-001',
          phone: '0501234567',
          email: 'customer@example.com',
          password: 'password123',
        };
        const mockResult = {
          success: true,
          message: 'تم التسجيل بنجاح',
        };
        mockService.register.mockResolvedValue(mockResult);

        const result = await controller.register(registerDto);

        expect(service.register).toHaveBeenCalledWith(registerDto);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Profile', () => {
    describe('getProfile', () => {
      it('should return customer profile', async () => {
        const mockProfile = {
          id: '1',
          name: 'عميل 1',
          accountNo: 'ACC-001',
          phone: '0501234567',
          email: 'customer@example.com',
          address: 'الرياض',
        };
        mockService.getProfile.mockResolvedValue(mockProfile);

        const result = await controller.getProfile('1');

        expect(service.getProfile).toHaveBeenCalledWith('1');
        expect(result.name).toBe('عميل 1');
      });
    });

    describe('updateProfile', () => {
      it('should update customer profile', async () => {
        const updateDto = { phone: '0509876543', email: 'new@example.com' };
        const mockProfile = { id: '1', ...updateDto };
        mockService.updateProfile.mockResolvedValue(mockProfile);

        const result = await controller.updateProfile('1', updateDto);

        expect(service.updateProfile).toHaveBeenCalledWith('1', updateDto);
        expect(result.phone).toBe('0509876543');
      });
    });

    describe('changePassword', () => {
      it('should change password', async () => {
        const changeDto = { currentPassword: 'old123', newPassword: 'new123' };
        mockService.changePassword.mockResolvedValue({ success: true });

        const result = await controller.changePassword('1', changeDto);

        expect(service.changePassword).toHaveBeenCalledWith('1', changeDto);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invoices', () => {
    describe('getInvoices', () => {
      it('should return customer invoices', async () => {
        const mockInvoices = [
          { id: '1', invoiceNo: 'INV-001', amount: 500, status: 'unpaid' },
          { id: '2', invoiceNo: 'INV-002', amount: 300, status: 'paid' },
        ];
        mockService.getInvoices.mockResolvedValue(mockInvoices);

        const result = await controller.getInvoices('1', {});

        expect(service.getInvoices).toHaveBeenCalledWith('1', {});
        expect(result.length).toBe(2);
      });
    });

    describe('getInvoice', () => {
      it('should return single invoice', async () => {
        const mockInvoice = { id: '1', invoiceNo: 'INV-001', amount: 500 };
        mockService.getInvoice.mockResolvedValue(mockInvoice);

        const result = await controller.getInvoice('1', 'inv-1');

        expect(service.getInvoice).toHaveBeenCalledWith('1', 'inv-1');
        expect(result.invoiceNo).toBe('INV-001');
      });
    });
  });

  describe('Payments', () => {
    describe('getPayments', () => {
      it('should return customer payments', async () => {
        const mockPayments = [
          { id: '1', paymentNo: 'PAY-001', amount: 500 },
          { id: '2', paymentNo: 'PAY-002', amount: 300 },
        ];
        mockService.getPayments.mockResolvedValue(mockPayments);

        const result = await controller.getPayments('1', {});

        expect(service.getPayments).toHaveBeenCalledWith('1', {});
        expect(result.length).toBe(2);
      });
    });

    describe('makePayment', () => {
      it('should make online payment', async () => {
        const paymentDto = {
          invoiceIds: ['inv-1'],
          amount: 500,
          paymentMethod: 'card',
          cardToken: 'card-token',
        };
        const mockResult = {
          success: true,
          paymentNo: 'PAY-NEW',
          receiptUrl: 'https://example.com/receipt',
        };
        mockService.makePayment.mockResolvedValue(mockResult);

        const result = await controller.makePayment('1', paymentDto);

        expect(service.makePayment).toHaveBeenCalledWith('1', paymentDto);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Consumption', () => {
    describe('getConsumptionHistory', () => {
      it('should return consumption history', async () => {
        const mockHistory = [
          { month: '2024-01', consumption: 250, amount: 125 },
          { month: '2024-02', consumption: 280, amount: 140 },
        ];
        mockService.getConsumptionHistory.mockResolvedValue(mockHistory);

        const result = await controller.getConsumptionHistory('1', {});

        expect(service.getConsumptionHistory).toHaveBeenCalledWith('1', {});
        expect(result.length).toBe(2);
      });
    });
  });

  describe('Complaints', () => {
    describe('submitComplaint', () => {
      it('should submit complaint', async () => {
        const complaintDto = {
          subject: 'فاتورة مرتفعة',
          description: 'الفاتورة أعلى من المعتاد',
          category: 'billing',
        };
        const mockComplaint = { id: 'new-id', complaintNo: 'CMP-NEW', ...complaintDto };
        mockService.submitComplaint.mockResolvedValue(mockComplaint);

        const result = await controller.submitComplaint('1', complaintDto);

        expect(service.submitComplaint).toHaveBeenCalledWith('1', complaintDto);
        expect(result.complaintNo).toBeDefined();
      });
    });

    describe('getComplaints', () => {
      it('should return customer complaints', async () => {
        const mockComplaints = [
          { id: '1', complaintNo: 'CMP-001', status: 'open' },
          { id: '2', complaintNo: 'CMP-002', status: 'resolved' },
        ];
        mockService.getComplaints.mockResolvedValue(mockComplaints);

        const result = await controller.getComplaints('1');

        expect(service.getComplaints).toHaveBeenCalledWith('1');
        expect(result.length).toBe(2);
      });
    });
  });

  describe('Service Requests', () => {
    describe('submitServiceRequest', () => {
      it('should submit service request', async () => {
        const requestDto = {
          type: 'meter_replacement',
          description: 'العداد لا يعمل',
        };
        const mockRequest = { id: 'new-id', requestNo: 'SRV-NEW', ...requestDto };
        mockService.submitServiceRequest.mockResolvedValue(mockRequest);

        const result = await controller.submitServiceRequest('1', requestDto);

        expect(service.submitServiceRequest).toHaveBeenCalledWith('1', requestDto);
        expect(result.requestNo).toBeDefined();
      });
    });

    describe('getServiceRequests', () => {
      it('should return customer service requests', async () => {
        const mockRequests = [
          { id: '1', requestNo: 'SRV-001', status: 'pending' },
          { id: '2', requestNo: 'SRV-002', status: 'completed' },
        ];
        mockService.getServiceRequests.mockResolvedValue(mockRequests);

        const result = await controller.getServiceRequests('1');

        expect(service.getServiceRequests).toHaveBeenCalledWith('1');
        expect(result.length).toBe(2);
      });
    });
  });
});
