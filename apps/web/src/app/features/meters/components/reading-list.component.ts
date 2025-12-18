import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetersService } from '../services/meters.service';
import { MeterReading } from '../../../core/models';

@Component({
  selector: 'app-reading-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">قراءات العدادات</h1>
        <a routerLink="/readings/new" 
           class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>تسجيل قراءة</span>
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">فترة الفوترة</label>
            <input type="month" [(ngModel)]="billingPeriod" (change)="loadReadings()"
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">نوع القراءة</label>
            <select [(ngModel)]="readingType" (change)="loadReadings()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option value="actual">فعلية</option>
              <option value="estimated">تقديرية</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">الحالة</label>
            <select [(ngModel)]="isProcessed" (change)="loadReadings()"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option value="true">مفوترة</option>
              <option value="false">غير مفوترة</option>
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
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">العميل</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">تاريخ القراءة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">القراءة السابقة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">القراءة الحالية</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الاستهلاك</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">النوع</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let reading of readings" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <a [routerLink]="['/meters', reading.meterId]" class="text-blue-600 hover:underline font-medium">
                  {{ reading.meter?.meterNo }}
                </a>
              </td>
              <td class="px-4 py-3 text-sm text-gray-800">
                {{ reading.meter?.customer?.name || '-' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ reading.readingDate | date:'yyyy-MM-dd' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ reading.previousReading | number:'1.2-2' }}</td>
              <td class="px-4 py-3 text-sm text-gray-800 font-medium">{{ reading.reading | number:'1.2-2' }}</td>
              <td class="px-4 py-3 text-sm text-gray-800">{{ reading.consumption | number:'1.2-2' }} ك.و.س</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="reading.readingType === 'actual' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                  {{ reading.readingType === 'actual' ? 'فعلية' : 'تقديرية' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="reading.isProcessed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'">
                  {{ reading.isProcessed ? 'مفوترة' : 'غير مفوترة' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="readings.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                <i class="pi pi-inbox text-4xl mb-2"></i>
                <p>لا توجد قراءات</p>
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
export class ReadingListComponent implements OnInit {
  private metersService = inject(MetersService);
  
  readings: MeterReading[] = [];
  
  billingPeriod = '';
  readingType = '';
  isProcessed = '';
  
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  
  Math = Math;

  ngOnInit() {
    this.loadReadings();
  }

  loadReadings() {
    this.metersService.getReadings({
      page: this.page,
      limit: this.limit,
      billingPeriod: this.billingPeriod || undefined,
      readingType: this.readingType || undefined,
      isProcessed: this.isProcessed ? this.isProcessed === 'true' : undefined,
    }).subscribe({
      next: (response) => {
        this.readings = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
      }
    });
  }

  resetFilters() {
    this.billingPeriod = '';
    this.readingType = '';
    this.isProcessed = '';
    this.page = 1;
    this.loadReadings();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadReadings();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadReadings();
    }
  }
}
