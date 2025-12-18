import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { InvoiceListComponent } from './invoice-list.component';
import { InvoicesService } from '../services/invoices.service';

describe('InvoiceListComponent', () => {
  let component: InvoiceListComponent;
  let fixture: ComponentFixture<InvoiceListComponent>;
  let invoicesServiceSpy: jasmine.SpyObj<InvoicesService>;

  const mockInvoices = [
    {
      id: '1',
      invoiceNo: 'INV-2024-001',
      customer: { name: 'أحمد محمد', accountNo: 'ACC-001' },
      billingPeriod: '2024-01',
      totalAmount: 500,
      paidAmount: 500,
      balance: 0,
      status: 'paid',
      issuedAt: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
    },
    {
      id: '2',
      invoiceNo: 'INV-2024-002',
      customer: { name: 'سارة علي', accountNo: 'ACC-002' },
      billingPeriod: '2024-01',
      totalAmount: 750,
      paidAmount: 200,
      balance: 550,
      status: 'partial',
      issuedAt: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
    },
    {
      id: '3',
      invoiceNo: 'INV-2024-003',
      customer: { name: 'محمد خالد', accountNo: 'ACC-003' },
      billingPeriod: '2024-01',
      totalAmount: 1200,
      paidAmount: 0,
      balance: 1200,
      status: 'overdue',
      issuedAt: new Date('2024-01-01'),
      dueDate: new Date('2024-01-31'),
    },
  ];

  const mockStatistics = {
    total: 150,
    issued: 50,
    paid: 80,
    partial: 10,
    overdue: 10,
    totalAmount: 75000,
    paidAmount: 50000,
    outstandingAmount: 25000,
  };

  beforeEach(async () => {
    invoicesServiceSpy = jasmine.createSpyObj('InvoicesService', [
      'getInvoices',
      'getStatistics',
      'cancelInvoice',
      'printInvoice',
    ]);

    invoicesServiceSpy.getInvoices.and.returnValue(of({ 
      data: mockInvoices,
      meta: { total: 3, page: 1, limit: 10 }
    }));
    invoicesServiceSpy.getStatistics.and.returnValue(of({ data: mockStatistics }));
    invoicesServiceSpy.cancelInvoice.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [
        InvoiceListComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        FormsModule,
      ],
      providers: [
        { provide: InvoicesService, useValue: invoicesServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load invoices on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(invoicesServiceSpy.getInvoices).toHaveBeenCalled();
      expect(component.invoices.length).toBe(3);
    }));

    it('should load statistics on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(invoicesServiceSpy.getStatistics).toHaveBeenCalled();
    }));
  });

  describe('Invoice Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display invoice numbers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('INV-2024-001');
      expect(compiled.textContent).toContain('INV-2024-002');
    });

    it('should display customer names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('أحمد محمد');
      expect(compiled.textContent).toContain('سارة علي');
    });

    it('should display billing periods', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('2024-01');
    });
  });

  describe('Status Display', () => {
    it('should return correct class for paid status', () => {
      const statusClass = component.getStatusClass('paid');
      expect(statusClass).toContain('green');
    });

    it('should return correct class for partial status', () => {
      const statusClass = component.getStatusClass('partial');
      expect(statusClass).toContain('yellow');
    });

    it('should return correct class for overdue status', () => {
      const statusClass = component.getStatusClass('overdue');
      expect(statusClass).toContain('red');
    });

    it('should return correct class for issued status', () => {
      const statusClass = component.getStatusClass('issued');
      expect(statusClass).toContain('blue');
    });

    it('should return correct label for paid status', () => {
      const label = component.getStatusLabel('paid');
      expect(label).toBe('مدفوعة');
    });

    it('should return correct label for partial status', () => {
      const label = component.getStatusLabel('partial');
      expect(label).toBe('مدفوعة جزئياً');
    });

    it('should return correct label for overdue status', () => {
      const label = component.getStatusLabel('overdue');
      expect(label).toBe('متأخرة');
    });
  });

  describe('Search and Filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter by search term', fakeAsync(() => {
      component.searchTerm = 'INV-2024-001';
      component.onSearch();
      tick();

      expect(invoicesServiceSpy.getInvoices).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'INV-2024-001' })
      );
    }));

    it('should filter by status', fakeAsync(() => {
      component.filterStatus = 'paid';
      component.onFilterChange();
      tick();

      expect(invoicesServiceSpy.getInvoices).toHaveBeenCalledWith(
        jasmine.objectContaining({ status: 'paid' })
      );
    }));

    it('should filter by billing period', fakeAsync(() => {
      component.filterPeriod = '2024-01';
      component.onFilterChange();
      tick();

      expect(invoicesServiceSpy.getInvoices).toHaveBeenCalledWith(
        jasmine.objectContaining({ billingPeriod: '2024-01' })
      );
    }));

    it('should filter by date range', fakeAsync(() => {
      component.fromDate = '2024-01-01';
      component.toDate = '2024-01-31';
      component.onFilterChange();
      tick();

      expect(invoicesServiceSpy.getInvoices).toHaveBeenCalledWith(
        jasmine.objectContaining({ 
          fromDate: '2024-01-01',
          toDate: '2024-01-31'
        })
      );
    }));
  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should change page', fakeAsync(() => {
      component.onPageChange(2);
      tick();

      expect(component.currentPage).toBe(2);
    }));

    it('should change page size', fakeAsync(() => {
      component.onPageSizeChange(25);
      tick();

      expect(component.pageSize).toBe(25);
    }));
  });

  describe('Cancel Invoice', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call cancel service', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.cancelInvoice('1');
      tick();

      expect(invoicesServiceSpy.cancelInvoice).toHaveBeenCalledWith('1');
    }));

    it('should not cancel if not confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.cancelInvoice('1');
      tick();

      expect(invoicesServiceSpy.cancelInvoice).not.toHaveBeenCalled();
    }));
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly', () => {
      const formatted = component.formatCurrency(1000);
      expect(formatted).toBeDefined();
    });

    it('should handle zero amount', () => {
      const formatted = component.formatCurrency(0);
      expect(formatted).toBeDefined();
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = component.formatDate(date);
      expect(formatted).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', fakeAsync(() => {
      invoicesServiceSpy.getInvoices.and.returnValue(throwError(() => new Error('Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.invoices.length).toBe(0);
    }));
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have link to generate invoice', () => {
      const compiled = fixture.nativeElement;
      const link = compiled.querySelector('a[routerLink="/invoices/generate"]');
      expect(link).toBeTruthy();
    });
  });

  describe('Statistics Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display total invoices', () => {
      expect(component.statistics?.total).toBe(150);
    });

    it('should display outstanding amount', () => {
      expect(component.statistics?.outstandingAmount).toBe(25000);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no invoices', fakeAsync(() => {
      invoicesServiceSpy.getInvoices.and.returnValue(of({ 
        data: [],
        meta: { total: 0, page: 1, limit: 10 }
      }));
      
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد فواتير');
    }));
  });
});
