import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from '../modules/reports/reports.controller';
import { ReportsService } from '../modules/reports/reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockReportsService = {
    getDashboardStats: jest.fn(),
    getRevenueReport: jest.fn(),
    getAgingReport: jest.fn(),
    getDetailedAgingReport: jest.fn(),
    getCollectionReport: jest.fn(),
    getConsumptionReport: jest.fn(),
    getCustomerStatement: jest.fn(),
    getDailyCashClosing: jest.fn(),
    getMeterReadingsReport: jest.fn(),
    getDebtorsReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: mockReportsService },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        totalCustomers: 150,
        activeCustomers: 120,
        totalMeters: 200,
        pendingInvoices: 45,
        totalRevenue: 50000,
      };
      mockReportsService.getDashboardStats.mockResolvedValue(mockStats);

      const result = await controller.getDashboardStats();

      expect(service.getDashboardStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('getRevenueReport', () => {
    it('should return revenue report for period', async () => {
      const mockReport = {
        period: '2024-01',
        totalInvoiced: 100000,
        totalCollected: 75000,
      };
      mockReportsService.getRevenueReport.mockResolvedValue(mockReport);

      const result = await controller.getRevenueReport({ period: '2024-01' });

      expect(service.getRevenueReport).toHaveBeenCalledWith({ period: '2024-01' });
      expect(result).toEqual(mockReport);
    });

    it('should return revenue report for date range', async () => {
      const query = { fromDate: '2024-01-01', toDate: '2024-12-31' };
      mockReportsService.getRevenueReport.mockResolvedValue({});

      await controller.getRevenueReport(query);

      expect(service.getRevenueReport).toHaveBeenCalledWith(query);
    });
  });

  describe('getAgingReport', () => {
    it('should return aging report', async () => {
      const mockReport = {
        summary: { current: 10000, days30: 5000, days60: 3000 },
        details: [],
      };
      mockReportsService.getAgingReport.mockResolvedValue(mockReport);

      const result = await controller.getAgingReport();

      expect(service.getAgingReport).toHaveBeenCalled();
      expect(result.summary.current).toBe(10000);
    });
  });

  describe('getDetailedAgingReport', () => {
    it('should return detailed aging report', async () => {
      const mockReport = { summary: {}, customers: [] };
      mockReportsService.getDetailedAgingReport.mockResolvedValue(mockReport);

      const result = await controller.getDetailedAgingReport();

      expect(service.getDetailedAgingReport).toHaveBeenCalled();
      expect(result).toEqual(mockReport);
    });
  });

  describe('getCollectionReport', () => {
    it('should return collection report', async () => {
      const mockReport = {
        totalCollected: 75000,
        byCash: 45000,
        byBank: 20000,
      };
      const query = { fromDate: '2024-01-01', toDate: '2024-01-31' };
      mockReportsService.getCollectionReport.mockResolvedValue(mockReport);

      const result = await controller.getCollectionReport(query);

      expect(service.getCollectionReport).toHaveBeenCalledWith(query);
      expect(result.totalCollected).toBe(75000);
    });
  });

  describe('getConsumptionReport', () => {
    it('should return consumption report', async () => {
      const mockReport = {
        totalConsumption: 50000,
        averageConsumption: 250,
      };
      mockReportsService.getConsumptionReport.mockResolvedValue(mockReport);

      const result = await controller.getConsumptionReport({ period: '2024-01' });

      expect(service.getConsumptionReport).toHaveBeenCalled();
      expect(result.totalConsumption).toBe(50000);
    });
  });

  describe('getCustomerStatement', () => {
    it('should return customer statement', async () => {
      const mockStatement = {
        customer: { name: 'عميل 1', accountNo: 'ACC-001' },
        openingBalance: 0,
        transactions: [],
        closingBalance: 500,
      };
      mockReportsService.getCustomerStatement.mockResolvedValue(mockStatement);

      const result = await controller.getCustomerStatement('cust-1', {});

      expect(service.getCustomerStatement).toHaveBeenCalledWith('cust-1', {});
      expect(result.customer.name).toBe('عميل 1');
    });

    it('should return customer statement with date range', async () => {
      const query = { fromDate: '2024-01-01', toDate: '2024-12-31' };
      mockReportsService.getCustomerStatement.mockResolvedValue({});

      await controller.getCustomerStatement('cust-1', query);

      expect(service.getCustomerStatement).toHaveBeenCalledWith('cust-1', query);
    });
  });

  describe('getDailyCashClosing', () => {
    it('should return daily cash closing report', async () => {
      const mockReport = {
        date: '2024-01-15',
        openingBalance: 1000,
        totalReceived: 5000,
        closingBalance: 5500,
      };
      mockReportsService.getDailyCashClosing.mockResolvedValue(mockReport);

      const result = await controller.getDailyCashClosing({ date: '2024-01-15' });

      expect(service.getDailyCashClosing).toHaveBeenCalledWith('2024-01-15');
      expect(result.closingBalance).toBe(5500);
    });
  });

  describe('getMeterReadingsReport', () => {
    it('should return meter readings report', async () => {
      const mockReport = {
        period: '2024-01',
        totalReadings: 180,
        pendingReadings: 20,
      };
      mockReportsService.getMeterReadingsReport.mockResolvedValue(mockReport);

      const result = await controller.getMeterReadingsReport({ period: '2024-01' });

      expect(service.getMeterReadingsReport).toHaveBeenCalled();
      expect(result.totalReadings).toBe(180);
    });
  });

  describe('getDebtorsReport', () => {
    it('should return debtors report', async () => {
      const mockReport = {
        totalDebtors: 50,
        totalDebt: 25000,
        debtors: [],
      };
      mockReportsService.getDebtorsReport.mockResolvedValue(mockReport);

      const result = await controller.getDebtorsReport({});

      expect(service.getDebtorsReport).toHaveBeenCalled();
      expect(result.totalDebtors).toBe(50);
    });

    it('should filter debtors by minimum amount', async () => {
      mockReportsService.getDebtorsReport.mockResolvedValue({});

      await controller.getDebtorsReport({ minAmount: 1000 });

      expect(service.getDebtorsReport).toHaveBeenCalledWith({ minAmount: 1000 });
    });
  });
});
