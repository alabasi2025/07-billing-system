import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentsService } from '../services/payments.service';
import { CustomersService } from '../../customers/services/customers.service';
import { InvoicesService } from '../../invoices/services/invoices.service';
import { Customer, Invoice } from '../../../core/models';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/payments" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">تسجيل دفعة جديدة</h1>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Customer Selection -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">معلومات العميل</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم حساب العميل <span class="text-red-500">*</span></label>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="accountNo" [ngModelOptions]="{standalone: true}"
                       placeholder="أدخل رقم الحساب"
                       class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <button type="button" (click)="searchCustomer()"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  بحث
                </button>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <div *ngIf="selectedCustomer" class="mt-4 p-4 bg-blue-50 rounded-lg">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-gray-500">اسم العميل</p>
                <p class="font-medium">{{ selectedCustomer.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">رقم الحساب</p>
                <p class="font-medium">{{ selectedCustomer.accountNo }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">الرصيد المستحق</p>
                <p class="font-medium text-red-600">{{ formatCurrency(customerBalance) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">المتأخرات</p>
                <p class="font-medium text-red-600">{{ formatCurrency(overdueAmount) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoice Selection -->
        <div class="bg-white rounded-lg shadow p-6" *ngIf="selectedCustomer && unpaidInvoices.length > 0">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">الفواتير غير المسددة</h2>
          <div class="space-y-2">
            <div *ngFor="let invoice of unpaidInvoices" 
                 class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                 [class.border-blue-500]="form.get('invoiceId')?.value === invoice.id"
                 [class.bg-blue-50]="form.get('invoiceId')?.value === invoice.id"
                 (click)="selectInvoice(invoice)">
              <div>
                <p class="font-medium">{{ invoice.invoiceNo }}</p>
                <p class="text-sm text-gray-500">{{ invoice.billingPeriod }}</p>
              </div>
              <div class="text-left">
                <p class="font-medium text-red-600">{{ formatCurrency(invoice.balance) }}</p>
                <p class="text-sm text-gray-500">{{ invoice.dueDate | date:'yyyy-MM-dd' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="bg-white rounded-lg shadow p-6" *ngIf="selectedCustomer">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">معلومات الدفعة</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">المبلغ <span class="text-red-500">*</span></label>
              <input type="number" formControlName="amount" step="0.01"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [class.border-red-500]="form.get('amount')?.invalid && form.get('amount')?.touched">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">تاريخ الدفع <span class="text-red-500">*</span></label>
              <input type="date" formControlName="paymentDate"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">طريقة الدفع <span class="text-red-500">*</span></label>
              <select formControlName="paymentMethod"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="cash">نقدي</option>
                <option value="bank">تحويل بنكي</option>
                <option value="card">بطاقة</option>
                <option value="online">إلكتروني</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم المرجع</label>
              <input type="text" formControlName="referenceNo"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-lg shadow p-6" *ngIf="selectedCustomer">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">ملاحظات</h2>
          <div>
            <textarea formControlName="notes" rows="3"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-4" *ngIf="selectedCustomer">
          <a routerLink="/payments" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            إلغاء
          </a>
          <button type="submit" [disabled]="form.invalid || loading"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            {{ loading ? 'جاري الحفظ...' : 'تسجيل الدفعة' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class PaymentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paymentsService = inject(PaymentsService);
  private customersService = inject(CustomersService);
  private invoicesService = inject(InvoicesService);

  form: FormGroup;
  accountNo = '';
  selectedCustomer: Customer | null = null;
  unpaidInvoices: Invoice[] = [];
  customerBalance = 0;
  overdueAmount = 0;
  loading = false;

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    
    this.form = this.fb.group({
      customerId: ['', Validators.required],
      invoiceId: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentDate: [today, Validators.required],
      paymentMethod: ['cash', Validators.required],
      referenceNo: [''],
      notes: [''],
    });
  }

  ngOnInit() {
    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');
    if (invoiceId) {
      this.loadInvoiceAndCustomer(invoiceId);
    }
  }

  loadInvoiceAndCustomer(invoiceId: string) {
    this.invoicesService.getInvoiceById(invoiceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const invoice = response.data;
          this.form.patchValue({ 
            invoiceId: invoice.id,
            amount: invoice.balance 
          });
          
          if (invoice.customer) {
            this.selectedCustomer = invoice.customer;
            this.accountNo = invoice.customer.accountNo;
            this.form.patchValue({ customerId: invoice.customerId });
            this.loadCustomerData(invoice.customerId);
          }
        }
      }
    });
  }

  searchCustomer() {
    if (!this.accountNo.trim()) return;
    
    this.customersService.getCustomerByAccountNo(this.accountNo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedCustomer = response.data;
          this.form.patchValue({ customerId: response.data.id });
          this.loadCustomerData(response.data.id);
        }
      },
      error: () => {
        alert('العميل غير موجود');
      }
    });
  }

  loadCustomerData(customerId: string) {
    // Load balance
    this.customersService.getCustomerBalance(customerId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerBalance = response.data.balance;
          this.overdueAmount = response.data.overdueAmount;
        }
      }
    });

    // Load unpaid invoices
    this.invoicesService.getCustomerUnpaidInvoices(customerId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unpaidInvoices = response.data;
        }
      }
    });
  }

  selectInvoice(invoice: Invoice) {
    this.form.patchValue({ 
      invoiceId: invoice.id,
      amount: invoice.balance 
    });
  }

  onSubmit() {
    if (this.form.invalid || !this.selectedCustomer) return;

    this.loading = true;
    const data = this.form.value;

    this.paymentsService.createPayment(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/payments']);
        }
      },
      error: (err) => {
        console.error('Error saving payment:', err);
        alert('حدث خطأ أثناء تسجيل الدفعة');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(value);
  }
}
