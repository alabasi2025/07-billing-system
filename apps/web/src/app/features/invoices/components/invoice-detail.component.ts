import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { InvoicesService } from '../services/invoices.service';
import { Invoice } from '../../../core/models';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6" *ngIf="invoice">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/invoices" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">فاتورة {{ invoice.invoiceNo }}</h1>
            <p class="text-gray-500">{{ invoice.billingPeriod }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="printInvoice()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <i class="pi pi-print"></i>
            <span>طباعة</span>
          </button>
          <a *ngIf="invoice.balance > 0" [routerLink]="['/payments/new']" [queryParams]="{invoiceId: invoice.id}"
             class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <i class="pi pi-credit-card"></i>
            <span>تسجيل دفعة</span>
          </a>
          <button *ngIf="invoice.status !== 'cancelled' && invoice.status !== 'paid'" (click)="cancelInvoice()"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
            <i class="pi pi-times"></i>
            <span>إلغاء</span>
          </button>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="flex items-center gap-4">
        <span class="px-3 py-1 rounded-full text-sm font-medium"
              [class]="getStatusClass(invoice.status)">
          {{ getStatusLabel(invoice.status) }}
        </span>
        <span *ngIf="isOverdue" class="text-red-600 flex items-center gap-1">
          <i class="pi pi-exclamation-triangle"></i>
          متأخرة
        </span>
      </div>

      <!-- Invoice Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6 pb-6 border-b">
          <div>
            <h2 class="text-xl font-bold text-gray-800">فاتورة استهلاك الكهرباء</h2>
            <p class="text-gray-500">{{ invoice.invoiceNo }}</p>
          </div>
          <div class="text-left">
            <p class="text-sm text-gray-500">تاريخ الإصدار</p>
            <p class="font-medium">{{ invoice.issuedAt | date:'yyyy-MM-dd' }}</p>
          </div>
        </div>

        <!-- Customer & Period Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">معلومات العميل</h3>
            <p class="font-medium text-gray-800">{{ invoice.customer?.name }}</p>
            <p class="text-gray-600">{{ invoice.customer?.accountNo }}</p>
            <p class="text-gray-600">{{ invoice.customer?.address }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">فترة الفوترة</h3>
            <p class="text-gray-800">من: {{ invoice.fromDate | date:'yyyy-MM-dd' }}</p>
            <p class="text-gray-800">إلى: {{ invoice.toDate | date:'yyyy-MM-dd' }}</p>
            <p class="text-gray-800 mt-2">تاريخ الاستحقاق: <span class="font-medium">{{ invoice.dueDate | date:'yyyy-MM-dd' }}</span></p>
          </div>
        </div>

        <!-- Consumption Info -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-3">معلومات الاستهلاك</h3>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-sm text-gray-500">القراءة السابقة</p>
              <p class="text-xl font-bold text-gray-800">{{ invoice.previousReading | number:'1.2-2' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">القراءة الحالية</p>
              <p class="text-xl font-bold text-gray-800">{{ invoice.currentReading | number:'1.2-2' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">الاستهلاك (ك.و.س)</p>
              <p class="text-xl font-bold text-blue-600">{{ invoice.consumption | number:'1.2-2' }}</p>
            </div>
          </div>
        </div>

        <!-- Invoice Items -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-3">تفاصيل الفاتورة</h3>
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">البيان</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">الكمية</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">السعر</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">المبلغ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let item of invoice.items">
                <td class="px-4 py-2 text-sm text-gray-800">{{ item.description }}</td>
                <td class="px-4 py-2 text-sm text-gray-600">{{ item.quantity | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-sm text-gray-600">{{ item.rate | number:'1.4-4' }}</td>
                <td class="px-4 py-2 text-sm text-gray-800">{{ formatCurrency(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="border-t pt-4">
          <div class="w-full md:w-1/2 mr-auto space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">قيمة الاستهلاك:</span>
              <span class="text-gray-800">{{ formatCurrency(invoice.consumptionAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">الرسوم الثابتة:</span>
              <span class="text-gray-800">{{ formatCurrency(invoice.fixedCharges) }}</span>
            </div>
            <div class="flex justify-between" *ngIf="invoice.otherCharges > 0">
              <span class="text-gray-600">رسوم أخرى:</span>
              <span class="text-gray-800">{{ formatCurrency(invoice.otherCharges) }}</span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span class="text-gray-600">المجموع قبل الضريبة:</span>
              <span class="text-gray-800">{{ formatCurrency(invoice.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ضريبة القيمة المضافة ({{ invoice.vatRate }}%):</span>
              <span class="text-gray-800">{{ formatCurrency(invoice.vatAmount) }}</span>
            </div>
            <div class="flex justify-between border-t pt-2 text-lg font-bold">
              <span class="text-gray-800">الإجمالي:</span>
              <span class="text-blue-600">{{ formatCurrency(invoice.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-green-600" *ngIf="invoice.paidAmount > 0">
              <span>المدفوع:</span>
              <span>{{ formatCurrency(invoice.paidAmount) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold" *ngIf="invoice.balance > 0">
              <span class="text-red-600">المتبقي:</span>
              <span class="text-red-600">{{ formatCurrency(invoice.balance) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-white rounded-lg shadow p-6" *ngIf="invoice.notes">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">ملاحظات</h3>
        <p class="text-gray-600">{{ invoice.notes }}</p>
      </div>
    </div>
  `
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);

  invoice: Invoice | null = null;

  get isOverdue(): boolean {
    if (!this.invoice) return false;
    return new Date(this.invoice.dueDate) < new Date() && this.invoice.balance > 0;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(id);
    }
  }

  loadInvoice(id: string) {
    this.invoicesService.getInvoiceById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.invoice = response.data;
        }
      }
    });
  }

  printInvoice() {
    window.print();
  }

  cancelInvoice() {
    if (!this.invoice) return;
    const reason = prompt('سبب الإلغاء:');
    if (!reason) return;

    this.invoicesService.cancelInvoice(this.invoice.id, reason).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.invoice = response.data;
        }
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

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'مسودة',
      issued: 'صادرة',
      paid: 'مدفوعة',
      partial: 'مدفوعة جزئياً',
      overdue: 'متأخرة',
      cancelled: 'ملغاة',
    };
    return labels[status] || status;
  }
}
