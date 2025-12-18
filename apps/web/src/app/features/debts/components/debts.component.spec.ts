import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { DebtsComponent } from './debts.component';
import { DebtsService } from '../services/debts.service';

describe('DebtsComponent', () => {
  let component: DebtsComponent;
  let fixture: ComponentFixture<DebtsComponent>;
  let debtsService: jasmine.SpyObj<DebtsService>;

  const mockDebts = [
    { id: '1', customerId: 'cust-1', customerName: 'عميل 1', totalDebt: 5000, daysOverdue: 45, status: 'overdue' },
    { id: '2', customerId: 'cust-2', customerName: 'عميل 2', totalDebt: 3000, daysOverdue: 30, status: 'overdue' },
    { id: '3', customerId: 'cust-3', customerName: 'عميل 3', totalDebt: 1000, daysOverdue: 15, status: 'pending' },
  ];

  const mockStatistics = {
    totalDebt: 50000,
    totalCustomers: 25,
    overdueDebt: 35000,
    pendingDebt: 15000,
    agingBuckets: [
      { range: '0-30', amount: 15000, count: 10 },
      { range: '31-60', amount: 20000, count: 8 },
      { range: '61-90', amount: 10000, count: 5 },
      { range: '90+', amount: 5000, count: 2 },
    ],
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DebtsService', [
      'getDebts',
      'getDebt',
      'getStatistics',
      'createPaymentPlan',
      'sendReminder',
      'markAsDisputed',
      'writeOff',
    ]);
    spy.getDebts.and.returnValue(of({ data: mockDebts, meta: { total: 3, page: 1, limit: 10 } }));
    spy.getStatistics.and.returnValue(of(mockStatistics));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [DebtsComponent],
      providers: [{ provide: DebtsService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(DebtsComponent);
    component = fixture.componentInstance;
    debtsService = TestBed.inject(DebtsService) as jasmine.SpyObj<DebtsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load debts on init', () => {
      fixture.detectChanges();
      expect(debtsService.getDebts).toHaveBeenCalled();
      expect(component.debts.length).toBe(3);
    });

    it('should load statistics on init', () => {
      fixture.detectChanges();
      expect(debtsService.getStatistics).toHaveBeenCalled();
      expect(component.statistics.totalDebt).toBe(50000);
    });

    it('should set loading to false after data loads', () => {
      fixture.detectChanges();
      expect(component.loading).toBeFalse();
    });
  });

  describe('Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display customer names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('عميل 1');
      expect(compiled.textContent).toContain('عميل 2');
    });

    it('should display debt amounts', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('5000');
      expect(compiled.textContent).toContain('3000');
    });

    it('should display days overdue', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('45');
    });

    it('should display statistics summary', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('50000');
      expect(compiled.textContent).toContain('25');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by status', () => {
      component.filterByStatus('overdue');
      expect(debtsService.getDebts).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'overdue' }));
    });

    it('should filter by aging bucket', () => {
      component.filterByAgingBucket('31-60');
      expect(debtsService.getDebts).toHaveBeenCalledWith(jasmine.objectContaining({ agingBucket: '31-60' }));
    });

    it('should filter by minimum amount', () => {
      component.filterByMinAmount(1000);
      expect(debtsService.getDebts).toHaveBeenCalledWith(jasmine.objectContaining({ minAmount: 1000 }));
    });

    it('should search by customer name', () => {
      component.search('عميل 1');
      expect(debtsService.getDebts).toHaveBeenCalledWith(jasmine.objectContaining({ search: 'عميل 1' }));
    });

    it('should clear filters', () => {
      component.filterByStatus('overdue');
      component.clearFilters();
      expect(component.filters).toEqual({});
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should sort by amount descending', () => {
      component.sortBy('totalDebt', 'desc');
      expect(debtsService.getDebts).toHaveBeenCalledWith(jasmine.objectContaining({ 
        sortBy: 'totalDebt', 
        sortOrder: 'desc' 
      }));
    });

    it('should sort by days overdue', () => {
      component.sortBy('daysOverdue', 'desc');
      expect(debtsService.getDebts).toHaveBeenCalledWith(jasmine.objectContaining({ 
        sortBy: 'daysOverdue' 
      }));
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to customer detail', () => {
      spyOn(component['router'], 'navigate');
      component.viewCustomer('cust-1');
      expect(component['router'].navigate).toHaveBeenCalledWith(['/customers', 'cust-1']);
    });

    it('should create payment plan', () => {
      const planDto = { customerId: 'cust-1', installments: 6, startDate: '2024-03-01' };
      debtsService.createPaymentPlan.and.returnValue(of({ success: true }));

      component.createPaymentPlan(planDto);

      expect(debtsService.createPaymentPlan).toHaveBeenCalledWith(planDto);
    });

    it('should send reminder', () => {
      debtsService.sendReminder.and.returnValue(of({ success: true }));

      component.sendReminder('1');

      expect(debtsService.sendReminder).toHaveBeenCalledWith('1');
    });

    it('should mark as disputed', () => {
      debtsService.markAsDisputed.and.returnValue(of({ success: true }));

      component.markAsDisputed('1', 'سبب النزاع');

      expect(debtsService.markAsDisputed).toHaveBeenCalledWith('1', 'سبب النزاع');
    });

    it('should write off debt after confirmation', () => {
      debtsService.writeOff.and.returnValue(of({ success: true }));
      spyOn(window, 'confirm').and.returnValue(true);

      component.writeOff('1', 'سبب الشطب');

      expect(debtsService.writeOff).toHaveBeenCalledWith('1', 'سبب الشطب');
    });

    it('should not write off if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.writeOff('1', 'سبب الشطب');

      expect(debtsService.writeOff).not.toHaveBeenCalled();
    });
  });

  describe('Bulk Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select debt', () => {
      component.selectDebt(mockDebts[0]);
      expect(component.selectedDebts.length).toBe(1);
    });

    it('should select all debts', () => {
      component.selectAll();
      expect(component.selectedDebts.length).toBe(3);
    });

    it('should clear selection', () => {
      component.selectAll();
      component.clearSelection();
      expect(component.selectedDebts.length).toBe(0);
    });

    it('should send bulk reminders', () => {
      debtsService.sendReminder.and.returnValue(of({ success: true }));
      component.selectAll();

      component.sendBulkReminders();

      expect(debtsService.sendReminder).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      debtsService.getDebts.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.error).toBeTruthy();
    });

    it('should handle action error', () => {
      fixture.detectChanges();
      debtsService.sendReminder.and.returnValue(throwError(() => new Error('Send failed')));

      component.sendReminder('1');

      expect(component.error).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no debts', () => {
      debtsService.getDebts.and.returnValue(of({ data: [], meta: { total: 0 } }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد ديون');
    });
  });
});
