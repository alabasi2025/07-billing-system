import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let httpMock: HttpTestingController;
  const apiUrl = '/api/v1/payments';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentsService],
    });

    service = TestBed.inject(PaymentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPayments', () => {
    it('should fetch payments list', () => {
      const mockResponse = {
        success: true,
        data: [
          { id: '1', paymentNo: 'PAY-001', amount: 500 },
          { id: '2', paymentNo: 'PAY-002', amount: 300 },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      service.getPayments({}).subscribe((response) => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].paymentNo).toBe('PAY-001');
      });

      const req = httpMock.expectOne((r) => r.url.includes(apiUrl));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should filter by payment method', () => {
      service.getPayments({ paymentMethod: 'cash' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('paymentMethod') === 'cash'
      );
      req.flush({ success: true, data: [] });
    });

    it('should filter by date range', () => {
      service.getPayments({ fromDate: '2024-01-01', toDate: '2024-01-31' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('fromDate') === '2024-01-01' &&
        r.params.get('toDate') === '2024-01-31'
      );
      req.flush({ success: true, data: [] });
    });

    it('should filter by customer', () => {
      service.getPayments({ customerId: 'cust-1' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('customerId') === 'cust-1'
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('getPayment', () => {
    it('should fetch single payment', () => {
      const mockPayment = {
        id: '1',
        paymentNo: 'PAY-001',
        amount: 500,
        customer: { name: 'عميل 1' },
      };

      service.getPayment('1').subscribe((response) => {
        expect(response.data.paymentNo).toBe('PAY-001');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockPayment });
    });
  });

  describe('createPayment', () => {
    it('should create new payment', () => {
      const paymentData = {
        customerId: 'cust-1',
        invoiceId: 'inv-1',
        amount: 500,
        paymentMethod: 'cash',
        paymentDate: '2024-01-15',
      };

      service.createPayment(paymentData).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.paymentNo).toBeDefined();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(paymentData);
      req.flush({ success: true, data: { id: 'new-id', paymentNo: 'PAY-NEW', ...paymentData } });
    });

    it('should create payment with cheque details', () => {
      const paymentData = {
        customerId: 'cust-1',
        amount: 1000,
        paymentMethod: 'cheque',
        chequeNo: 'CHQ-123',
        chequeDate: '2024-02-15',
        bankName: 'بنك الراجحي',
      };

      service.createPayment(paymentData).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body.chequeNo).toBe('CHQ-123');
      req.flush({ success: true, data: { id: 'new-id', ...paymentData } });
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment', () => {
      service.cancelPayment('1').subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should cancel payment with reason', () => {
      service.cancelPayment('1', 'خطأ في المبلغ').subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/cancel`);
      expect(req.request.body.reason).toBe('خطأ في المبلغ');
      req.flush({ success: true });
    });
  });

  describe('getStatistics', () => {
    it('should fetch payment statistics', () => {
      const mockStats = {
        totalPayments: 200,
        totalAmount: 100000,
        todayPayments: 15,
        todayAmount: 5000,
        byCash: 60000,
        byBank: 30000,
        byCard: 10000,
      };

      service.getStatistics().subscribe((response) => {
        expect(response.data.totalPayments).toBe(200);
        expect(response.data.totalAmount).toBe(100000);
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStats });
    });

    it('should fetch statistics for date range', () => {
      service.getStatistics({ fromDate: '2024-01-01', toDate: '2024-01-31' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/statistics`) && 
        r.params.get('fromDate') === '2024-01-01'
      );
      req.flush({ success: true, data: {} });
    });
  });

  describe('printReceipt', () => {
    it('should get receipt print data', () => {
      service.printReceipt('1').subscribe((response) => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/receipt`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} });
    });
  });

  describe('getDailySummary', () => {
    it('should fetch daily summary', () => {
      const mockSummary = {
        date: '2024-01-15',
        totalPayments: 25,
        totalAmount: 12500,
        byMethod: {
          cash: 8000,
          bank: 3000,
          card: 1500,
        },
      };

      service.getDailySummary('2024-01-15').subscribe((response) => {
        expect(response.data.totalPayments).toBe(25);
      });

      const req = httpMock.expectOne((r) => 
        r.url.includes(`${apiUrl}/daily-summary`) && 
        r.params.get('date') === '2024-01-15'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockSummary });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', () => {
      service.getPayment('non-existent').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/non-existent`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle insufficient balance error', () => {
      service.createPayment({ amount: 10000 } as any).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Amount exceeds balance' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle duplicate payment error', () => {
      service.createPayment({ invoiceId: 'inv-1' } as any).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Duplicate payment' }, { status: 409, statusText: 'Conflict' });
    });
  });
});
