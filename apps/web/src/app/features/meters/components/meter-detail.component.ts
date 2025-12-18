import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MetersService } from '../services/meters.service';
import { Meter, MeterReading } from '../../../core/models';

@Component({
  selector: 'app-meter-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6" *ngIf="meter">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/meters" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">العداد {{ meter.meterNo }}</h1>
            <p class="text-gray-500">{{ meter.meterType?.name }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a [routerLink]="['/readings/new']" [queryParams]="{meterId: meter.id}"
             class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <i class="pi pi-plus"></i>
            <span>تسجيل قراءة</span>
          </a>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="flex items-center gap-4">
        <span class="px-3 py-1 rounded-full text-sm font-medium"
              [class]="getStatusClass(meter.status)">
          {{ getStatusLabel(meter.status) }}
        </span>
        <span *ngIf="meter.meterType?.isSmartMeter" class="text-green-600 flex items-center gap-1">
          <i class="pi pi-wifi"></i>
          عداد ذكي
        </span>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Meter Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">معلومات العداد</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-500">رقم العداد:</span>
              <span class="text-gray-800 font-medium">{{ meter.meterNo }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">النوع:</span>
              <span class="text-gray-800">{{ meter.meterType?.name }}</span>
            </div>
            <div class="flex justify-between" *ngIf="meter.manufacturer">
              <span class="text-gray-500">الشركة المصنعة:</span>
              <span class="text-gray-800">{{ meter.manufacturer }}</span>
            </div>
            <div class="flex justify-between" *ngIf="meter.model">
              <span class="text-gray-500">الموديل:</span>
              <span class="text-gray-800">{{ meter.model }}</span>
            </div>
            <div class="flex justify-between" *ngIf="meter.serialNumber">
              <span class="text-gray-500">الرقم التسلسلي:</span>
              <span class="text-gray-800">{{ meter.serialNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">معامل الضرب:</span>
              <span class="text-gray-800">{{ meter.multiplier }}</span>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">معلومات العميل</h3>
          <div class="space-y-3" *ngIf="meter.customer">
            <div class="flex justify-between">
              <span class="text-gray-500">اسم العميل:</span>
              <a [routerLink]="['/customers', meter.customerId]" class="text-blue-600 hover:underline">
                {{ meter.customer.name }}
              </a>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">رقم الحساب:</span>
              <span class="text-gray-800">{{ meter.customer.accountNo }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">تاريخ التركيب:</span>
              <span class="text-gray-800">{{ meter.installDate | date:'yyyy-MM-dd' }}</span>
            </div>
          </div>
          <div *ngIf="!meter.customer" class="text-center py-4 text-gray-500">
            <i class="pi pi-user-minus text-3xl mb-2"></i>
            <p>العداد غير مركب لعميل</p>
          </div>
        </div>

        <!-- Reading Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">معلومات القراءة</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-500">آخر قراءة:</span>
              <span class="text-gray-800 font-medium">{{ meter.lastReading | number:'1.2-2' }} ك.و.س</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">تاريخ آخر قراءة:</span>
              <span class="text-gray-800">{{ meter.lastReadDate | date:'yyyy-MM-dd' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="bg-white rounded-lg shadow p-6" *ngIf="meter.location">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">الموقع</h3>
        <p class="text-gray-700">{{ meter.location }}</p>
      </div>

      <!-- Recent Readings -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">سجل القراءات</h3>
          <a [routerLink]="['/readings']" [queryParams]="{meterId: meter.id}" class="text-blue-600 hover:underline text-sm">
            عرض الكل
          </a>
        </div>
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">التاريخ</th>
              <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">القراءة</th>
              <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">الاستهلاك</th>
              <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">النوع</th>
              <th class="px-4 py-2 text-right text-sm font-medium text-gray-600">الفترة</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let reading of readings" class="hover:bg-gray-50">
              <td class="px-4 py-2 text-sm text-gray-800">{{ reading.readingDate | date:'yyyy-MM-dd' }}</td>
              <td class="px-4 py-2 text-sm text-gray-800">{{ reading.reading | number:'1.2-2' }}</td>
              <td class="px-4 py-2 text-sm text-gray-800">{{ reading.consumption | number:'1.2-2' }} ك.و.س</td>
              <td class="px-4 py-2 text-sm">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="reading.readingType === 'actual' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                  {{ reading.readingType === 'actual' ? 'فعلية' : 'تقديرية' }}
                </span>
              </td>
              <td class="px-4 py-2 text-sm text-gray-600">{{ reading.billingPeriod }}</td>
            </tr>
            <tr *ngIf="readings.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                لا توجد قراءات مسجلة
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class MeterDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private metersService = inject(MetersService);

  meter: Meter | null = null;
  readings: MeterReading[] = [];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMeter(id);
      this.loadReadings(id);
    }
  }

  loadMeter(id: string) {
    this.metersService.getMeterById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.meter = response.data;
        }
      }
    });
  }

  loadReadings(meterId: string) {
    this.metersService.getMeterReadings(meterId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.readings = response.data.slice(0, 10);
        }
      }
    });
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
