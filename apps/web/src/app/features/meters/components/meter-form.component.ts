import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MetersService } from '../services/meters.service';
import { MeterType } from '../../../core/models';

@Component({
  selector: 'app-meter-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/meters" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'تعديل العداد' : 'إضافة عداد جديد' }}</h1>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">معلومات العداد</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم العداد <span class="text-red-500">*</span></label>
              <input type="text" formControlName="meterNo"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [class.border-red-500]="form.get('meterNo')?.invalid && form.get('meterNo')?.touched">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">نوع العداد <span class="text-red-500">*</span></label>
              <select formControlName="meterTypeId"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">اختر النوع</option>
                <option *ngFor="let type of meterTypes" [value]="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الشركة المصنعة</label>
              <input type="text" formControlName="manufacturer"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الموديل</label>
              <input type="text" formControlName="model"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الرقم التسلسلي</label>
              <input type="text" formControlName="serialNumber"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">معامل الضرب</label>
              <input type="number" formControlName="multiplier" step="0.01"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">الموقع</h2>
          <div>
            <label class="block text-sm text-gray-600 mb-1">الموقع / العنوان</label>
            <textarea formControlName="location" rows="2"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">ملاحظات</h2>
          <div>
            <textarea formControlName="notes" rows="3"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-4">
          <a routerLink="/meters" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            إلغاء
          </a>
          <button type="submit" [disabled]="form.invalid || loading"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {{ loading ? 'جاري الحفظ...' : (isEdit ? 'تحديث' : 'حفظ') }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class MeterFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private metersService = inject(MetersService);

  form: FormGroup;
  meterTypes: MeterType[] = [];
  isEdit = false;
  meterId: string | null = null;
  loading = false;

  constructor() {
    this.form = this.fb.group({
      meterNo: ['', Validators.required],
      meterTypeId: ['', Validators.required],
      manufacturer: [''],
      model: [''],
      serialNumber: [''],
      multiplier: [1],
      location: [''],
      notes: [''],
    });
  }

  ngOnInit() {
    this.loadMeterTypes();
    
    this.meterId = this.route.snapshot.paramMap.get('id');
    if (this.meterId && this.meterId !== 'new') {
      this.isEdit = true;
      this.loadMeter();
    }
  }

  loadMeterTypes() {
    this.metersService.getMeterTypes({ isActive: true }).subscribe({
      next: (response) => {
        this.meterTypes = response.data;
      }
    });
  }

  loadMeter() {
    if (!this.meterId) return;
    
    this.metersService.getMeterById(this.meterId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.form.patchValue(response.data);
        }
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    const data = this.form.value;

    const request = this.isEdit
      ? this.metersService.updateMeter(this.meterId!, data)
      : this.metersService.createMeter(data);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/meters']);
        }
      },
      error: (err) => {
        console.error('Error saving meter:', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
