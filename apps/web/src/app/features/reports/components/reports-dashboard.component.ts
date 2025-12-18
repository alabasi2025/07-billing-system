import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">التقارير</h1>
      </div>

      <!-- Report Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Revenue Report -->
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" (click)="showReport('revenue')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i class="pi pi-chart-line text-2xl text-green-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">تقرير الإيرادات</h3>
              <p class="text-sm text-gray-500">تحليل الإيرادات والتحصيل</p>
            </div>
          </div>
        </div>

        <!-- Customer Report -->
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" (click)="showReport('customers')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="pi pi-users text-2xl text-blue-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">تقرير العملاء</h3>
              <p class="text-sm text-gray-500">إحصائيات العملاء والتصنيفات</p>
            </div>
          </div>
        </div>

        <!-- Consumption Report -->
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" (click)="showReport('consumption')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <i class="pi pi-bolt text-2xl text-yellow-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">تقرير الاستهلاك</h3>
              <p class="text-sm text-gray-500">تحليل استهلاك الكهرباء</p>
            </div>
          </div>
        </div>

        <!-- Outstanding Report -->
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" (click)="showReport('outstanding')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <i class="pi pi-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">تقرير المديونية</h3>
              <p class="text-sm text-gray-500">المبالغ المستحقة والمتأخرات</p>
            </div>
          </div>
        </div>

        <!-- Meter Report -->
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" (click)="showReport('meters')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <i class="pi pi-gauge text-2xl text-purple-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">تقرير العدادات</h3>
              <p class="text-sm text-gray-500">إحصائيات العدادات والأنواع</p>
            </div>
          </div>
        </div>

        <!-- Complaint Report -->
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" (click)="showReport('complaints')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <i class="pi pi-comment text-2xl text-orange-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">تقرير الشكاوى</h3>
              <p class="text-sm text-gray-500">تحليل الشكاوى والاستجابة</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Content -->
      <div *ngIf="activeReport" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-800">{{ getReportTitle(activeReport) }}</h2>
          <button (click)="activeReport = null" class="text-gray-500 hover:text-gray-700">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Revenue Report -->
        <div *ngIf="activeReport === 'revenue' && revenueData">
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ formatCurrency(revenueData.totalRevenue) }}</p>
              <p class="text-gray-600">إجمالي الإيرادات</p>
            </div>
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(revenueData.totalCollected) }}</p>
              <p class="text-gray-600">المحصل</p>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ formatCurrency(revenueData.totalOutstanding) }}</p>
              <p class="text-gray-600">المستحق</p>
            </div>
          </div>
        </div>

        <!-- Customer Report -->
        <div *ngIf="activeReport === 'customers' && customerData">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <p class="text-2xl font-bold text-blue-600">{{ customerData.totalCustomers }}</p>
              <p class="text-gray-600">إجمالي العملاء</p>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ customerData.newCustomers }}</p>
              <p class="text-gray-600">عملاء جدد</p>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ customerData.disconnectedCustomers }}</p>
              <p class="text-gray-600">مفصولين</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-700 mb-3">حسب التصنيف</h4>
              <div class="space-y-2">
                <div *ngFor="let item of customerData.byCategory" class="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{{ item.category }}</span>
                  <span class="font-medium">{{ item.count }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-gray-700 mb-3">حسب الحالة</h4>
              <div class="space-y-2">
                <div *ngFor="let item of customerData.byStatus" class="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{{ getStatusLabel(item.status) }}</span>
                  <span class="font-medium">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Outstanding Report -->
        <div *ngIf="activeReport === 'outstanding' && outstandingData">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="text-center p-4 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ formatCurrency(outstandingData.totalOutstanding) }}</p>
              <p class="text-gray-600">إجمالي المستحق</p>
            </div>
            <div class="text-center p-4 bg-orange-50 rounded-lg">
              <p class="text-2xl font-bold text-orange-600">{{ formatCurrency(outstandingData.overdueAmount) }}</p>
              <p class="text-gray-600">المتأخرات</p>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-gray-700 mb-3">تقادم المديونية</h4>
            <div class="grid grid-cols-5 gap-2">
              <div class="text-center p-3 bg-green-50 rounded">
                <p class="font-bold text-green-600">{{ formatCurrency(outstandingData.aging?.current || 0) }}</p>
                <p class="text-xs text-gray-500">حالي</p>
              </div>
              <div class="text-center p-3 bg-yellow-50 rounded">
                <p class="font-bold text-yellow-600">{{ formatCurrency(outstandingData.aging?.days30 || 0) }}</p>
                <p class="text-xs text-gray-500">30 يوم</p>
              </div>
              <div class="text-center p-3 bg-orange-50 rounded">
                <p class="font-bold text-orange-600">{{ formatCurrency(outstandingData.aging?.days60 || 0) }}</p>
                <p class="text-xs text-gray-500">60 يوم</p>
              </div>
              <div class="text-center p-3 bg-red-50 rounded">
                <p class="font-bold text-red-600">{{ formatCurrency(outstandingData.aging?.days90 || 0) }}</p>
                <p class="text-xs text-gray-500">90 يوم</p>
              </div>
              <div class="text-center p-3 bg-red-100 rounded">
                <p class="font-bold text-red-700">{{ formatCurrency(outstandingData.aging?.over90 || 0) }}</p>
                <p class="text-xs text-gray-500">+90 يوم</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
          <p class="text-gray-500 mt-2">جاري التحميل...</p>
        </div>
      </div>
    </div>
  `
})
export class ReportsDashboardComponent {
  private reportsService = inject(ReportsService);
  
  activeReport: string | null = null;
  loading = false;
  
  revenueData: any = null;
  customerData: any = null;
  outstandingData: any = null;

  showReport(type: string) {
    this.activeReport = type;
    this.loading = true;
    
    switch (type) {
      case 'revenue':
        this.reportsService.getRevenueReport().subscribe({
          next: (response) => {
            if (response.success) this.revenueData = response.data;
            this.loading = false;
          }
        });
        break;
      case 'customers':
        this.reportsService.getCustomerReport().subscribe({
          next: (response) => {
            if (response.success) this.customerData = response.data;
            this.loading = false;
          }
        });
        break;
      case 'outstanding':
        this.reportsService.getOutstandingReport().subscribe({
          next: (response) => {
            if (response.success) this.outstandingData = response.data;
            this.loading = false;
          }
        });
        break;
      default:
        this.loading = false;
    }
  }

  getReportTitle(type: string): string {
    const titles: Record<string, string> = {
      revenue: 'تقرير الإيرادات',
      customers: 'تقرير العملاء',
      consumption: 'تقرير الاستهلاك',
      outstanding: 'تقرير المديونية',
      meters: 'تقرير العدادات',
      complaints: 'تقرير الشكاوى',
    };
    return titles[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      suspended: 'موقوف',
      disconnected: 'مفصول',
      closed: 'مغلق',
    };
    return labels[status] || status;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(value || 0);
  }
}
