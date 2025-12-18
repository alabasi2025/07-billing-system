import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../customers/services/customers.service';
import { CustomerCategory } from '../../../core/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/settings" class="p-2 hover:bg-gray-100 rounded-lg">
            <i class="pi pi-arrow-right text-gray-600"></i>
          </a>
          <h1 class="text-2xl font-bold text-gray-800">تصنيفات العملاء</h1>
        </div>
        <button (click)="showForm = true; editingCategory = null; resetForm()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <i class="pi pi-plus"></i>
          <span>إضافة تصنيف</span>
        </button>
      </div>

      <!-- Form Modal -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">{{ editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد' }}</h2>
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
            <div class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="formData.isActive" id="isActive">
              <label for="isActive" class="text-sm text-gray-600">نشط</label>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button (click)="showForm = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            <button (click)="saveCategory()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
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
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let cat of categories" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium">{{ cat.code }}</td>
              <td class="px-4 py-3 text-sm">{{ cat.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ cat.description }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
                  {{ cat.isActive ? 'نشط' : 'غير نشط' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button (click)="editCategory(cat)" class="p-1 text-blue-600 hover:bg-blue-50 rounded">
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
export class CategoriesComponent implements OnInit {
  private customersService = inject(CustomersService);
  
  categories: CustomerCategory[] = [];
  showForm = false;
  editingCategory: CustomerCategory | null = null;
  formData = { code: '', name: '', description: '', isActive: true };

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.customersService.getCategories({}).subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  resetForm() {
    this.formData = { code: '', name: '', description: '', isActive: true };
  }

  editCategory(cat: CustomerCategory) {
    this.editingCategory = cat;
    this.formData = { code: cat.code, name: cat.name, description: cat.description || '', isActive: cat.isActive };
    this.showForm = true;
  }

  saveCategory() {
    const request = this.editingCategory
      ? this.customersService.updateCategory(this.editingCategory.id, this.formData)
      : this.customersService.createCategory(this.formData);
    
    request.subscribe({
      next: () => {
        this.showForm = false;
        this.loadCategories();
      }
    });
  }
}
