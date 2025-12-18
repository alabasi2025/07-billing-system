import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InvoicesService } from '../services/invoices.service';
import { CustomersService } from '../../customers/services/customers.service';
import { Customer, CustomerCategory } from '../../../core/models';

@Component({
  selector: 'app-invoice-generate',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/invoices" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">إصدار فاتورة</h1>
        </div>
      </div>

      <!-- Generation Type -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">نوع الإصدار</h2>
        <div class="flex gap-4">
          <button (click)="generationType = 'single'" 
                  class="flex-1 p-4 border-2 rounded-lg transition-colors"
                  [class]="generationType === 'single' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
            <i class="pi pi-user text-2xl mb-2" [class]="generationType === 'single' ? 'text-blue-600' : 'text-gray-400'"></i>
            <p class="font-medium" [class]="generationType === 'single' ? 'text-blue-600' : 'text-gray-700'">فاتورة فردية</p>
            <p class="text-sm text-gray-500">إصدار فاتورة لعميل واحد</p>
          </button>
          <button (click)="generationType = 'batch'" 
                  class="flex-1 p-4 border-2 rounded-lg transition-colors"
                  [class]="generationType === 'batch' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
            <i class="pi pi-users text-2xl mb-2" [class]="generationType === 'batch' ? 'text-blue-600' : 'text-gray-400'"></i>
            <p class="font-medium" [class]="generationType === 'batch' ? 'text-blue-600' : 'text-gray-700'">فوترة جماعية</p>
            <p class="text-sm text-gray-500">إصدار فواتير لمجموعة من العملاء</p>
          </button>
        </div>
      </div>

      <!-- Single Invoice Form -->
      <form *ngIf="generationType === 'single'" [formGroup]="singleForm" (ngSubmit)="generateSingle()" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">معلومات الفاتورة</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">رقم حساب العميل <span class="text-red-500">*</span></label>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="accountNo" [ngModelOptions]="{standalone: true}"
                       placeholder="أدخل رقم الحساب"
                       class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <button type="button" (click)="searchCustomer()"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  بحث
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">فترة الفوترة <span class="text-red-500">*</span></label>
              <input type="month" formControlName="billingPeriod"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>

          <!-- Customer Info -->
          <div *ngIf="selectedCustomer" class="mt-4 p-4 bg-blue-50 rounded-lg">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-gray-500">اسم العميل</p>
                <p class="font-medium">{{ selectedCustomer.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">التصنيف</p>
                <p class="font-medium">{{ selectedCustomer.category?.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">رقم الحساب</p>
                <p class="font-medium">{{ selectedCustomer.accountNo }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">الحالة</p>
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="selectedCustomer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ selectedCustomer.status === 'active' ? 'نشط' : 'غير نشط' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-4">
          <a routerLink="/invoices" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            إلغاء
          </a>
          <button type="submit" [disabled]="singleForm.invalid || !selectedCustomer || loading"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {{ loading ? 'جاري الإصدار...' : 'إصدار الفاتورة' }}
          </button>
        </div>
      </form>

      <!-- Batch Invoice Form -->
      <form *ngIf="generationType === 'batch'" [formGroup]="batchForm" (ngSubmit)="generateBatch()" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">معلومات الفوترة الجماعية</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">فترة الفوترة <span class="text-red-500">*</span></label>
              <input type="month" formControlName="billingPeriod"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">تصنيف العملاء</label>
              <select formControlName="categoryId"
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">جميع التصنيفات</option>
                <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Warning -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i>
            <div>
              <p class="font-medium text-yellow-800">تنبيه</p>
              <p class="text-sm text-yellow-700">سيتم إصدار فواتير لجميع العملاء النشطين الذين لديهم قراءات غير مفوترة للفترة المحددة.</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-4">
          <a routerLink="/invoices" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            إلغاء
          </a>
          <button type="submit" [disabled]="batchForm.invalid || loading"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {{ loading ? 'جاري الإصدار...' : 'بدء الفوترة الجماعية' }}
          </button>
        </div>
      </form>

      <!-- Results -->
      <div *ngIf="batchResult" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">نتائج الفوترة</h2>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="p-4 bg-green-50 rounded-lg text-center">
            <p class="text-3xl font-bold text-green-600">{{ batchResult.generated }}</p>
            <p class="text-gray-600">فواتير صادرة</p>
          </div>
          <div class="p-4 bg-red-50 rounded-lg text-center">
            <p class="text-3xl font-bold text-red-600">{{ batchResult.failed }}</p>
            <p class="text-gray-600">فشل</p>
          </div>
        </div>
        <div *ngIf="batchResult.errors.length > 0" class="mt-4">
          <p class="font-medium text-red-600 mb-2">الأخطاء:</p>
          <ul class="list-disc list-inside text-sm text-red-600">
            <li *ngFor="let error of batchResult.errors">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class InvoiceGenerateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private customersService = inject(CustomersService);

  generationType: 'single' | 'batch' = 'single';
  singleForm: FormGroup;
  batchForm: FormGroup;
  
  accountNo = '';
  selectedCustomer: Customer | null = null;
  categories: CustomerCategory[] = [];
  loading = false;
  batchResult: { generated: number; failed: number; errors: string[] } | null = null;

  constructor() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    this.singleForm = this.fb.group({
      customerId: ['', Validators.required],
      billingPeriod: [currentMonth, Validators.required],
    });
    
    this.batchForm = this.fb.group({
      billingPeriod: [currentMonth, Validators.required],
      categoryId: [''],
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.customersService.getCategories({ isActive: true }).subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  searchCustomer() {
    if (!this.accountNo.trim()) return;
    
    this.customersService.getCustomerByAccountNo(this.accountNo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedCustomer = response.data;
          this.singleForm.patchValue({ customerId: response.data.id });
        }
      },
      error: () => {
        alert('العميل غير موجود');
      }
    });
  }

  generateSingle() {
    if (this.singleForm.invalid || !this.selectedCustomer) return;

    this.loading = true;
    const data = this.singleForm.value;

    this.invoicesService.generateInvoice(data).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.router.navigate(['/invoices', response.data.id]);
        }
      },
      error: (err) => {
        console.error('Error generating invoice:', err);
        alert('حدث خطأ أثناء إصدار الفاتورة');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  generateBatch() {
    if (this.batchForm.invalid) return;

    this.loading = true;
    this.batchResult = null;
    const data = this.batchForm.value;

    this.invoicesService.generateBatchInvoices(data).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.batchResult = response.data;
        }
      },
      error: (err) => {
        console.error('Error generating batch invoices:', err);
        alert('حدث خطأ أثناء الفوترة الجماعية');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
