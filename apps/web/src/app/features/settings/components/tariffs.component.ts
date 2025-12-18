import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Tariff, CustomerCategory } from '../../../core/models';
import { CustomersService } from '../../customers/services/customers.service';

@Component({
  selector: 'app-tariffs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/settings" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">شرائح التعرفة</h1>
        </div>
        <button (click)="showForm = true; editingTariff = null; resetForm()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>إضافة شريحة</span>
        </button>
      </div>

      <!-- Form Modal -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">{{ editingTariff ? 'تعديل الشريحة' : 'إضافة شريحة جديدة' }}</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-600 mb-1">التصنيف</label>
                <select [(ngModel)]="formData.categoryId"
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">اختر التصنيف</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">الاسم</label>
                <input type="text" [(ngModel)]="formData.name"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-600 mb-1">من (ك.و.س)</label>
                <input type="number" [(ngModel)]="formData.fromUnit"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">إلى (ك.و.س)</label>
                <input type="number" [(ngModel)]="formData.toUnit"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-600 mb-1">السعر (ريال)</label>
                <input type="number" [(ngModel)]="formData.rate" step="0.0001"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">الرسوم الثابتة</label>
                <input type="number" [(ngModel)]="formData.fixedCharge" step="0.01"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-600 mb-1">تاريخ البداية</label>
                <input type="date" [(ngModel)]="formData.effectiveFrom"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">تاريخ النهاية</label>
                <input type="date" [(ngModel)]="formData.effectiveTo"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="formData.isActive" id="isActive">
              <label for="isActive" class="text-sm text-gray-600">نشط</label>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button (click)="showForm = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            <button (click)="saveTariff()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">التصنيف</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">النطاق</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">السعر</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الرسوم الثابتة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الفترة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let tariff of tariffs" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">{{ tariff.category?.name }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ tariff.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ tariff.fromUnit }} - {{ tariff.toUnit || '∞' }}</td>
              <td class="px-4 py-3 text-sm text-blue-600 font-medium">{{ tariff.rate | number:'1.4-4' }} ريال</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ tariff.fixedCharge | number:'1.2-2' }} ريال</td>
              <td class="px-4 py-3 text-sm text-gray-500">
                {{ tariff.effectiveFrom | date:'yyyy-MM-dd' }}
                <span *ngIf="tariff.effectiveTo"> - {{ tariff.effectiveTo | date:'yyyy-MM-dd' }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="tariff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
                  {{ tariff.isActive ? 'نشط' : 'غير نشط' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button (click)="editTariff(tariff)" class="p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <i class="pi pi-pencil"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TariffsComponent implements OnInit {
  private api = inject(ApiService);
  private customersService = inject(CustomersService);
  
  tariffs: Tariff[] = [];
  categories: CustomerCategory[] = [];
  showForm = false;
  editingTariff: Tariff | null = null;
  formData: any = {};

  ngOnInit() {
    this.loadTariffs();
    this.loadCategories();
  }

  loadTariffs() {
    this.api.get<any>('/tariffs').subscribe({
      next: (response) => {
        this.tariffs = response.data;
      }
    });
  }

  loadCategories() {
    this.customersService.getCategories({ isActive: true }).subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  resetForm() {
    this.formData = { 
      categoryId: '', name: '', fromUnit: 0, toUnit: null, 
      rate: 0, fixedCharge: 0, effectiveFrom: '', effectiveTo: '', isActive: true 
    };
  }

  editTariff(tariff: Tariff) {
    this.editingTariff = tariff;
    this.formData = { ...tariff };
    this.showForm = true;
  }

  saveTariff() {
    const request = this.editingTariff
      ? this.api.put(`/tariffs/${this.editingTariff.id}`, this.formData)
      : this.api.post('/tariffs', this.formData);
    
    request.subscribe({
      next: () => {
        this.showForm = false;
        this.loadTariffs();
      }
    });
  }
}
