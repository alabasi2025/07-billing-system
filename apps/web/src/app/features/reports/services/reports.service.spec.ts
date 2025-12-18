import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;
  const apiUrl = '/api/v1/reports';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportsService],
    });

    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics', () => {
      const mockStats = {
        totalCustomers: 150,
        activeCustomers: 120,
        totalMeters: 200,
        activeMeters: 180,
        pendingInvoices: 45,
        overdueInvoices: 10,
        totalRevenue: 50000,
        totalCollected: 35000,
      };

      service.getDashboardStats().subscribe((response) => {
        expect(response.data.totalCustomers).toBe(150);
        expect(response.data.totalRevenue).toBe(50000);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStats });
    });
  });

  describe('getRevenueReport', () => {
    it('should fetch revenue report', () => {
      const mockReport = {
        period: '2024-01',
        totalInvoiced: 100000,
        totalCollected: 75000,
        outstanding: 25000,
        byCategory: [
          { category: 'سكني', amount: 50000 },
          { category: 'تجاري', amount: 30000 },
        ],
      };

      service.getRevenueReport({ period: '2024-01' }).subscribe((response) => {
        expect(response.data.totalInvoiced).toBe(100000);
      });

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/revenue`) && 
        r.params.get('period') === '2024-01'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReport });
    });

    it('should fetch revenue report with date range', () => {
      service.getRevenueReport({ fromDate: '2024-01-01', toDate: '2024-12-31' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/revenue`) && 
        r.params.get('fromDate') === '2024-01-01'
      );
      req.flush({ success: true, data: {} });
    });
  });

  describe('getAgingReport', () => {
    it('should fetch aging report', () => {
      const mockReport = {
        summary: {
          current: 10000,
          days30: 5000,
          days60: 3000,
          days90: 2000,
          over90: 1000,
        },
        details: [],
      };

      service.getAgingReport().subscribe((response) => {
        expect(response.data.summary.current).toBe(10000);
      });

      const req = httpMock.expectOne(`${apiUrl}/aging`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReport });
    });
  });

  describe('getDetailedAgingReport', () => {
    it('should fetch detailed aging report', () => {
      service.getDetailedAgingReport().subscribe((response) => {
        expect(response.data).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/detailed-aging`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { summary: {}, customers: [] } });
    });
  });

  describe('getCollectionReport', () => {
    it('should fetch collection report', () => {
      const mockReport = {
        totalCollected: 75000,
        byCash: 45000,
        byBank: 20000,
        byCard: 10000,
        byDay: [],
      };

      service.getCollectionReport({ fromDate: '2024-01-01', toDate: '2024-01-31' }).subscribe((response) => {
        expect(response.data.totalCollected).toBe(75000);
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/collection`));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReport });
    });
  });

  describe('getConsumptionReport', () => {
    it('should fetch consumption report', () => {
      const mockReport = {
        totalConsumption: 50000,
        averageConsumption: 250,
        byCategory: [],
        byMonth: [],
      };

      service.getConsumptionReport({ period: '2024-01' }).subscribe((response) => {
        expect(response.data.totalConsumption).toBe(50000);
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/consumption`));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReport });
    });
  });

  describe('getCustomerStatement', () => {
    it('should fetch customer statement', () => {
      const mockStatement = {
        customer: { name: 'عميل 1', accountNo: 'ACC-001' },
        openingBalance: 0,
        transactions: [],
        closingBalance: 500,
      };

      service.getCustomerStatement('cust-1').subscribe((response) => {
        expect(response.data.customer.name).toBe('عميل 1');
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/customer-statement/cust-1`));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStatement });
    });

    it('should fetch customer statement with date range', () => {
      service.getCustomerStatement('cust-1', { fromDate: '2024-01-01', toDate: '2024-12-31' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/customer-statement/cust-1`) && 
        r.params.get('fromDate') === '2024-01-01'
      );
      req.flush({ success: true, data: {} });
    });
  });

  describe('getDailyCashClosing', () => {
    it('should fetch daily cash closing report', () => {
      const mockReport = {
        date: '2024-01-15',
        openingBalance: 1000,
        totalReceived: 5000,
        totalPaid: 500,
        closingBalance: 5500,
        transactions: [],
      };

      service.getDailyCashClosing('2024-01-15').subscribe((response) => {
        expect(response.data.closingBalance).toBe(5500);
      });

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/daily-cash-closing`) && 
        r.params.get('date') === '2024-01-15'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReport });
    });
  });

  describe('getMeterReadingsReport', () => {
    it('should fetch meter readings report', () => {
      const mockReport = {
        period: '2024-01',
        totalReadings: 180,
        pendingReadings: 20,
        abnormalReadings: 5,
        readings: [],
      };

      service.getMeterReadingsReport({ period: '2024-01' }).subscribe((response) => {
        expect(response.data.totalReadings).toBe(180);
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/meter-readings`));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReport });
    });
  });

  describe('getDebtorsReport', () => {
    it('should fetch debtors report', () => {
      const mockReport = {
        totalDebtors: 50,
        totalDebt: 25000,
        debtors: [],
      };

      service.getDebtorsReport().subscribe((response) => {
        expect(response.data.totalDebtors).toBe(50);
      });

      const req = httpMock.expectOne(`${apiUrl}/debtors`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReport });
    });

    it('should filter debtors by minimum amount', () => {
      service.getDebtorsReport({ minAmount: 1000 }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/debtors`) && 
        r.params.get('minAmount') === '1000'
      );
      req.flush({ success: true, data: {} });
    });
  });

  describe('exportReport', () => {
    it('should export report to PDF', () => {
      service.exportReport('revenue', 'pdf', { period: '2024-01' }).subscribe((response) => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/revenue/export`) && 
        r.params.get('format') === 'pdf'
      );
      expect(req.request.method).toBe('GET');
      req.flush(new Blob());
    });

    it('should export report to Excel', () => {
      service.exportReport('aging', 'excel', {}).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/aging/export`) && 
        r.params.get('format') === 'excel'
      );
      req.flush(new Blob());
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', () => {
      service.getCustomerStatement('non-existent').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/customer-statement/non-existent`));
      req.flush({ message: 'Customer not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle server error', () => {
      service.getDashboardStats().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
