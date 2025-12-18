import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { ReportsService } from '../reports/services/reports.service';
import { InvoicesService } from '../invoices/services/invoices.service';
import { PaymentsService } from '../payments/services/payments.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let reportsServiceSpy: jasmine.SpyObj<ReportsService>;
  let invoicesServiceSpy: jasmine.SpyObj<InvoicesService>;
  let paymentsServiceSpy: jasmine.SpyObj<PaymentsService>;

  const mockStats = {
    totalCustomers: 150,
    activeCustomers: 120,
    totalMeters: 200,
    activeMeters: 180,
    pendingInvoices: 45,
    overdueInvoices: 10,
    totalRevenue: 50000,
    totalCollected: 35000,
    openComplaints: 5,
  };

  const mockInvoices = [
    {
      id: '1',
      invoiceNo: 'INV-001',
      customer: { name: 'عميل 1' },
      totalAmount: 500,
      status: 'issued',
    },
    {
      id: '2',
      invoiceNo: 'INV-002',
      customer: { name: 'عميل 2' },
      totalAmount: 750,
      status: 'paid',
    },
  ];

  const mockPayments = [
    {
      id: '1',
      paymentNo: 'PAY-001',
      amount: 500,
      paymentMethod: 'cash',
      paymentDate: new Date(),
    },
    {
      id: '2',
      paymentNo: 'PAY-002',
      amount: 300,
      paymentMethod: 'bank',
      paymentDate: new Date(),
    },
  ];

  beforeEach(async () => {
    reportsServiceSpy = jasmine.createSpyObj('ReportsService', ['getDashboardStats']);
    invoicesServiceSpy = jasmine.createSpyObj('InvoicesService', ['getInvoices']);
    paymentsServiceSpy = jasmine.createSpyObj('PaymentsService', ['getPayments']);

    reportsServiceSpy.getDashboardStats.and.returnValue(of({ data: mockStats }));
    invoicesServiceSpy.getInvoices.and.returnValue(of({ data: mockInvoices }));
    paymentsServiceSpy.getPayments.and.returnValue(of({ data: mockPayments }));

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: InvoicesService, useValue: invoicesServiceSpy },
        { provide: PaymentsService, useValue: paymentsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load dashboard stats on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(reportsServiceSpy.getDashboardStats).toHaveBeenCalled();
      expect(component.stats).toEqual(mockStats);
    }));

    it('should load recent invoices on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(invoicesServiceSpy.getInvoices).toHaveBeenCalled();
      expect(component.recentInvoices.length).toBe(2);
    }));

    it('should load recent payments on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(paymentsServiceSpy.getPayments).toHaveBeenCalled();
      expect(component.recentPayments.length).toBe(2);
    }));
  });

  describe('Stats Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display total customers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('150');
    });

    it('should display active customers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('120');
    });

    it('should display total meters', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('200');
    });

    it('should display pending invoices', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('45');
    });

    it('should display overdue invoices', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('10');
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly', () => {
      const formatted = component.formatCurrency(1000);
      expect(formatted).toContain('1');
    });

    it('should handle zero amount', () => {
      const formatted = component.formatCurrency(0);
      expect(formatted).toBeDefined();
    });

    it('should handle null amount', () => {
      const formatted = component.formatCurrency(null as any);
      expect(formatted).toBeDefined();
    });
  });

  describe('Invoice Status', () => {
    it('should return correct class for issued status', () => {
      const statusClass = component.getInvoiceStatusClass('issued');
      expect(statusClass).toContain('yellow');
    });

    it('should return correct class for paid status', () => {
      const statusClass = component.getInvoiceStatusClass('paid');
      expect(statusClass).toContain('green');
    });

    it('should return correct class for overdue status', () => {
      const statusClass = component.getInvoiceStatusClass('overdue');
      expect(statusClass).toContain('red');
    });

    it('should return correct label for issued status', () => {
      const label = component.getInvoiceStatusLabel('issued');
      expect(label).toBe('صادرة');
    });

    it('should return correct label for paid status', () => {
      const label = component.getInvoiceStatusLabel('paid');
      expect(label).toBe('مدفوعة');
    });
  });

  describe('Payment Method Labels', () => {
    it('should return correct label for cash', () => {
      const label = component.getPaymentMethodLabel('cash');
      expect(label).toBe('نقدي');
    });

    it('should return correct label for bank', () => {
      const label = component.getPaymentMethodLabel('bank');
      expect(label).toBe('تحويل بنكي');
    });

    it('should return correct label for card', () => {
      const label = component.getPaymentMethodLabel('card');
      expect(label).toBe('بطاقة');
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
    it('should handle stats loading error', fakeAsync(() => {
      reportsServiceSpy.getDashboardStats.and.returnValue(throwError(() => new Error('Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.stats).toBeUndefined();
    }));

    it('should handle invoices loading error', fakeAsync(() => {
      invoicesServiceSpy.getInvoices.and.returnValue(throwError(() => new Error('Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.recentInvoices.length).toBe(0);
    }));

    it('should handle payments loading error', fakeAsync(() => {
      paymentsServiceSpy.getPayments.and.returnValue(throwError(() => new Error('Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.recentPayments.length).toBe(0);
    }));
  });

  describe('Loading States', () => {
    it('should show loading state for invoices', () => {
      component.loadingInvoices = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.loading-state')).toBeTruthy();
    });

    it('should show loading state for payments', () => {
      component.loadingPayments = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.loading-state')).toBeTruthy();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no invoices', fakeAsync(() => {
      invoicesServiceSpy.getInvoices.and.returnValue(of({ data: [] }));
      
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد فواتير حديثة');
    }));

    it('should show empty state when no payments', fakeAsync(() => {
      paymentsServiceSpy.getPayments.and.returnValue(of({ data: [] }));
      
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد مدفوعات حديثة');
    }));
  });

  describe('Quick Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have link to add customer', () => {
      const compiled = fixture.nativeElement;
      const link = compiled.querySelector('a[routerLink="/customers/new"]');
      expect(link).toBeTruthy();
    });

    it('should have link to add reading', () => {
      const compiled = fixture.nativeElement;
      const link = compiled.querySelector('a[routerLink="/readings/new"]');
      expect(link).toBeTruthy();
    });

    it('should have link to generate invoice', () => {
      const compiled = fixture.nativeElement;
      const link = compiled.querySelector('a[routerLink="/invoices/generate"]');
      expect(link).toBeTruthy();
    });

    it('should have link to add payment', () => {
      const compiled = fixture.nativeElement;
      const link = compiled.querySelector('a[routerLink="/payments/new"]');
      expect(link).toBeTruthy();
    });
  });

  describe('Alerts', () => {
    it('should show overdue invoices alert', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('فاتورة متأخرة');
    }));

    it('should show open complaints alert', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('شكوى مفتوحة');
    }));
  });
});
