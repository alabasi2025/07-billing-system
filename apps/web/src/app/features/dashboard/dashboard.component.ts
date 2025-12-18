import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportsService } from '../reports/services/reports.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Customers -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">إجمالي العملاء</p>
              <p class="text-3xl font-bold text-gray-800">{{ stats?.totalCustomers || 0 }}</p>
              <p class="text-green-600 text-sm mt-1">
                <span class="font-medium">{{ stats?.activeCustomers || 0 }}</span> نشط
              </p>
            </div>
            <div class="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="pi pi-users text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <!-- Total Meters -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">إجمالي العدادات</p>
              <p class="text-3xl font-bold text-gray-800">{{ stats?.totalMeters || 0 }}</p>
              <p class="text-green-600 text-sm mt-1">
                <span class="font-medium">{{ stats?.activeMeters || 0 }}</span> نشط
              </p>
            </div>
            <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <i class="pi pi-gauge text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <!-- Pending Invoices -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">الفواتير المعلقة</p>
              <p class="text-3xl font-bold text-gray-800">{{ stats?.pendingInvoices || 0 }}</p>
              <p class="text-red-600 text-sm mt-1">
                <span class="font-medium">{{ stats?.overdueInvoices || 0 }}</span> متأخرة
              </p>
            </div>
            <div class="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
              <i class="pi pi-file-edit text-2xl text-yellow-600"></i>
            </div>
          </div>
        </div>

        <!-- Total Revenue -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">إجمالي الإيرادات</p>
              <p class="text-3xl font-bold text-gray-800">{{ formatCurrency(stats?.totalRevenue || 0) }}</p>
              <p class="text-blue-600 text-sm mt-1">
                محصل: <span class="font-medium">{{ formatCurrency(stats?.totalCollected || 0) }}</span>
              </p>
            </div>
            <div class="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <i class="pi pi-wallet text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">الإجراءات السريعة</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a routerLink="/customers/new" 
             class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <i class="pi pi-user-plus text-3xl text-blue-600 mb-2"></i>
            <span class="text-gray-700">إضافة عميل</span>
          </a>
          <a routerLink="/readings/new"
             class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <i class="pi pi-plus-circle text-3xl text-green-600 mb-2"></i>
            <span class="text-gray-700">تسجيل قراءة</span>
          </a>
          <a routerLink="/invoices/generate"
             class="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <i class="pi pi-file-edit text-3xl text-yellow-600 mb-2"></i>
            <span class="text-gray-700">إصدار فاتورة</span>
          </a>
          <a routerLink="/payments/new"
             class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <i class="pi pi-credit-card text-3xl text-purple-600 mb-2"></i>
            <span class="text-gray-700">تسجيل دفعة</span>
          </a>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Invoices -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">أحدث الفواتير</h3>
            <a routerLink="/invoices" class="text-blue-600 hover:underline text-sm">عرض الكل</a>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg" *ngFor="let i of [1,2,3,4,5]">
              <div>
                <p class="font-medium text-gray-800">INV-2024-00{{ i }}</p>
                <p class="text-sm text-gray-500">أحمد محمد</p>
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-800">{{ formatCurrency(250 * i) }}</p>
                <span class="text-xs px-2 py-1 rounded-full" 
                      [class]="i % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                  {{ i % 2 === 0 ? 'مدفوعة' : 'معلقة' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Payments -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">أحدث المدفوعات</h3>
            <a routerLink="/payments" class="text-blue-600 hover:underline text-sm">عرض الكل</a>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg" *ngFor="let i of [1,2,3,4,5]">
              <div>
                <p class="font-medium text-gray-800">PAY-2024-00{{ i }}</p>
                <p class="text-sm text-gray-500">{{ i % 2 === 0 ? 'نقدي' : 'تحويل بنكي' }}</p>
              </div>
              <div class="text-left">
                <p class="font-medium text-green-600">{{ formatCurrency(300 * i) }}</p>
                <p class="text-xs text-gray-500">{{ getDate(i) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts Section -->
      <div class="bg-white rounded-lg shadow p-6" *ngIf="stats?.overdueInvoices || stats?.openComplaints">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">التنبيهات</h3>
        <div class="space-y-3">
          <div class="flex items-center p-3 bg-red-50 rounded-lg" *ngIf="stats?.overdueInvoices">
            <i class="pi pi-exclamation-triangle text-red-600 ml-3"></i>
            <span class="text-red-700">يوجد {{ stats?.overdueInvoices }} فاتورة متأخرة تحتاج للمتابعة</span>
          </div>
          <div class="flex items-center p-3 bg-yellow-50 rounded-lg" *ngIf="stats?.openComplaints">
            <i class="pi pi-info-circle text-yellow-600 ml-3"></i>
            <span class="text-yellow-700">يوجد {{ stats?.openComplaints }} شكوى مفتوحة تحتاج للرد</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private reportsService = inject(ReportsService);
  stats: DashboardStats | null = null;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.reportsService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(value);
  }

  getDate(offset: number): string {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toLocaleDateString('ar-SA');
  }
}
