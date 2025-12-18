import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomersService } from '../services/customers.service';
import { CustomerCategory } from '../../../core/models';
import {
  IdType,
  PaymentTerms,
  BillingCycle,
  ID_TYPE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  BILLING_CYCLE_OPTIONS,
} from '../../../core/models/customer.model';

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
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">المعلومات الأساسية</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">اسم العميل <span class="text-red-500">*</span></label>
              <input type="text" formControlName="name"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [class.border-red-500]="form.get('name')?.invalid && form.get('name')?.touched">
              <p *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-red-500 text-xs mt-1">
                اسم العميل مطلوب (3 أحرف على الأقل)
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
                <option *ngFor="let opt of idTypeOptions" [value]="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم الهوية <span class="text-red-500">*</span></label>
              <input type="text" formControlName="idNumber"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الرقم الضريبي</label>
              <input type="text" formControlName="taxNumber"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="300000000000000">
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">معلومات الاتصال</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم الهاتف <span class="text-red-500">*</span></label>
              <input type="tel" formControlName="phone" dir="ltr"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="0112345678">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم الجوال</label>
              <input type="tel" formControlName="mobile" dir="ltr"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="0501234567">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
              <input type="email" formControlName="email" dir="ltr"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="example@domain.com">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">جهة الاتصال</label>
              <input type="text" formControlName="contactPerson"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">هاتف جهة الاتصال</label>
              <input type="tel" formControlName="contactPhone" dir="ltr"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">العنوان</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-2">
              <label class="block text-sm text-gray-600 mb-1">العنوان التفصيلي <span class="text-red-500">*</span></label>
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
            <div>
              <label class="block text-sm text-gray-600 mb-1">المبنى</label>
              <input type="text" formControlName="building"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الطابق</label>
              <input type="text" formControlName="floor"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">خط العرض</label>
              <input type="number" formControlName="latitude" step="0.0001"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="24.7136">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">خط الطول</label>
              <input type="number" formControlName="longitude" step="0.0001"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="46.6753">
            </div>
          </div>
        </div>

        <!-- Billing Settings -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">إعدادات الفوترة</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">طريقة الدفع</label>
              <select formControlName="paymentTerms"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option *ngFor="let opt of paymentTermsOptions" [value]="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">دورة الفوترة</label>
              <select formControlName="billingCycle"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option *ngFor="let opt of billingCycleOptions" [value]="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">حد الائتمان (ريال)</label>
              <input type="number" formControlName="creditLimit"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">تاريخ التوصيل</label>
              <input type="date" formControlName="connectionDate"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Government Subsidy -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">الدعم الحكومي</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="flex items-center gap-2">
              <input type="checkbox" formControlName="isSubsidized" id="isSubsidized"
                     class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
              <label for="isSubsidized" class="text-sm text-gray-600">يستفيد من الدعم الحكومي</label>
            </div>
            <div *ngIf="form.get('isSubsidized')?.value">
              <label class="block text-sm text-gray-600 mb-1">رقم مرجع الدعم</label>
              <input type="text" formControlName="subsidyReferenceNo"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div *ngIf="form.get('isSubsidized')?.value">
              <label class="block text-sm text-gray-600 mb-1">تاريخ بداية الدعم</label>
              <input type="date" formControlName="subsidyStartDate"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div *ngIf="form.get('isSubsidized')?.value">
              <label class="block text-sm text-gray-600 mb-1">تاريخ نهاية الدعم</label>
              <input type="date" formControlName="subsidyEndDate"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">ملاحظات</h2>
          <textarea formControlName="notes" rows="3"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أي ملاحظات إضافية..."></textarea>
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

  idTypeOptions = ID_TYPE_OPTIONS;
  paymentTermsOptions = PAYMENT_TERMS_OPTIONS;
  billingCycleOptions = BILLING_CYCLE_OPTIONS;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      nameEn: ['', Validators.maxLength(200)],
      categoryId: ['', Validators.required],
      idType: ['national_id', Validators.required],
      idNumber: ['', [Validators.required, Validators.minLength(5)]],
      taxNumber: [''],
      phone: ['', Validators.required],
      mobile: [''],
      email: ['', Validators.email],
      address: ['', Validators.required],
      city: [''],
      district: [''],
      building: [''],
      floor: [''],
      latitude: [null],
      longitude: [null],
      paymentTerms: ['postpaid'],
      billingCycle: ['monthly'],
      creditLimit: [0],
      connectionDate: [null],
      isSubsidized: [false],
      subsidyReferenceNo: [''],
      subsidyStartDate: [null],
      subsidyEndDate: [null],
      contactPerson: [''],
      contactPhone: [''],
      notes: [''],
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
          const customer = response.data;
          this.form.patchValue({
            ...customer,
            connectionDate: customer.connectionDate ? this.formatDateForInput(customer.connectionDate) : null,
            subsidyStartDate: customer.subsidyStartDate ? this.formatDateForInput(customer.subsidyStartDate) : null,
            subsidyEndDate: customer.subsidyEndDate ? this.formatDateForInput(customer.subsidyEndDate) : null,
          });
        }
      }
    });
  }

  formatDateForInput(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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
