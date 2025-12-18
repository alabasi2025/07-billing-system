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
    <div class="app-container" dir="rtl">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">
            <i class="pi pi-bolt logo-icon"></i>
            نظام فوترة الكهرباء
          </h1>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <i class="pi pi-home"></i>
            <span>لوحة التحكم</span>
          </a>
          <a routerLink="/customers" routerLinkActive="active" class="nav-link">
            <i class="pi pi-users"></i>
            <span>العملاء</span>
          </a>
          <a routerLink="/meters" routerLinkActive="active" class="nav-link">
            <i class="pi pi-gauge"></i>
            <span>العدادات</span>
          </a>
          <a routerLink="/readings" routerLinkActive="active" class="nav-link">
            <i class="pi pi-chart-line"></i>
            <span>القراءات</span>
          </a>
          <a routerLink="/invoices" routerLinkActive="active" class="nav-link">
            <i class="pi pi-file-edit"></i>
            <span>الفواتير</span>
          </a>
          <a routerLink="/payments" routerLinkActive="active" class="nav-link">
            <i class="pi pi-wallet"></i>
            <span>المدفوعات</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-link">
            <i class="pi pi-chart-bar"></i>
            <span>التقارير</span>
          </a>
          <a routerLink="/pos" routerLinkActive="active" class="nav-link">
            <i class="pi pi-shopping-cart"></i>
            <span>نقاط البيع</span>
          </a>
          <a routerLink="/pos-terminals" routerLinkActive="active" class="nav-link">
            <i class="pi pi-desktop"></i>
            <span>إدارة نقاط البيع</span>
          </a>
          <a routerLink="/debts" routerLinkActive="active" class="nav-link">
            <i class="pi pi-exclamation-triangle"></i>
            <span>إدارة الديون</span>
          </a>
          <a routerLink="/payment-plans" routerLinkActive="active" class="nav-link">
            <i class="pi pi-calendar"></i>
            <span>خطط السداد</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-link">
            <i class="pi pi-cog"></i>
            <span>الإعدادات</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Header -->
        <header class="main-header">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <div class="header-actions">
            <button class="notification-btn">
              <i class="pi pi-bell"></i>
            </button>
            <div class="user-info">
              <span class="user-name">مدير النظام</span>
              <div class="user-avatar">م</div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .app-container {
      min-height: 100vh;
      background-color: #f5f5f5;
      direction: rtl;
    }
    
    /* Sidebar Styles */
    .sidebar {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 256px;
      background: linear-gradient(180deg, #1e3a5f 0%, #0d2137 100%);
      color: white;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      z-index: 1000;
      overflow-y: auto;
    }
    
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .logo {
      font-size: 18px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
    }
    
    .logo-icon {
      color: #fbbf24;
      font-size: 24px;
    }
    
    .sidebar-nav {
      padding: 10px 0;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.3s ease;
      border-right: 3px solid transparent;
    }
    
    .nav-link:hover {
      background-color: rgba(255,255,255,0.1);
      color: white;
    }
    
    .nav-link.active {
      background-color: rgba(255,255,255,0.15);
      color: white;
      border-right-color: #3b82f6;
    }
    
    .nav-link i {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }
    
    /* Main Content Styles */
    .main-content {
      margin-right: 256px;
      min-height: 100vh;
    }
    
    .main-header {
      background: white;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .notification-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: #f3f4f6;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s;
    }
    
    .notification-btn:hover {
      background: #e5e7eb;
    }
    
    .notification-btn i {
      color: #6b7280;
      font-size: 18px;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .user-name {
      color: #374151;
      font-weight: 500;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    
    .page-content {
      padding: 24px;
    }
  `]
})
export class MainLayoutComponent {
  pageTitle = 'لوحة التحكم';
}
