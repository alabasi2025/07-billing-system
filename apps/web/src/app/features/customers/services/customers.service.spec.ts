import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let httpMock: HttpTestingController;
  const apiUrl = '/api/v1/customers';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CustomersService],
    });

    service = TestBed.inject(CustomersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCustomers', () => {
    it('should fetch customers list', () => {
      const mockResponse = {
        success: true,
        data: [
          { id: '1', name: 'عميل 1', accountNo: 'ACC-001' },
          { id: '2', name: 'عميل 2', accountNo: 'ACC-002' },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      service.getCustomers({}).subscribe((response) => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].name).toBe('عميل 1');
      });

      const req = httpMock.expectOne((r) => r.url.includes(apiUrl));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should send query parameters', () => {
      service.getCustomers({ page: 2, limit: 20, status: 'active' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('page') === '2' &&
        r.params.get('limit') === '20' &&
        r.params.get('status') === 'active'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should send search parameter', () => {
      service.getCustomers({ search: 'أحمد' }).subscribe();

      const req = httpMock.expectOne((r) => 
        r.url.includes(apiUrl) && 
        r.params.get('search') === 'أحمد'
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('getCustomer', () => {
    it('should fetch single customer', () => {
      const mockCustomer = {
        id: '1',
        name: 'عميل 1',
        accountNo: 'ACC-001',
        phone: '0501234567',
      };

      service.getCustomer('1').subscribe((response) => {
        expect(response.data.id).toBe('1');
        expect(response.data.name).toBe('عميل 1');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockCustomer });
    });
  });

  describe('createCustomer', () => {
    it('should create new customer', () => {
      const newCustomer = {
        name: 'عميل جديد',
        categoryId: 'cat-1',
        phone: '0501234567',
        idType: 'national_id',
        idNumber: '1234567890',
      };

      service.createCustomer(newCustomer).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.id).toBeDefined();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCustomer);
      req.flush({ success: true, data: { id: 'new-id', ...newCustomer } });
    });
  });

  describe('updateCustomer', () => {
    it('should update existing customer', () => {
      const updateData = {
        name: 'اسم محدث',
        phone: '0507654321',
      };

      service.updateCustomer('1', updateData).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush({ success: true, data: { id: '1', ...updateData } });
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer (soft delete)', () => {
      service.deleteCustomer('1').subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('getStatistics', () => {
    it('should fetch customer statistics', () => {
      const mockStats = {
        total: 100,
        active: 80,
        suspended: 15,
        disconnected: 5,
      };

      service.getStatistics().subscribe((response) => {
        expect(response.data.total).toBe(100);
        expect(response.data.active).toBe(80);
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStats });
    });
  });

  describe('getCustomerBalance', () => {
    it('should fetch customer balance', () => {
      const mockBalance = {
        totalInvoiced: 5000,
        totalPaid: 3000,
        balance: 2000,
      };

      service.getCustomerBalance('1').subscribe((response) => {
        expect(response.data.balance).toBe(2000);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/balance`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockBalance });
    });
  });

  describe('getCustomerInvoices', () => {
    it('should fetch customer invoices', () => {
      service.getCustomerInvoices('1').subscribe((response) => {
        expect(response.data).toBeDefined();
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/1/invoices`));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  describe('getCustomerPayments', () => {
    it('should fetch customer payments', () => {
      service.getCustomerPayments('1').subscribe((response) => {
        expect(response.data).toBeDefined();
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/1/payments`));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  describe('getCustomerMeters', () => {
    it('should fetch customer meters', () => {
      service.getCustomerMeters('1').subscribe((response) => {
        expect(response.data).toBeDefined();
      });

      const req = httpMock.expectOne((r) => r.url.includes(`${apiUrl}/1/meters`));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', () => {
      service.getCustomer('non-existent').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/non-existent`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 error', () => {
      service.getCustomers({}).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes(apiUrl));
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle validation error', () => {
      service.createCustomer({} as any).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
