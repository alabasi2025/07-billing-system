import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportsService } from '../reports/services/reports.service';
import { InvoicesService } from '../invoices/services/invoices.service';
import { PaymentsService } from '../payments/services/payments.service';
import { DashboardStats, Invoice, Payment } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <!-- Total Customers -->
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">إجمالي العملاء</p>
              <p class="stat-value">{{ stats?.totalCustomers || 0 }}</p>
              <p class="stat-sub green">
                <span class="bold">{{ stats?.activeCustomers || 0 }}</span> نشط
              </p>
            </div>
            <div class="stat-icon blue">
              <i class="pi pi-users"></i>
            </div>
          </div>
        </div>

        <!-- Total Meters -->
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">إجمالي العدادات</p>
              <p class="stat-value">{{ stats?.totalMeters || 0 }}</p>
              <p class="stat-sub green">
                <span class="bold">{{ stats?.activeMeters || 0 }}</span> نشط
              </p>
            </div>
            <div class="stat-icon green">
              <i class="pi pi-gauge"></i>
            </div>
          </div>
        </div>

        <!-- Pending Invoices -->
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">الفواتير المعلقة</p>
              <p class="stat-value">{{ stats?.pendingInvoices || 0 }}</p>
              <p class="stat-sub red">
                <span class="bold">{{ stats?.overdueInvoices || 0 }}</span> متأخرة
              </p>
            </div>
            <div class="stat-icon yellow">
              <i class="pi pi-file-edit"></i>
            </div>
          </div>
        </div>

        <!-- Total Revenue -->
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">إجمالي الإيرادات</p>
              <p class="stat-value">{{ formatCurrency(stats?.totalRevenue || 0) }}</p>
              <p class="stat-sub blue">
                محصل: <span class="bold">{{ formatCurrency(stats?.totalCollected || 0) }}</span>
              </p>
            </div>
            <div class="stat-icon purple">
              <i class="pi pi-wallet"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h3 class="card-title">الإجراءات السريعة</h3>
        <div class="actions-grid">
          <a routerLink="/customers/new" class="action-btn blue">
            <i class="pi pi-user-plus"></i>
            <span>إضافة عميل</span>
          </a>
          <a routerLink="/readings/new" class="action-btn green">
            <i class="pi pi-plus-circle"></i>
            <span>تسجيل قراءة</span>
          </a>
          <a routerLink="/invoices/generate" class="action-btn yellow">
            <i class="pi pi-file-edit"></i>
            <span>إصدار فاتورة</span>
          </a>
          <a routerLink="/payments/new" class="action-btn purple">
            <i class="pi pi-credit-card"></i>
            <span>تسجيل دفعة</span>
          </a>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-grid">
        <!-- Recent Invoices -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">أحدث الفواتير</h3>
            <a routerLink="/invoices" class="view-all">عرض الكل</a>
          </div>
          <div class="list" *ngIf="!loadingInvoices && recentInvoices.length > 0">
            <div class="list-item" *ngFor="let invoice of recentInvoices">
              <div class="item-info">
                <p class="item-title">{{ invoice.invoiceNo }}</p>
                <p class="item-sub">{{ invoice.customer?.name || 'غير محدد' }}</p>
              </div>
              <div class="item-value">
                <p class="amount">{{ formatCurrency(invoice.totalAmount) }}</p>
                <span class="badge" [class]="getInvoiceStatusClass(invoice.status)">
                  {{ getInvoiceStatusLabel(invoice.status) }}
                </span>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="!loadingInvoices && recentInvoices.length === 0">
            <p>لا توجد فواتير حديثة</p>
          </div>
          <div class="loading-state" *ngIf="loadingInvoices">
            <i class="pi pi-spin pi-spinner"></i>
            <p>جاري التحميل...</p>
          </div>
        </div>

        <!-- Recent Payments -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">أحدث المدفوعات</h3>
            <a routerLink="/payments" class="view-all">عرض الكل</a>
          </div>
          <div class="list" *ngIf="!loadingPayments && recentPayments.length > 0">
            <div class="list-item" *ngFor="let payment of recentPayments">
              <div class="item-info">
                <p class="item-title">{{ payment.paymentNo }}</p>
                <p class="item-sub">{{ getPaymentMethodLabel(payment.paymentMethod) }}</p>
              </div>
              <div class="item-value">
                <p class="amount green">{{ formatCurrency(payment.amount) }}</p>
                <p class="date">{{ formatDate(payment.paymentDate) }}</p>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="!loadingPayments && recentPayments.length === 0">
            <p>لا توجد مدفوعات حديثة</p>
          </div>
          <div class="loading-state" *ngIf="loadingPayments">
            <i class="pi pi-spin pi-spinner"></i>
            <p>جاري التحميل...</p>
          </div>
        </div>
      </div>

      <!-- Alerts Section -->
      <div class="card" *ngIf="stats?.overdueInvoices || stats?.openComplaints">
        <h3 class="card-title">التنبيهات</h3>
        <div class="alerts">
          <div class="alert alert-red" *ngIf="stats?.overdueInvoices">
            <i class="pi pi-exclamation-triangle"></i>
            <span>يوجد {{ stats?.overdueInvoices }} فاتورة متأخرة تحتاج للمتابعة</span>
          </div>
          <div class="alert alert-yellow" *ngIf="stats?.openComplaints">
            <i class="pi pi-info-circle"></i>
            <span>يوجد {{ stats?.openComplaints }} شكوى مفتوحة تحتاج للرد</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
    
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .stat-label {
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 8px 0;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .stat-sub {
      font-size: 13px;
      margin: 0;
    }
    
    .stat-sub.green { color: #10b981; }
    .stat-sub.red { color: #ef4444; }
    .stat-sub.blue { color: #3b82f6; }
    
    .bold { font-weight: 600; }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-icon i {
      font-size: 24px;
    }
    
    .stat-icon.blue { background: #dbeafe; }
    .stat-icon.blue i { color: #3b82f6; }
    .stat-icon.green { background: #d1fae5; }
    .stat-icon.green i { color: #10b981; }
    .stat-icon.yellow { background: #fef3c7; }
    .stat-icon.yellow i { color: #f59e0b; }
    .stat-icon.purple { background: #ede9fe; }
    .stat-icon.purple i { color: #8b5cf6; }
    
    /* Card Styles */
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 16px 0;
    }
    
    .card-header .card-title {
      margin: 0;
    }
    
    .view-all {
      color: #3b82f6;
      font-size: 14px;
      text-decoration: none;
    }
    
    .view-all:hover {
      text-decoration: underline;
    }
    
    /* Actions Grid */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    @media (max-width: 768px) {
      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.3s;
    }
    
    .action-btn i {
      font-size: 32px;
      margin-bottom: 12px;
    }
    
    .action-btn span {
      color: #374151;
      font-size: 14px;
    }
    
    .action-btn.blue { background: #eff6ff; }
    .action-btn.blue:hover { background: #dbeafe; }
    .action-btn.blue i { color: #3b82f6; }
    
    .action-btn.green { background: #ecfdf5; }
    .action-btn.green:hover { background: #d1fae5; }
    .action-btn.green i { color: #10b981; }
    
    .action-btn.yellow { background: #fffbeb; }
    .action-btn.yellow:hover { background: #fef3c7; }
    .action-btn.yellow i { color: #f59e0b; }
    
    .action-btn.purple { background: #f5f3ff; }
    .action-btn.purple:hover { background: #ede9fe; }
    .action-btn.purple i { color: #8b5cf6; }
    
    /* Activity Grid */
    .activity-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    
    @media (max-width: 1024px) {
      .activity-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* List Styles */
    .list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .item-title {
      font-weight: 500;
      color: #1f2937;
      margin: 0 0 4px 0;
    }
    
    .item-sub {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    
    .item-value {
      text-align: left;
    }
    
    .amount {
      font-weight: 500;
      color: #1f2937;
      margin: 0 0 4px 0;
    }
    
    .amount.green {
      color: #10b981;
    }
    
    .date {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
    }
    
    .badge-green {
      background: #d1fae5;
      color: #047857;
    }
    
    .badge-yellow {
      background: #fef3c7;
      color: #b45309;
    }
    
    .badge-red {
      background: #fee2e2;
      color: #b91c1c;
    }
    
    .badge-gray {
      background: #f3f4f6;
      color: #6b7280;
    }
    
    /* Empty & Loading States */
    .empty-state, .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: #6b7280;
    }
    
    .loading-state i {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    /* Alerts */
    .alerts {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
    }
    
    .alert-red {
      background: #fef2f2;
    }
    
    .alert-red i {
      color: #ef4444;
    }
    
    .alert-red span {
      color: #b91c1c;
    }
    
    .alert-yellow {
      background: #fffbeb;
    }
    
    .alert-yellow i {
      color: #f59e0b;
    }
    
    .alert-yellow span {
      color: #b45309;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private invoicesService = inject(InvoicesService);
  private paymentsService = inject(PaymentsService);
  
  stats: DashboardStats | null = null;
  recentInvoices: Invoice[] = [];
  recentPayments: Payment[] = [];
  loadingInvoices = true;
  loadingPayments = true;

  ngOnInit() {
    this.loadStats();
    this.loadRecentInvoices();
    this.loadRecentPayments();
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

  loadRecentInvoices() {
    this.loadingInvoices = true;
    this.invoicesService.getInvoices({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        this.recentInvoices = response.data || [];
        this.loadingInvoices = false;
      },
      error: (err) => {
        console.error('Error loading recent invoices:', err);
        this.loadingInvoices = false;
      }
    });
  }

  loadRecentPayments() {
    this.loadingPayments = true;
    this.paymentsService.getPayments({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        this.recentPayments = response.data || [];
        this.loadingPayments = false;
      },
      error: (err) => {
        console.error('Error loading recent payments:', err);
        this.loadingPayments = false;
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

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  getInvoiceStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-green';
      case 'issued': return 'badge-yellow';
      case 'overdue': return 'badge-red';
      case 'cancelled': return 'badge-gray';
      default: return 'badge-yellow';
    }
  }

  getInvoiceStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'issued': return 'معلقة';
      case 'overdue': return 'متأخرة';
      case 'cancelled': return 'ملغاة';
      case 'partial': return 'مدفوعة جزئياً';
      default: return status;
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'bank': return 'تحويل بنكي';
      case 'card': return 'بطاقة';
      case 'online': return 'إلكتروني';
      default: return method;
    }
  }
}
