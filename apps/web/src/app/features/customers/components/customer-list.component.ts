import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../services/customers.service';
import { Customer, CustomerCategory } from '../../../core/models';

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

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
              <option value="disconnected">مفصول</option>
              <option value="closed">مغلق</option>
            </select>
          </div>
          <div class="flex items-end">
            <button (click)="resetFilters()" 
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
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
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الحساب</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">اسم العميل</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">التصنيف</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الهاتف</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">المدينة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let customer of customers" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <a [routerLink]="['/customers', customer.id]" class="text-blue-600 hover:underline font-medium">
                  {{ customer.accountNo }}
                </a>
              </td>
              <td class="px-4 py-3 text-sm text-gray-800">{{ customer.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ customer.category?.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600" dir="ltr">{{ customer.phone }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ customer.city }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="getStatusClass(customer.status)">
                  {{ getStatusLabel(customer.status) }}
                </span>
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
                  <a [routerLink]="['/invoices']" [queryParams]="{customerId: customer.id}"
                     class="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="الفواتير">
                    <i class="pi pi-file-edit"></i>
                  </a>
                </div>
              </td>
            </tr>
            <tr *ngIf="customers.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p>لا يوجد عملاء</p>
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
export class CustomerListComponent implements OnInit {
  private customersService = inject(CustomersService);
  
  customers: Customer[] = [];
  categories: CustomerCategory[] = [];
  loading = false;
  error: string | null = null;
  
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  
  Math = Math;

  ngOnInit() {
    this.loadCategories();
    this.loadCustomers();
  }

  loadCategories() {
    this.customersService.getCategories({ isActive: true }).subscribe({
      next: (response) => {
        this.categories = response.data;
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
    }).subscribe({
      next: (response) => {
        this.customers = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'حدث خطأ أثناء تحميل البيانات';
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadCustomers();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
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
}
