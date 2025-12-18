import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CustomersService } from '../services/customers.service';
import { Customer, Contract, Invoice } from '../../../core/models';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6" *ngIf="customer">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/customers" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">{{ customer.name }}</h1>
            <p class="text-gray-500">{{ customer.accountNo }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a [routerLink]="['/customers', customer.id, 'edit']"
             class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <i class="pi pi-pencil"></i>
            <span>تعديل</span>
          </a>
          <button (click)="toggleStatus()"
                  class="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  [class]="customer.status === 'active' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'">
            <i [class]="customer.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"></i>
            <span>{{ customer.status === 'active' ? 'إيقاف' : 'تفعيل' }}</span>
          </button>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="flex items-center gap-4">
        <span class="px-3 py-1 rounded-full text-sm font-medium"
              [class]="getStatusClass(customer.status)">
          {{ getStatusLabel(customer.status) }}
        </span>
        <span class="text-gray-500">{{ customer.category?.name }}</span>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">المعلومات الأساسية</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-500">نوع الهوية:</span>
              <span class="text-gray-800">{{ getIdTypeLabel(customer.idType) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">رقم الهوية:</span>
              <span class="text-gray-800">{{ customer.idNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">تاريخ التوصيل:</span>
              <span class="text-gray-800">{{ customer.connectionDate | date:'yyyy-MM-dd' }}</span>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">معلومات الاتصال</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-500">الهاتف:</span>
              <span class="text-gray-800" dir="ltr">{{ customer.phone }}</span>
            </div>
            <div class="flex justify-between" *ngIf="customer.mobile">
              <span class="text-gray-500">الجوال:</span>
              <span class="text-gray-800" dir="ltr">{{ customer.mobile }}</span>
            </div>
            <div class="flex justify-between" *ngIf="customer.email">
              <span class="text-gray-500">البريد:</span>
              <span class="text-gray-800" dir="ltr">{{ customer.email }}</span>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">العنوان</h3>
          <div class="space-y-3">
            <div>
              <span class="text-gray-800">{{ customer.address }}</span>
            </div>
            <div class="flex justify-between" *ngIf="customer.city">
              <span class="text-gray-500">المدينة:</span>
              <span class="text-gray-800">{{ customer.city }}</span>
            </div>
            <div class="flex justify-between" *ngIf="customer.district">
              <span class="text-gray-500">الحي:</span>
              <span class="text-gray-800">{{ customer.district }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">الملخص المالي</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(balance?.balance || 0) }}</p>
            <p class="text-gray-600">الرصيد الحالي</p>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <p class="text-2xl font-bold text-red-600">{{ formatCurrency(balance?.overdueAmount || 0) }}</p>
            <p class="text-gray-600">المتأخرات</p>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(customer.creditLimit) }}</p>
            <p class="text-gray-600">حد الائتمان</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-2xl font-bold text-yellow-600">{{ customer.billingCycle === 'monthly' ? 'شهري' : 'كل شهرين' }}</p>
            <p class="text-gray-600">دورة الفوترة</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a [routerLink]="['/invoices']" [queryParams]="{customerId: customer.id}"
           class="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <i class="pi pi-file-edit text-3xl text-blue-600 mb-2"></i>
          <span class="text-gray-700">الفواتير</span>
        </a>
        <a [routerLink]="['/payments']" [queryParams]="{customerId: customer.id}"
           class="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <i class="pi pi-wallet text-3xl text-green-600 mb-2"></i>
          <span class="text-gray-700">المدفوعات</span>
        </a>
        <a [routerLink]="['/meters']" [queryParams]="{customerId: customer.id}"
           class="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <i class="pi pi-gauge text-3xl text-yellow-600 mb-2"></i>
          <span class="text-gray-700">العدادات</span>
        </a>
        <a [routerLink]="['/readings']" [queryParams]="{customerId: customer.id}"
           class="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <i class="pi pi-chart-line text-3xl text-purple-600 mb-2"></i>
          <span class="text-gray-700">القراءات</span>
        </a>
      </div>
    </div>
  `
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private customersService = inject(CustomersService);

  customer: Customer | null = null;
  balance: { balance: number; overdueAmount: number } | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(id);
      this.loadBalance(id);
    }
  }

  loadCustomer(id: string) {
    this.customersService.getCustomerById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customer = response.data;
        }
      }
    });
  }

  loadBalance(id: string) {
    this.customersService.getCustomerBalance(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.balance = response.data;
        }
      }
    });
  }

  toggleStatus() {
    if (!this.customer) return;
    const newStatus = this.customer.status === 'active' ? 'suspended' : 'active';
    this.customersService.updateCustomerStatus(this.customer.id, newStatus).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customer = response.data;
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
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      disconnected: 'bg-red-100 text-red-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      suspended: 'موقوف',
      disconnected: 'مفصول',
      closed: 'مغلق',
    };
    return labels[status] || status;
  }

  getIdTypeLabel(idType: string): string {
    const labels: Record<string, string> = {
      national_id: 'هوية وطنية',
      iqama: 'إقامة',
      cr: 'سجل تجاري',
      passport: 'جواز سفر',
    };
    return labels[idType] || idType;
  }
}
