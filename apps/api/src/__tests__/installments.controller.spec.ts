import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentsController } from '../modules/installments/installments.controller';
import { InstallmentsService } from '../modules/installments/installments.service';

describe('InstallmentsController', () => {
  let controller: InstallmentsController;
  let service: InstallmentsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    pay: jest.fn(),
    getOverdue: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstallmentsController],
      providers: [
        { provide: InstallmentsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<InstallmentsController>(InstallmentsController);
    service = module.get<InstallmentsService>(InstallmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of installments', async () => {
      const mockInstallments = [
        { id: '1', amount: 500, dueDate: '2024-02-01', status: 'paid' },
        { id: '2', amount: 500, dueDate: '2024-03-01', status: 'pending' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockInstallments, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'pending' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });

    it('should filter by payment plan', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ paymentPlanId: 'plan-1' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ paymentPlanId: 'plan-1' }));
    });
  });

  describe('findOne', () => {
    it('should return single installment', async () => {
      const mockInstallment = { id: '1', amount: 500, dueDate: '2024-02-01' };
      mockService.findOne.mockResolvedValue(mockInstallment);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.amount).toBe(500);
    });
  });

  describe('create', () => {
    it('should create new installment', async () => {
      const createDto = {
        paymentPlanId: 'plan-1',
        amount: 500,
        dueDate: '2024-04-01',
        installmentNumber: 3,
      };
      const mockInstallment = { id: 'new-id', ...createDto };
      mockService.create.mockResolvedValue(mockInstallment);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update installment', async () => {
      const updateDto = { dueDate: '2024-04-15' };
      const mockInstallment = { id: '1', dueDate: '2024-04-15' };
      mockService.update.mockResolvedValue(mockInstallment);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.dueDate).toBe('2024-04-15');
    });
  });

  describe('delete', () => {
    it('should delete installment', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('pay', () => {
    it('should pay installment', async () => {
      const payDto = {
        paymentMethod: 'cash',
        paymentDate: '2024-02-15',
        amount: 500,
      };
      const mockInstallment = { id: '1', status: 'paid', paidDate: '2024-02-15' };
      mockService.pay.mockResolvedValue(mockInstallment);

      const result = await controller.pay('1', payDto);

      expect(service.pay).toHaveBeenCalledWith('1', payDto);
      expect(result.status).toBe('paid');
    });

    it('should pay partial amount', async () => {
      const payDto = {
        paymentMethod: 'cash',
        paymentDate: '2024-02-15',
        amount: 250,
      };
      const mockInstallment = { id: '1', status: 'partial', paidAmount: 250 };
      mockService.pay.mockResolvedValue(mockInstallment);

      const result = await controller.pay('1', payDto);

      expect(result.status).toBe('partial');
      expect(result.paidAmount).toBe(250);
    });
  });

  describe('getOverdue', () => {
    it('should return overdue installments', async () => {
      const mockOverdue = [
        { id: '1', amount: 500, dueDate: '2024-01-01', daysOverdue: 45 },
        { id: '2', amount: 600, dueDate: '2024-01-15', daysOverdue: 31 },
      ];
      mockService.getOverdue.mockResolvedValue(mockOverdue);

      const result = await controller.getOverdue();

      expect(service.getOverdue).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });
  });

  describe('getStatistics', () => {
    it('should return installment statistics', async () => {
      const mockStats = {
        totalInstallments: 100,
        paidInstallments: 60,
        pendingInstallments: 30,
        overdueInstallments: 10,
        totalAmount: 50000,
        collectedAmount: 30000,
        pendingAmount: 20000,
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalInstallments).toBe(100);
    });
  });
});
