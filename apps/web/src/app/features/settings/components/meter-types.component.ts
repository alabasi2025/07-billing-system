import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetersService } from '../../meters/services/meters.service';
import { MeterType } from '../../../core/models';

@Component({
  selector: 'app-meter-types',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/settings" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">أنواع العدادات</h1>
        </div>
        <button (click)="showForm = true; editingType = null; resetForm()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>إضافة نوع</span>
        </button>
      </div>

      <!-- Form Modal -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">{{ editingType ? 'تعديل النوع' : 'إضافة نوع جديد' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">الكود</label>
              <input type="text" [(ngModel)]="formData.code"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الاسم</label>
              <input type="text" [(ngModel)]="formData.name"
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">الوصف</label>
              <textarea [(ngModel)]="formData.description" rows="2"
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-600 mb-1">الحد الأقصى للقراءة</label>
                <input type="number" [(ngModel)]="formData.maxReading"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-1">عدد الخانات</label>
                <input type="number" [(ngModel)]="formData.digits"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="formData.isSmartMeter" id="isSmartMeter">
                <label for="isSmartMeter" class="text-sm text-gray-600">عداد ذكي</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="formData.isActive" id="isActive">
                <label for="isActive" class="text-sm text-gray-600">نشط</label>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button (click)="showForm = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            <button (click)="saveType()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الكود</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الوصف</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحد الأقصى</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">عداد ذكي</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let type of meterTypes" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium">{{ type.code }}</td>
              <td class="px-4 py-3 text-sm">{{ type.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ type.description }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ type.maxReading | number }}</td>
              <td class="px-4 py-3">
                <i *ngIf="type.isSmartMeter" class="pi pi-wifi text-green-600"></i>
                <i *ngIf="!type.isSmartMeter" class="pi pi-times text-gray-400"></i>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
                  {{ type.isActive ? 'نشط' : 'غير نشط' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button (click)="editType(type)" class="p-1 text-blue-600 hover:bg-blue-50 rounded">
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
export class MeterTypesComponent implements OnInit {
  private metersService = inject(MetersService);
  
  meterTypes: MeterType[] = [];
  showForm = false;
  editingType: MeterType | null = null;
  formData: any = {};

  ngOnInit() {
    this.loadMeterTypes();
  }

  loadMeterTypes() {
    this.metersService.getMeterTypes({}).subscribe({
      next: (response) => {
        this.meterTypes = response.data;
      }
    });
  }

  resetForm() {
    this.formData = { code: '', name: '', description: '', maxReading: 999999, digits: 6, isSmartMeter: false, isActive: true };
  }

  editType(type: MeterType) {
    this.editingType = type;
    this.formData = { ...type };
    this.showForm = true;
  }

  saveType() {
    const request = this.editingType
      ? this.metersService.updateMeterType(this.editingType.id, this.formData)
      : this.metersService.createMeterType(this.formData);
    
    request.subscribe({
      next: () => {
        this.showForm = false;
        this.loadMeterTypes();
      }
    });
  }
}
