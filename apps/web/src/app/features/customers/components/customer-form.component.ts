import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomersService } from '../services/customers.service';
import { CustomerCategory } from '../../../core/models';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/customers" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'تعديل العميل' : 'إضافة عميل جديد' }}</h1>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">المعلومات الأساسية</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">اسم العميل <span class="text-red-500">*</span></label>
              <input type="text" formControlName="name"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [class.border-red-500]="form.get('name')?.invalid && form.get('name')?.touched">
              <p *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-red-500 text-xs mt-1">
                اسم العميل مطلوب
              </p>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الاسم بالإنجليزية</label>
              <input type="text" formControlName="nameEn"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">التصنيف <span class="text-red-500">*</span></label>
              <select formControlName="categoryId"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">اختر التصنيف</option>
                <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">نوع الهوية <span class="text-red-500">*</span></label>
              <select formControlName="idType"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="national_id">هوية وطنية</option>
                <option value="iqama">إقامة</option>
                <option value="cr">سجل تجاري</option>
                <option value="passport">جواز سفر</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم الهوية <span class="text-red-500">*</span></label>
              <input type="text" formControlName="idNumber"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">معلومات الاتصال</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم الهاتف <span class="text-red-500">*</span></label>
              <input type="tel" formControlName="phone" dir="ltr"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم الجوال</label>
              <input type="tel" formControlName="mobile" dir="ltr"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
              <input type="email" formControlName="email" dir="ltr"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">العنوان</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm text-gray-600 mb-1">العنوان <span class="text-red-500">*</span></label>
              <textarea formControlName="address" rows="2"
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">المدينة</label>
              <input type="text" formControlName="city"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الحي</label>
              <input type="text" formControlName="district"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Billing Settings -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">إعدادات الفوترة</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">طريقة الدفع</label>
              <select formControlName="paymentTerms"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="postpaid">آجل</option>
                <option value="prepaid">مسبق الدفع</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">دورة الفوترة</label>
              <select formControlName="billingCycle"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="monthly">شهري</option>
                <option value="bimonthly">كل شهرين</option>
                <option value="quarterly">ربع سنوي</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">حد الائتمان</label>
              <input type="number" formControlName="creditLimit"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-4">
          <a routerLink="/customers" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
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
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private customersService = inject(CustomersService);

  form: FormGroup;
  categories: CustomerCategory[] = [];
  isEdit = false;
  customerId: string | null = null;
  loading = false;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      nameEn: [''],
      categoryId: ['', Validators.required],
      idType: ['national_id', Validators.required],
      idNumber: ['', Validators.required],
      phone: ['', Validators.required],
      mobile: [''],
      email: ['', Validators.email],
      address: ['', Validators.required],
      city: [''],
      district: [''],
      paymentTerms: ['postpaid'],
      billingCycle: ['monthly'],
      creditLimit: [0],
    });
  }

  ngOnInit() {
    this.loadCategories();
    
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId && this.customerId !== 'new') {
      this.isEdit = true;
      this.loadCustomer();
    }
  }

  loadCategories() {
    this.customersService.getCategories({ isActive: true }).subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  loadCustomer() {
    if (!this.customerId) return;
    
    this.customersService.getCustomerById(this.customerId).subscribe({
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
      ? this.customersService.updateCustomer(this.customerId!, data)
      : this.customersService.createCustomer(data);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/customers']);
        }
      },
      error: (err) => {
        console.error('Error saving customer:', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
