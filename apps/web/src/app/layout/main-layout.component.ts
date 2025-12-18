import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast position="top-left" />
    <div class="min-h-screen bg-gray-100" dir="rtl">
      <!-- Sidebar -->
      <aside class="fixed inset-y-0 right-0 w-64 bg-blue-900 text-white shadow-lg z-50">
        <div class="p-4 border-b border-blue-800">
          <h1 class="text-xl font-bold flex items-center gap-2">
            <i class="pi pi-bolt text-yellow-400"></i>
            نظام فوترة الكهرباء
          </h1>
        </div>
        <nav class="mt-4">
          <a routerLink="/dashboard" routerLinkActive="bg-blue-800" 
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-home ml-3"></i>
            <span>لوحة التحكم</span>
          </a>
          <a routerLink="/customers" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-users ml-3"></i>
            <span>العملاء</span>
          </a>
          <a routerLink="/meters" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-gauge ml-3"></i>
            <span>العدادات</span>
          </a>
          <a routerLink="/readings" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-chart-line ml-3"></i>
            <span>القراءات</span>
          </a>
          <a routerLink="/invoices" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-file-edit ml-3"></i>
            <span>الفواتير</span>
          </a>
          <a routerLink="/payments" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-wallet ml-3"></i>
            <span>المدفوعات</span>
          </a>
          <a routerLink="/reports" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-chart-bar ml-3"></i>
            <span>التقارير</span>
          </a>
          <a routerLink="/pos" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-shopping-cart ml-3"></i>
            <span>نقاط البيع</span>
          </a>
          <a routerLink="/pos-terminals" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-desktop ml-3"></i>
            <span>إدارة نقاط البيع</span>
          </a>
          <a routerLink="/debts" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-exclamation-triangle ml-3"></i>
            <span>إدارة الديون</span>
          </a>
          <a routerLink="/payment-plans" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-calendar ml-3"></i>
            <span>خطط السداد</span>
          </a>
          <a routerLink="/settings" routerLinkActive="bg-blue-800"
             class="flex items-center px-4 py-3 hover:bg-blue-800 transition-colors">
            <i class="pi pi-cog ml-3"></i>
            <span>الإعدادات</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="mr-64 min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm sticky top-0 z-40">
          <div class="px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-800">{{ pageTitle }}</h2>
            <div class="flex items-center gap-4">
              <button class="p-2 hover:bg-gray-100 rounded-full">
                <i class="pi pi-bell text-gray-600"></i>
              </button>
              <div class="flex items-center gap-2">
                <span class="text-gray-700">مدير النظام</span>
                <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  م
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="p-6">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainLayoutComponent {
  pageTitle = 'لوحة التحكم';
}
