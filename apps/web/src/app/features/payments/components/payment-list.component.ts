import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from '../services/payments.service';
import { Payment } from '../../../core/models';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">إدارة المدفوعات</h1>
        <a routerLink="/payments/new" 
           class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>تسجيل دفعة</span>
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">طريقة الدفع</label>
            <select [(ngModel)]="paymentMethod" (change)="loadPayments()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option value="cash">نقدي</option>
              <option value="bank">تحويل بنكي</option>
              <option value="card">بطاقة</option>
              <option value="online">إلكتروني</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">من تاريخ</label>
            <input type="date" [(ngModel)]="fromDate" (change)="loadPayments()"
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">إلى تاريخ</label>
            <input type="date" [(ngModel)]="toDate" (change)="loadPayments()"
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div class="flex items-end">
            <button (click)="resetFilters()" 
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalAmount) }}</p>
            <p class="text-gray-600 text-sm">إجمالي المدفوعات</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">{{ totalCount }}</p>
            <p class="text-gray-600 text-sm">عدد العمليات</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-yellow-600">{{ formatCurrency(cashAmount) }}</p>
            <p class="text-gray-600 text-sm">نقدي</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(bankAmount) }}</p>
            <p class="text-gray-600 text-sm">تحويل بنكي</p>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الإيصال</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">العميل</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الفاتورة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">المبلغ</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">طريقة الدفع</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let payment of payments" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-blue-600">{{ payment.paymentNo }}</td>
              <td class="px-4 py-3 text-sm text-gray-800">
                <a [routerLink]="['/customers', payment.customerId]" class="hover:underline">
                  {{ payment.customer?.name }}
                </a>
              </td>
              <td class="px-4 py-3 text-sm">
                <a *ngIf="payment.invoiceId" [routerLink]="['/invoices', payment.invoiceId]" class="text-blue-600 hover:underline">
                  {{ payment.invoice?.invoiceNo }}
                </a>
                <span *ngIf="!payment.invoiceId" class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ payment.paymentDate | date:'yyyy-MM-dd' }}</td>
              <td class="px-4 py-3 text-sm font-medium text-green-600">{{ formatCurrency(payment.amount) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ getPaymentMethodLabel(payment.paymentMethod) }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="payment.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ payment.status === 'confirmed' ? 'مؤكد' : 'ملغى' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button (click)="printReceipt(payment)" 
                          class="p-1 text-gray-600 hover:bg-gray-50 rounded" title="طباعة">
                    <i class="pi pi-print"></i>
                  </button>
                  <button *ngIf="payment.status === 'confirmed'" (click)="cancelPayment(payment)"
                          class="p-1 text-red-600 hover:bg-red-50 rounded" title="إلغاء">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="payments.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p>لا توجد مدفوعات</p>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            عرض {{ (page - 1) * limit + 1 }} - {{ Math.min(page * limit, total) }} من {{ total }}
          </div>
          <div class="flex items-center gap-2">
            <button (click)="prevPage()" [disabled]="page === 1"
                    class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="pi pi-chevron-right"></i>
            </button>
            <span class="px-3 py-1">{{ page }} / {{ totalPages }}</span>
            <button (click)="nextPage()" [disabled]="page >= totalPages"
                    class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="pi pi-chevron-left"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentListComponent implements OnInit {
  private paymentsService = inject(PaymentsService);
  
  payments: Payment[] = [];
  
  paymentMethod = '';
  fromDate = '';
  toDate = '';
  
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  
  totalAmount = 0;
  totalCount = 0;
  cashAmount = 0;
  bankAmount = 0;
  
  Math = Math;

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.paymentsService.getPayments({
      page: this.page,
      limit: this.limit,
      paymentMethod: this.paymentMethod || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
    }).subscribe({
      next: (response) => {
        this.payments = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        
        // Calculate totals
        this.totalAmount = this.payments.reduce((sum, p) => sum + (p.status === 'confirmed' ? p.amount : 0), 0);
        this.totalCount = this.payments.filter(p => p.status === 'confirmed').length;
        this.cashAmount = this.payments.filter(p => p.paymentMethod === 'cash' && p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
        this.bankAmount = this.payments.filter(p => p.paymentMethod === 'bank' && p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
      }
    });
  }

  resetFilters() {
    this.paymentMethod = '';
    this.fromDate = '';
    this.toDate = '';
    this.page = 1;
    this.loadPayments();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadPayments();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadPayments();
    }
  }

  printReceipt(payment: Payment) {
    window.print();
  }

  cancelPayment(payment: Payment) {
    const reason = prompt('سبب الإلغاء:');
    if (!reason) return;

    this.paymentsService.cancelPayment(payment.id, reason).subscribe({
      next: () => {
        this.loadPayments();
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

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'نقدي',
      bank: 'تحويل بنكي',
      card: 'بطاقة',
      online: 'إلكتروني',
    };
    return labels[method] || method;
  }
}
