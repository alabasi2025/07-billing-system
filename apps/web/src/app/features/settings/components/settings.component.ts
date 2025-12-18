import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">الإعدادات</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a routerLink="/settings/categories" 
           class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="pi pi-tags text-2xl text-blue-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">تصنيفات العملاء</h3>
              <p class="text-sm text-gray-500">إدارة تصنيفات العملاء</p>
            </div>
          </div>
        </a>
        
        <a routerLink="/settings/tariffs" 
           class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i class="pi pi-percentage text-2xl text-green-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">شرائح التعرفة</h3>
              <p class="text-sm text-gray-500">إدارة أسعار الكهرباء</p>
            </div>
          </div>
        </a>
        
        <a routerLink="/settings/meter-types" 
           class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <i class="pi pi-gauge text-2xl text-yellow-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">أنواع العدادات</h3>
              <p class="text-sm text-gray-500">إدارة أنواع العدادات</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  `
})
export class SettingsComponent {}
