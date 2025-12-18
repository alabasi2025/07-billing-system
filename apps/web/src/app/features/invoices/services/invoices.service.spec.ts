import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let httpMock: HttpTestingController;
  const apiUrl = '/api/v1/invoices';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InvoicesService],
    });

    service = TestBed.inject(InvoicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getInvoices', () => {
    it('should fetch invoices list', () => {
      const mockResponse = {
        success: true,
        data: [
          { id: '1', invoiceNo: 'INV-001', totalAmount: 500 },
          { id: '2', invoiceNo: 'INV-002', totalAmount: 750 },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      service.getInvoices({}).subscribe((response) => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].invoiceNo).toBe('INV-001');
      });

      const req = httpMock.expectOne((r) => r.url.includes(apiUrl));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should filter by status', () => {
      service.getInvoices({ status: 'paid' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('status') === 'paid'
      );
      req.flush({ success: true, data: [] });
    });

    it('should filter by billing period', () => {
      service.getInvoices({ billingPeriod: '2024-01' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('billingPeriod') === '2024-01'
      );
      req.flush({ success: true, data: [] });
    });

    it('should filter by date range', () => {
      service.getInvoices({ fromDate: '2024-01-01', toDate: '2024-01-31' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('fromDate') === '2024-01-01' &&
        r.params.get('toDate') === '2024-01-31'
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('getInvoice', () => {
    it('should fetch single invoice', () => {
      const mockInvoice = {
        id: '1',
        invoiceNo: 'INV-001',
        totalAmount: 500,
        customer: { name: 'عميل 1' },
      };

      service.getInvoice('1').subscribe((response) => {
        expect(response.data.invoiceNo).toBe('INV-001');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockInvoice });
    });
  });

  describe('generateInvoice', () => {
    it('should generate new invoice', () => {
      const invoiceData = {
        customerId: 'cust-1',
        billingPeriod: '2024-01',
        readingId: 'read-1',
      };

      service.generateInvoice(invoiceData).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.invoiceNo).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/generate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(invoiceData);
      req.flush({ success: true, data: { id: 'new-id', invoiceNo: 'INV-NEW' } });
    });
  });

  describe('calculateInvoice', () => {
    it('should calculate invoice amount', () => {
      const calcData = {
        customerId: 'cust-1',
        previousReading: 100,
        currentReading: 200,
      };

      service.calculateInvoice(calcData).subscribe((response) => {
        expect(response.data.consumption).toBe(100);
      });

      const req = httpMock.expectOne(`${apiUrl}/calculate`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { consumption: 100, amount: 50 } });
    });
  });

  describe('cancelInvoice', () => {
    it('should cancel invoice', () => {
      service.cancelInvoice('1').subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });

  describe('getStatistics', () => {
    it('should fetch invoice statistics', () => {
      const mockStats = {
        total: 150,
        paid: 100,
        pending: 30,
        overdue: 20,
        totalAmount: 75000,
        paidAmount: 50000,
      };

      service.getStatistics().subscribe((response) => {
        expect(response.data.total).toBe(150);
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStats });
    });
  });

  describe('printInvoice', () => {
    it('should get print data', () => {
      service.printInvoice('1').subscribe((response) => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/print`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} });
    });
  });

  describe('bulkGenerate', () => {
    it('should generate invoices in bulk', () => {
      const bulkData = {
        billingPeriod: '2024-01',
        customerIds: ['cust-1', 'cust-2', 'cust-3'],
      };

      service.bulkGenerate(bulkData).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/bulk-generate`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { generated: 3 } });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', () => {
      service.getInvoice('non-existent').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/non-existent`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle generation error', () => {
      service.generateInvoice({} as any).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/generate`);
      req.flush({ message: 'Invalid data' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
