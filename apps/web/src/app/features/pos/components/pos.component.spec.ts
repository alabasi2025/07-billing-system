import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { PosComponent } from './pos.component';
import { PosService } from '../services/pos.service';

describe('PosComponent', () => {
  let component: PosComponent;
  let fixture: ComponentFixture<PosComponent>;
  let posService: jasmine.SpyObj<PosService>;

  const mockCustomer = {
    id: '1',
    name: 'عميل 1',
    accountNo: 'ACC-001',
    balance: 1500,
    unpaidInvoices: [
      { id: 'inv-1', invoiceNo: 'INV-001', amount: 500, dueDate: '2024-02-01' },
      { id: 'inv-2', invoiceNo: 'INV-002', amount: 1000, dueDate: '2024-02-15' },
    ],
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('PosService', [
      'searchCustomer',
      'getCustomerBalance',
      'getCustomerInvoices',
      'processPayment',
      'printReceipt',
      'getCurrentSession',
    ]);
    spy.getCurrentSession.and.returnValue(of({ id: 'session-1', status: 'open' }));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [PosComponent],
      providers: [{ provide: PosService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PosComponent);
    component = fixture.componentInstance;
    posService = TestBed.inject(PosService) as jasmine.SpyObj<PosService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should check for active session on init', () => {
      fixture.detectChanges();
      expect(posService.getCurrentSession).toHaveBeenCalled();
    });

    it('should set session status', () => {
      fixture.detectChanges();
      expect(component.hasActiveSession).toBeTrue();
    });
  });

  describe('Customer Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should search customer by account number', () => {
      posService.searchCustomer.and.returnValue(of(mockCustomer));

      component.searchCustomer('ACC-001');

      expect(posService.searchCustomer).toHaveBeenCalledWith({ accountNo: 'ACC-001' });
      expect(component.selectedCustomer).toEqual(mockCustomer);
    });

    it('should search customer by meter number', () => {
      posService.searchCustomer.and.returnValue(of(mockCustomer));

      component.searchByMeter('MTR-001');

      expect(posService.searchCustomer).toHaveBeenCalledWith({ meterNo: 'MTR-001' });
    });

    it('should show error when customer not found', () => {
      posService.searchCustomer.and.returnValue(throwError(() => new Error('Not found')));

      component.searchCustomer('INVALID');

      expect(component.error).toContain('لم يتم العثور على العميل');
    });

    it('should clear previous customer on new search', () => {
      component.selectedCustomer = mockCustomer;
      posService.searchCustomer.and.returnValue(of(mockCustomer));

      component.searchCustomer('ACC-002');

      expect(component.selectedInvoices).toEqual([]);
    });
  });

  describe('Invoice Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedCustomer = mockCustomer;
    });

    it('should select invoice', () => {
      component.selectInvoice(mockCustomer.unpaidInvoices[0]);

      expect(component.selectedInvoices.length).toBe(1);
      expect(component.totalAmount).toBe(500);
    });

    it('should select multiple invoices', () => {
      component.selectInvoice(mockCustomer.unpaidInvoices[0]);
      component.selectInvoice(mockCustomer.unpaidInvoices[1]);

      expect(component.selectedInvoices.length).toBe(2);
      expect(component.totalAmount).toBe(1500);
    });

    it('should deselect invoice', () => {
      component.selectInvoice(mockCustomer.unpaidInvoices[0]);
      component.deselectInvoice(mockCustomer.unpaidInvoices[0]);

      expect(component.selectedInvoices.length).toBe(0);
      expect(component.totalAmount).toBe(0);
    });

    it('should select all invoices', () => {
      component.selectAllInvoices();

      expect(component.selectedInvoices.length).toBe(2);
      expect(component.totalAmount).toBe(1500);
    });

    it('should clear all selections', () => {
      component.selectAllInvoices();
      component.clearSelections();

      expect(component.selectedInvoices.length).toBe(0);
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedCustomer = mockCustomer;
      component.selectInvoice(mockCustomer.unpaidInvoices[0]);
    });

    it('should process cash payment', () => {
      const mockResult = { success: true, receiptNo: 'RCP-001', change: 500 };
      posService.processPayment.and.returnValue(of(mockResult));

      component.processPayment('cash', 1000);

      expect(posService.processPayment).toHaveBeenCalledWith(jasmine.objectContaining({
        customerId: '1',
        amount: 500,
        paymentMethod: 'cash',
        receivedAmount: 1000,
      }));
    });

    it('should calculate change for cash payment', () => {
      const mockResult = { success: true, receiptNo: 'RCP-001', change: 500 };
      posService.processPayment.and.returnValue(of(mockResult));

      component.processPayment('cash', 1000);

      expect(component.change).toBe(500);
    });

    it('should process card payment', () => {
      const mockResult = { success: true, receiptNo: 'RCP-001' };
      posService.processPayment.and.returnValue(of(mockResult));

      component.processPayment('card', 500);

      expect(posService.processPayment).toHaveBeenCalledWith(jasmine.objectContaining({
        paymentMethod: 'card',
      }));
    });

    it('should show success message after payment', () => {
      const mockResult = { success: true, receiptNo: 'RCP-001' };
      posService.processPayment.and.returnValue(of(mockResult));

      component.processPayment('cash', 500);

      expect(component.paymentSuccess).toBeTrue();
      expect(component.receiptNo).toBe('RCP-001');
    });

    it('should handle payment error', () => {
      posService.processPayment.and.returnValue(throwError(() => new Error('Payment failed')));

      component.processPayment('cash', 500);

      expect(component.error).toBeTruthy();
    });

    it('should clear form after successful payment', () => {
      const mockResult = { success: true, receiptNo: 'RCP-001' };
      posService.processPayment.and.returnValue(of(mockResult));

      component.processPayment('cash', 500);

      expect(component.selectedInvoices.length).toBe(0);
    });
  });

  describe('Receipt Printing', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should print receipt', () => {
      const mockReceipt = { receiptNo: 'RCP-001', amount: 500 };
      posService.printReceipt.and.returnValue(of(mockReceipt));

      component.printReceipt('pay-1');

      expect(posService.printReceipt).toHaveBeenCalledWith('pay-1');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not allow payment without customer', () => {
      component.selectedCustomer = null;

      expect(component.canProcessPayment()).toBeFalse();
    });

    it('should not allow payment without selected invoices', () => {
      component.selectedCustomer = mockCustomer;
      component.selectedInvoices = [];

      expect(component.canProcessPayment()).toBeFalse();
    });

    it('should not allow payment without active session', () => {
      component.hasActiveSession = false;
      component.selectedCustomer = mockCustomer;
      component.selectInvoice(mockCustomer.unpaidInvoices[0]);

      expect(component.canProcessPayment()).toBeFalse();
    });

    it('should allow payment with valid data', () => {
      component.hasActiveSession = true;
      component.selectedCustomer = mockCustomer;
      component.selectInvoice(mockCustomer.unpaidInvoices[0]);

      expect(component.canProcessPayment()).toBeTrue();
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedCustomer = mockCustomer;
    });

    it('should set exact amount', () => {
      component.selectInvoice(mockCustomer.unpaidInvoices[0]);
      component.setExactAmount();

      expect(component.receivedAmount).toBe(500);
    });

    it('should round up to nearest 10', () => {
      component.totalAmount = 523;
      component.roundUp(10);

      expect(component.receivedAmount).toBe(530);
    });

    it('should round up to nearest 50', () => {
      component.totalAmount = 523;
      component.roundUp(50);

      expect(component.receivedAmount).toBe(550);
    });

    it('should round up to nearest 100', () => {
      component.totalAmount = 523;
      component.roundUp(100);

      expect(component.receivedAmount).toBe(600);
    });
  });
});
