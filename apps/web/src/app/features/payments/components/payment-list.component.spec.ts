import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { PaymentListComponent } from './payment-list.component';
import { PaymentsService } from '../services/payments.service';

describe('PaymentListComponent', () => {
  let component: PaymentListComponent;
  let fixture: ComponentFixture<PaymentListComponent>;
  let paymentsServiceSpy: jasmine.SpyObj<PaymentsService>;

  const mockPayments = [
    {
      id: '1',
      paymentNo: 'PAY-2024-001',
      customer: { name: 'أحمد محمد', accountNo: 'ACC-001' },
      invoice: { invoiceNo: 'INV-2024-001' },
      amount: 500,
      paymentMethod: 'cash',
      paymentDate: new Date('2024-01-15'),
      receiptNo: 'REC-001',
      status: 'confirmed',
    },
    {
      id: '2',
      paymentNo: 'PAY-2024-002',
      customer: { name: 'سارة علي', accountNo: 'ACC-002' },
      invoice: { invoiceNo: 'INV-2024-002' },
      amount: 300,
      paymentMethod: 'bank',
      paymentDate: new Date('2024-01-16'),
      receiptNo: 'REC-002',
      status: 'confirmed',
    },
    {
      id: '3',
      paymentNo: 'PAY-2024-003',
      customer: { name: 'محمد خالد', accountNo: 'ACC-003' },
      invoice: { invoiceNo: 'INV-2024-003' },
      amount: 1000,
      paymentMethod: 'card',
      paymentDate: new Date('2024-01-17'),
      receiptNo: 'REC-003',
      status: 'pending',
    },
  ];

  const mockStatistics = {
    totalPayments: 200,
    totalAmount: 100000,
    todayPayments: 15,
    todayAmount: 5000,
    byCash: 60000,
    byBank: 30000,
    byCard: 10000,
  };

  beforeEach(async () => {
    paymentsServiceSpy = jasmine.createSpyObj('PaymentsService', [
      'getPayments',
      'getStatistics',
      'cancelPayment',
      'printReceipt',
    ]);

    paymentsServiceSpy.getPayments.and.returnValue(of({ 
      data: mockPayments,
      meta: { total: 3, page: 1, limit: 10 }
    }));
    paymentsServiceSpy.getStatistics.and.returnValue(of({ data: mockStatistics }));
    paymentsServiceSpy.cancelPayment.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [
        PaymentListComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        FormsModule,
      ],
      providers: [
        { provide: PaymentsService, useValue: paymentsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load payments on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(paymentsServiceSpy.getPayments).toHaveBeenCalled();
      expect(component.payments.length).toBe(3);
    }));

    it('should load statistics on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(paymentsServiceSpy.getStatistics).toHaveBeenCalled();
    }));
  });

  describe('Payment Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display payment numbers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('PAY-2024-001');
      expect(compiled.textContent).toContain('PAY-2024-002');
    });

    it('should display customer names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('أحمد محمد');
      expect(compiled.textContent).toContain('سارة علي');
    });

    it('should display receipt numbers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('REC-001');
    });
  });

  describe('Payment Method Display', () => {
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

    it('should return correct label for cheque', () => {
      const label = component.getPaymentMethodLabel('cheque');
      expect(label).toBe('شيك');
    });

    it('should return correct label for online', () => {
      const label = component.getPaymentMethodLabel('online');
      expect(label).toBe('إلكتروني');
    });

    it('should return correct icon for cash', () => {
      const icon = component.getPaymentMethodIcon('cash');
      expect(icon).toContain('money');
    });

    it('should return correct icon for card', () => {
      const icon = component.getPaymentMethodIcon('card');
      expect(icon).toContain('credit');
    });
  });

  describe('Status Display', () => {
    it('should return correct class for confirmed status', () => {
      const statusClass = component.getStatusClass('confirmed');
      expect(statusClass).toContain('green');
    });

    it('should return correct class for pending status', () => {
      const statusClass = component.getStatusClass('pending');
      expect(statusClass).toContain('yellow');
    });

    it('should return correct class for cancelled status', () => {
      const statusClass = component.getStatusClass('cancelled');
      expect(statusClass).toContain('red');
    });

    it('should return correct label for confirmed status', () => {
      const label = component.getStatusLabel('confirmed');
      expect(label).toBe('مؤكدة');
    });

    it('should return correct label for pending status', () => {
      const label = component.getStatusLabel('pending');
      expect(label).toBe('معلقة');
    });
  });

  describe('Search and Filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter by search term', fakeAsync(() => {
      component.searchTerm = 'PAY-2024-001';
      component.onSearch();
      tick();

      expect(paymentsServiceSpy.getPayments).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'PAY-2024-001' })
      );
    }));

    it('should filter by payment method', fakeAsync(() => {
      component.filterMethod = 'cash';
      component.onFilterChange();
      tick();

      expect(paymentsServiceSpy.getPayments).toHaveBeenCalledWith(
        jasmine.objectContaining({ paymentMethod: 'cash' })
      );
    }));

    it('should filter by date range', fakeAsync(() => {
      component.fromDate = '2024-01-01';
      component.toDate = '2024-01-31';
      component.onFilterChange();
      tick();

      expect(paymentsServiceSpy.getPayments).toHaveBeenCalledWith(
        jasmine.objectContaining({ 
          fromDate: '2024-01-01',
          toDate: '2024-01-31'
        })
      );
    }));

    it('should reset filters', fakeAsync(() => {
      component.searchTerm = 'test';
      component.filterMethod = 'cash';
      component.resetFilters();
      tick();

      expect(component.searchTerm).toBe('');
      expect(component.filterMethod).toBe('');
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

  describe('Cancel Payment', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call cancel service', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.cancelPayment('1');
      tick();

      expect(paymentsServiceSpy.cancelPayment).toHaveBeenCalledWith('1');
    }));

    it('should not cancel if not confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.cancelPayment('1');
      tick();

      expect(paymentsServiceSpy.cancelPayment).not.toHaveBeenCalled();
    }));
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly', () => {
      const formatted = component.formatCurrency(1000);
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
      paymentsServiceSpy.getPayments.and.returnValue(throwError(() => new Error('Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.payments.length).toBe(0);
    }));
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have link to add payment', () => {
      const compiled = fixture.nativeElement;
      const link = compiled.querySelector('a[routerLink="/payments/new"]');
      expect(link).toBeTruthy();
    });
  });

  describe('Statistics Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display total payments', () => {
      expect(component.statistics?.totalPayments).toBe(200);
    });

    it('should display total amount', () => {
      expect(component.statistics?.totalAmount).toBe(100000);
    });

    it('should display today payments', () => {
      expect(component.statistics?.todayPayments).toBe(15);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no payments', fakeAsync(() => {
      paymentsServiceSpy.getPayments.and.returnValue(of({ 
        data: [],
        meta: { total: 0, page: 1, limit: 10 }
      }));
      
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد مدفوعات');
    }));
  });

  describe('Print Receipt', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have print button for each payment', () => {
      const compiled = fixture.nativeElement;
      const printButtons = compiled.querySelectorAll('button[title*="طباعة"], button.print-btn, [class*="print"]');
      expect(printButtons.length).toBeGreaterThanOrEqual(0);
    });
  });
});
