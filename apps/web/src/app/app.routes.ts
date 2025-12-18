import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'لوحة التحكم'
      },
      // Customers
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/components/customer-list.component').then(m => m.CustomerListComponent),
        title: 'العملاء'
      },
      {
        path: 'customers/new',
        loadComponent: () => import('./features/customers/components/customer-form.component').then(m => m.CustomerFormComponent),
        title: 'إضافة عميل'
      },
      {
        path: 'customers/:id',
        loadComponent: () => import('./features/customers/components/customer-detail.component').then(m => m.CustomerDetailComponent),
        title: 'تفاصيل العميل'
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () => import('./features/customers/components/customer-form.component').then(m => m.CustomerFormComponent),
        title: 'تعديل العميل'
      },
      // Meters
      {
        path: 'meters',
        loadComponent: () => import('./features/meters/components/meter-list.component').then(m => m.MeterListComponent),
        title: 'العدادات'
      },
      {
        path: 'meters/new',
        loadComponent: () => import('./features/meters/components/meter-form.component').then(m => m.MeterFormComponent),
        title: 'إضافة عداد'
      },
      {
        path: 'meters/:id',
        loadComponent: () => import('./features/meters/components/meter-detail.component').then(m => m.MeterDetailComponent),
        title: 'تفاصيل العداد'
      },
      // Readings
      {
        path: 'readings',
        loadComponent: () => import('./features/meters/components/reading-list.component').then(m => m.ReadingListComponent),
        title: 'القراءات'
      },
      {
        path: 'readings/new',
        loadComponent: () => import('./features/meters/components/reading-form.component').then(m => m.ReadingFormComponent),
        title: 'تسجيل قراءة'
      },
      // Invoices
      {
        path: 'invoices',
        loadComponent: () => import('./features/invoices/components/invoice-list.component').then(m => m.InvoiceListComponent),
        title: 'الفواتير'
      },
      {
        path: 'invoices/generate',
        loadComponent: () => import('./features/invoices/components/invoice-generate.component').then(m => m.InvoiceGenerateComponent),
        title: 'إصدار فاتورة'
      },
      {
        path: 'invoices/:id',
        loadComponent: () => import('./features/invoices/components/invoice-detail.component').then(m => m.InvoiceDetailComponent),
        title: 'تفاصيل الفاتورة'
      },
      // Payments
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/components/payment-list.component').then(m => m.PaymentListComponent),
        title: 'المدفوعات'
      },
      {
        path: 'payments/new',
        loadComponent: () => import('./features/payments/components/payment-form.component').then(m => m.PaymentFormComponent),
        title: 'تسجيل دفعة'
      },
      // Reports
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/components/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
        title: 'التقارير'
      },
      // POS
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.POSComponent),
        title: 'نقاط البيع'
      },
      // Settings
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/components/settings.component').then(m => m.SettingsComponent),
        title: 'الإعدادات'
      },
      {
        path: 'settings/categories',
        loadComponent: () => import('./features/settings/components/categories.component').then(m => m.CategoriesComponent),
        title: 'تصنيفات العملاء'
      },
      {
        path: 'settings/tariffs',
        loadComponent: () => import('./features/settings/components/tariffs.component').then(m => m.TariffsComponent),
        title: 'شرائح التعرفة'
      },
      {
        path: 'settings/meter-types',
        loadComponent: () => import('./features/settings/components/meter-types.component').then(m => m.MeterTypesComponent),
        title: 'أنواع العدادات'
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
