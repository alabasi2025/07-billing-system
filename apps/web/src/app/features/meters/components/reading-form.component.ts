import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MetersService } from '../services/meters.service';
import { Meter } from '../../../core/models';

@Component({
  selector: 'app-reading-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/readings" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">تسجيل قراءة جديدة</h1>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Meter Selection -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">اختيار العداد</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم العداد <span class="text-red-500">*</span></label>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="meterNo" [ngModelOptions]="{standalone: true}"
                       placeholder="أدخل رقم العداد"
                       class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <button type="button" (click)="searchMeter()"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  بحث
                </button>
              </div>
            </div>
          </div>

          <!-- Meter Info -->
          <div *ngIf="selectedMeter" class="mt-4 p-4 bg-blue-50 rounded-lg">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-gray-500">رقم العداد</p>
                <p class="font-medium">{{ selectedMeter.meterNo }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">العميل</p>
                <p class="font-medium">{{ selectedMeter.customer?.name || 'غير مركب' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">آخر قراءة</p>
                <p class="font-medium">{{ selectedMeter.lastReading | number:'1.2-2' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">تاريخ آخر قراءة</p>
                <p class="font-medium">{{ selectedMeter.lastReadDate | date:'yyyy-MM-dd' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reading Info -->
        <div class="bg-white rounded-lg shadow p-6" *ngIf="selectedMeter">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">معلومات القراءة</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">القراءة الحالية <span class="text-red-500">*</span></label>
              <input type="number" formControlName="reading" step="0.01"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [class.border-red-500]="form.get('reading')?.invalid && form.get('reading')?.touched">
              <p *ngIf="consumption !== null" class="text-sm text-gray-500 mt-1">
                الاستهلاك: <span class="font-medium text-blue-600">{{ consumption | number:'1.2-2' }} ك.و.س</span>
              </p>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">تاريخ القراءة <span class="text-red-500">*</span></label>
              <input type="date" formControlName="readingDate"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">نوع القراءة <span class="text-red-500">*</span></label>
              <select formControlName="readingType"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="actual">فعلية</option>
                <option value="estimated">تقديرية</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">فترة الفوترة <span class="text-red-500">*</span></label>
              <input type="month" formControlName="billingPeriod"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-lg shadow p-6" *ngIf="selectedMeter">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">ملاحظات</h2>
          <div>
            <textarea formControlName="notes" rows="3"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-4" *ngIf="selectedMeter">
          <a routerLink="/readings" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            إلغاء
          </a>
          <button type="submit" [disabled]="form.invalid || loading"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {{ loading ? 'جاري الحفظ...' : 'حفظ القراءة' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class ReadingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private metersService = inject(MetersService);

  form: FormGroup;
  meterNo = '';
  selectedMeter: Meter | null = null;
  loading = false;
  consumption: number | null = null;

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    this.form = this.fb.group({
      meterId: ['', Validators.required],
      reading: ['', [Validators.required, Validators.min(0)]],
      readingDate: [today, Validators.required],
      readingType: ['actual', Validators.required],
      billingPeriod: [currentMonth, Validators.required],
      notes: [''],
    });

    this.form.get('reading')?.valueChanges.subscribe(value => {
      if (this.selectedMeter && value) {
        this.consumption = value - this.selectedMeter.lastReading;
      } else {
        this.consumption = null;
      }
    });
  }

  ngOnInit() {
    const meterId = this.route.snapshot.queryParamMap.get('meterId');
    if (meterId) {
      this.loadMeterById(meterId);
    }
  }

  searchMeter() {
    if (!this.meterNo.trim()) return;
    
    this.metersService.getMeterByNo(this.meterNo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedMeter = response.data;
          this.form.patchValue({ meterId: response.data.id });
        }
      },
      error: () => {
        alert('العداد غير موجود');
      }
    });
  }

  loadMeterById(id: string) {
    this.metersService.getMeterById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedMeter = response.data;
          this.meterNo = response.data.meterNo;
          this.form.patchValue({ meterId: response.data.id });
        }
      }
    });
  }

  onSubmit() {
    if (this.form.invalid || !this.selectedMeter) return;

    this.loading = true;
    const data = this.form.value;

    this.metersService.createReading(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/readings']);
        }
      },
      error: (err) => {
        console.error('Error saving reading:', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
