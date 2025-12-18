import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../services/customers.service';
import { Customer, CustomerCategory } from '../../../core/models';
import {
  CustomerStatistics,
  CUSTOMER_STATUS_OPTIONS,
} from '../../../core/models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">إدارة العملاء</h1>
        <a routerLink="/customers/new" 
           class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>إضافة عميل</span>
        </a>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4" *ngIf="statistics">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-3xl font-bold text-blue-600">{{ statistics.total }}</div>
          <div class="text-gray-600 text-sm">إجمالي العملاء</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-3xl font-bold text-green-600">{{ statistics.byStatus?.active || 0 }}</div>
          <div class="text-gray-600 text-sm">عملاء نشطين</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-3xl font-bold text-yellow-600">{{ statistics.byStatus?.suspended || 0 }}</div>
          <div class="text-gray-600 text-sm">عملاء موقوفين</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-3xl font-bold text-purple-600">{{ statistics.subsidized || 0 }}</div>
          <div class="text-gray-600 text-sm">مستفيدين من الدعم</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">البحث</label>
            <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()"
                   placeholder="اسم العميل أو رقم الحساب..."
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">التصنيف</label>
            <select [(ngModel)]="selectedCategory" (change)="loadCustomers()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">الحالة</label>
            <select [(ngModel)]="selectedStatus" (change)="loadCustomers()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option *ngFor="let opt of statusOptions" [value]="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">المدينة</label>
            <input type="text" [(ngModel)]="selectedCity" (input)="onSearch()"
                   placeholder="المدينة..."
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div class="flex items-end">
            <button (click)="resetFilters()" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-12 bg-white rounded-lg shadow">
        <div class="loading-spinner"></div>
        <span class="mr-3 text-gray-600">جاري تحميل البيانات...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-red-700 mb-4">{{ error }}</p>
        <button (click)="loadCustomers()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <i class="pi pi-refresh ml-2"></i>
          إعادة المحاولة
        </button>
      </div>

      <!-- Table -->
      <div *ngIf="!loading && !error" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الحساب</th>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">اسم العميل</th>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">التصنيف</th>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الهاتف</th>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">المدينة</th>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الدعم</th>
                <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let customer of customers" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">
                  <a [routerLink]="['/customers', customer.id]" class="text-blue-600 hover:underline font-medium font-mono">
                    {{ customer.accountNo }}
                  </a>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm font-medium text-gray-800">{{ customer.name }}</div>
                  <div class="text-xs text-gray-500" *ngIf="customer.nameEn">{{ customer.nameEn }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {{ customer.category?.name || '-' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 font-mono" dir="ltr">{{ customer.phone }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ customer.city || '-' }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs rounded-full"
                        [class]="getStatusClass(customer.status)">
                    {{ getStatusLabel(customer.status) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span *ngIf="customer.isSubsidized" class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                    مدعوم
                  </span>
                  <span *ngIf="!customer.isSubsidized" class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <a [routerLink]="['/customers', customer.id]" 
                       class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="عرض">
                      <i class="pi pi-eye"></i>
                    </a>
                    <a [routerLink]="['/customers', customer.id, 'edit']"
                       class="p-1 text-green-600 hover:bg-green-50 rounded" title="تعديل">
                      <i class="pi pi-pencil"></i>
                    </a>
                    <button *ngIf="customer.status === 'active'" 
                            (click)="suspendCustomer(customer)"
                            class="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="إيقاف">
                      <i class="pi pi-pause"></i>
                    </button>
                    <button *ngIf="customer.status === 'suspended'" 
                            (click)="activateCustomer(customer)"
                            class="p-1 text-green-600 hover:bg-green-50 rounded" title="تفعيل">
                      <i class="pi pi-play"></i>
                    </button>
                    <a [routerLink]="['/invoices']" [queryParams]="{customerId: customer.id}"
                       class="p-1 text-orange-600 hover:bg-orange-50 rounded" title="الفواتير">
                      <i class="pi pi-file-edit"></i>
                    </a>
                    <button (click)="deleteCustomer(customer)"
                            class="p-1 text-red-600 hover:bg-red-50 rounded" title="حذف">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="customers.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                  <i class="pi pi-inbox text-4xl mb-2"></i>
                  <p>لا يوجد عملاء</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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
export class CustomerListComponent implements OnInit {
  private customersService = inject(CustomersService);
  
  customers: Customer[] = [];
  categories: CustomerCategory[] = [];
  statistics: CustomerStatistics | null = null;
  loading = false;
  error: string | null = null;
  
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedCity = '';
  
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  
  Math = Math;
  statusOptions = CUSTOMER_STATUS_OPTIONS;
  
  private searchTimeout: any;

  ngOnInit() {
    this.loadCategories();
    this.loadStatistics();
    this.loadCustomers();
  }

  loadCategories() {
    this.customersService.getCategories({ isActive: true }).subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  loadStatistics() {
    this.customersService.getStatistics().subscribe({
      next: (response) => {
        this.statistics = response.data || null;
      }
    });
  }

  loadCustomers() {
    this.loading = true;
    this.error = null;
    this.customersService.getCustomers({
      page: this.page,
      limit: this.limit,
      search: this.searchTerm || undefined,
      categoryId: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
      city: this.selectedCity || undefined,
    }).subscribe({
      next: (response) => {
        this.customers = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages || Math.ceil(response.total / this.limit);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'حدث خطأ أثناء تحميل البيانات';
        this.loading = false;
      }
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.loadCustomers();
    }, 300);
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedCity = '';
    this.page = 1;
    this.loadCustomers();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadCustomers();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadCustomers();
    }
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      disconnected: 'bg-red-100 text-red-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }

  suspendCustomer(customer: Customer) {
    if (!confirm(`هل أنت متأكد من إيقاف العميل "${customer.name}"؟`)) return;

    this.customersService.suspendCustomer(customer.id, 'إيقاف من قبل المشغل').subscribe({
      next: () => {
        this.loadCustomers();
        this.loadStatistics();
      },
      error: (err) => {
        alert('فشل في إيقاف العميل');
        console.error('Error suspending customer:', err);
      }
    });
  }

  activateCustomer(customer: Customer) {
    if (!confirm(`هل أنت متأكد من تفعيل العميل "${customer.name}"؟`)) return;

    this.customersService.activateCustomer(customer.id).subscribe({
      next: () => {
        this.loadCustomers();
        this.loadStatistics();
      },
      error: (err) => {
        alert('فشل في تفعيل العميل');
        console.error('Error activating customer:', err);
      }
    });
  }

  deleteCustomer(customer: Customer) {
    if (!confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟\n\nملاحظة: سيتم إلغاء تفعيل العميل ولن يتم حذفه نهائياً (حذف ناعم).`)) return;

    this.customersService.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.loadCustomers();
        this.loadStatistics();
      },
      error: (err) => {
        alert(err.error?.message || 'فشل في حذف العميل');
        console.error('Error deleting customer:', err);
      }
    });
  }
}
