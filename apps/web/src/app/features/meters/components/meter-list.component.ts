import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetersService } from '../services/meters.service';
import { Meter, MeterType } from '../../../core/models';

@Component({
  selector: 'app-meter-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">إدارة العدادات</h1>
        <a routerLink="/meters/new" 
           class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>إضافة عداد</span>
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">البحث</label>
            <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()"
                   placeholder="رقم العداد..."
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">نوع العداد</label>
            <select [(ngModel)]="selectedType" (change)="loadMeters()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option *ngFor="let type of meterTypes" [value]="type.id">{{ type.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">الحالة</label>
            <select [(ngModel)]="selectedStatus" (change)="loadMeters()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option value="active">نشط</option>
              <option value="faulty">معطل</option>
              <option value="replaced">مستبدل</option>
              <option value="in_stock">في المخزن</option>
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

      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم العداد</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">النوع</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">العميل</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">آخر قراءة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">تاريخ التركيب</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let meter of meters" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <a [routerLink]="['/meters', meter.id]" class="text-blue-600 hover:underline font-medium">
                  {{ meter.meterNo }}
                </a>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ meter.meterType?.name }}
                <span *ngIf="meter.meterType?.isSmartMeter" class="mr-1 text-xs text-green-600">
                  <i class="pi pi-wifi"></i>
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-800">
                <a *ngIf="meter.customer" [routerLink]="['/customers', meter.customerId]" class="text-blue-600 hover:underline">
                  {{ meter.customer?.name }}
                </a>
                <span *ngIf="!meter.customer" class="text-gray-400">غير مركب</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ meter.lastReading | number:'1.2-2' }} ك.و.س</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ meter.installDate | date:'yyyy-MM-dd' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="getStatusClass(meter.status)">
                  {{ getStatusLabel(meter.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <a [routerLink]="['/meters', meter.id]" 
                     class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="عرض">
                    <i class="pi pi-eye"></i>
                  </a>
                  <a [routerLink]="['/readings/new']" [queryParams]="{meterId: meter.id}"
                     class="p-1 text-green-600 hover:bg-green-50 rounded" title="تسجيل قراءة">
                    <i class="pi pi-plus-circle"></i>
                  </a>
                </div>
              </td>
            </tr>
            <tr *ngIf="meters.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p>لا يوجد عدادات</p>
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
export class MeterListComponent implements OnInit {
  private metersService = inject(MetersService);
  
  meters: Meter[] = [];
  meterTypes: MeterType[] = [];
  
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  
  Math = Math;

  ngOnInit() {
    this.loadMeterTypes();
    this.loadMeters();
  }

  loadMeterTypes() {
    this.metersService.getMeterTypes({ isActive: true }).subscribe({
      next: (response) => {
        this.meterTypes = response.data;
      }
    });
  }

  loadMeters() {
    this.metersService.getMeters({
      page: this.page,
      limit: this.limit,
      meterTypeId: this.selectedType || undefined,
      status: this.selectedStatus || undefined,
    }).subscribe({
      next: (response) => {
        this.meters = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadMeters();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.page = 1;
    this.loadMeters();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadMeters();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadMeters();
    }
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      faulty: 'bg-red-100 text-red-700',
      replaced: 'bg-yellow-100 text-yellow-700',
      removed: 'bg-gray-100 text-gray-700',
      in_stock: 'bg-blue-100 text-blue-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      faulty: 'معطل',
      replaced: 'مستبدل',
      removed: 'مزال',
      in_stock: 'في المخزن',
    };
    return labels[status] || status;
  }
}
