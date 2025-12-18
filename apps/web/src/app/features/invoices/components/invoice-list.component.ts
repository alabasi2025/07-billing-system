import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoicesService } from '../services/invoices.service';
import { Invoice } from '../../../core/models';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">إدارة الفواتير</h1>
        <a routerLink="/invoices/generate" 
           class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>إصدار فاتورة</span>
        </a>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ totalInvoices }}</p>
          <p class="text-gray-600 text-sm">إجمالي الفواتير</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-2xl font-bold text-yellow-600">{{ pendingCount }}</p>
          <p class="text-gray-600 text-sm">معلقة</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ paidCount }}</p>
          <p class="text-gray-600 text-sm">مدفوعة</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <p class="text-2xl font-bold text-red-600">{{ overdueCount }}</p>
          <p class="text-gray-600 text-sm">متأخرة</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">فترة الفوترة</label>
            <input type="month" [(ngModel)]="billingPeriod" (change)="loadInvoices()"
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">الحالة</label>
            <select [(ngModel)]="selectedStatus" (change)="loadInvoices()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option value="issued">صادرة</option>
              <option value="paid">مدفوعة</option>
              <option value="partial">مدفوعة جزئياً</option>
              <option value="overdue">متأخرة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">من تاريخ</label>
            <input type="date" [(ngModel)]="fromDate" (change)="loadInvoices()"
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

      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الفاتورة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">العميل</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الفترة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الاستهلاك</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">المبلغ</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">المتبقي</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">تاريخ الاستحقاق</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let invoice of invoices" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <a [routerLink]="['/invoices', invoice.id]" class="text-blue-600 hover:underline font-medium">
                  {{ invoice.invoiceNo }}
                </a>
              </td>
              <td class="px-4 py-3 text-sm text-gray-800">{{ invoice.customer?.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ invoice.billingPeriod }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ invoice.consumption | number:'1.2-2' }} ك.و.س</td>
              <td class="px-4 py-3 text-sm text-gray-800 font-medium">{{ formatCurrency(invoice.totalAmount) }}</td>
              <td class="px-4 py-3 text-sm" [class]="invoice.balance > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(invoice.balance) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ invoice.dueDate | date:'yyyy-MM-dd' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="getStatusClass(invoice.status)">
                  {{ getStatusLabel(invoice.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <a [routerLink]="['/invoices', invoice.id]" 
                     class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="عرض">
                    <i class="pi pi-eye"></i>
                  </a>
                  <a *ngIf="invoice.balance > 0" [routerLink]="['/payments/new']" [queryParams]="{invoiceId: invoice.id}"
                     class="p-1 text-green-600 hover:bg-green-50 rounded" title="تسجيل دفعة">
                    <i class="pi pi-credit-card"></i>
                  </a>
                  <button *ngIf="invoice.status !== 'cancelled'" (click)="printInvoice(invoice)"
                          class="p-1 text-gray-600 hover:bg-gray-50 rounded" title="طباعة">
                    <i class="pi pi-print"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="invoices.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p>لا توجد فواتير</p>
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
export class InvoiceListComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  
  invoices: Invoice[] = [];
  
  billingPeriod = '';
  selectedStatus = '';
  fromDate = '';
  
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  
  totalInvoices = 0;
  pendingCount = 0;
  paidCount = 0;
  overdueCount = 0;
  
  Math = Math;

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoicesService.getInvoices({
      page: this.page,
      limit: this.limit,
      billingPeriod: this.billingPeriod || undefined,
      status: this.selectedStatus || undefined,
      fromDate: this.fromDate || undefined,
    }).subscribe({
      next: (response) => {
        this.invoices = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.totalInvoices = response.total;
        
        // Calculate counts
        this.pendingCount = this.invoices.filter(i => i.status === 'issued').length;
        this.paidCount = this.invoices.filter(i => i.status === 'paid').length;
        this.overdueCount = this.invoices.filter(i => i.status === 'overdue').length;
      }
    });
  }

  resetFilters() {
    this.billingPeriod = '';
    this.selectedStatus = '';
    this.fromDate = '';
    this.page = 1;
    this.loadInvoices();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadInvoices();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadInvoices();
    }
  }

  printInvoice(invoice: Invoice) {
    window.print();
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
