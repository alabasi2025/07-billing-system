import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';

interface Debt {
  id: string;
  customerId: string;
  debtType: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  penaltyAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    TagModule,
    CardModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">إدارة الديون</h2>
        <button pButton label="تقرير أعمار الذمم" icon="pi pi-chart-bar" class="p-button-secondary" (click)="showAgingReport()"></button>
      </div>

      <!-- الإحصائيات -->
      <div class="grid grid-cols-5 gap-4 mb-4">
        <div class="bg-blue-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.total }}</div>
          <div class="text-gray-600">إجمالي الديون</div>
        </div>
        <div class="bg-yellow-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.outstanding }}</div>
          <div class="text-gray-600">مستحقة</div>
        </div>
        <div class="bg-orange-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.partial }}</div>
          <div class="text-gray-600">مسددة جزئياً</div>
        </div>
        <div class="bg-green-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.paid }}</div>
          <div class="text-gray-600">مسددة</div>
        </div>
        <div class="bg-red-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.totalOutstandingAmount | number:'1.0-0' }}</div>
          <div class="text-gray-600">إجمالي المستحق</div>
        </div>
      </div>

      <!-- فلاتر -->
      <div class="flex gap-4 mb-4">
        <p-select [(ngModel)]="filterStatus" [options]="statusOptions" placeholder="الحالة" (onChange)="loadDebts()" class="w-48"></p-select>
        <p-select [(ngModel)]="filterType" [options]="typeOptions" placeholder="النوع" (onChange)="loadDebts()" class="w-48"></p-select>
      </div>

      <!-- الجدول -->
      <p-table [value]="debts" [loading]="loading" [paginator]="true" [rows]="10"
               [showCurrentPageReport]="true" currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords}">
        <ng-template pTemplate="header">
          <tr>
            <th>النوع</th>
            <th>المبلغ الأصلي</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الغرامة</th>
            <th>تاريخ الاستحقاق</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-debt>
          <tr>
            <td>{{ getTypeLabel(debt.debtType) }}</td>
            <td>{{ debt.originalAmount | number:'1.2-2' }}</td>
            <td>{{ debt.paidAmount | number:'1.2-2' }}</td>
            <td class="font-bold text-red-600">{{ debt.remainingAmount | number:'1.2-2' }}</td>
            <td>{{ debt.penaltyAmount | number:'1.2-2' }}</td>
            <td>{{ debt.dueDate | date:'yyyy-MM-dd' }}</td>
            <td>
              <p-tag [value]="getStatusLabel(debt.status)" [severity]="getStatusSeverity(debt.status)"></p-tag>
            </td>
            <td>
              <button pButton icon="pi pi-money-bill" class="p-button-text p-button-success p-button-sm" 
                      (click)="showPayDialog(debt)" [disabled]="debt.status === 'paid'" pTooltip="سداد"></button>
              <button pButton icon="pi pi-ban" class="p-button-text p-button-danger p-button-sm" 
                      (click)="writeOff(debt)" [disabled]="debt.status === 'paid'" pTooltip="شطب"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="text-center py-4">لا توجد ديون</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- نافذة السداد -->
    <p-dialog [(visible)]="payDialogVisible" header="سداد الدين" [modal]="true" [style]="{width: '400px'}">
      <div class="flex flex-col gap-4" *ngIf="selectedDebt">
        <div class="bg-gray-100 p-4 rounded">
          <div class="flex justify-between mb-2">
            <span>المبلغ المتبقي:</span>
            <span class="font-bold">{{ selectedDebt.remainingAmount | number:'1.2-2' }}</span>
          </div>
        </div>
        <div>
          <label class="block mb-2">مبلغ السداد *</label>
          <input pInputText type="number" [(ngModel)]="payAmount" class="w-full" [max]="selectedDebt.remainingAmount" />
        </div>
        <div>
          <label class="block mb-2">ملاحظات</label>
          <input pInputText [(ngModel)]="payNotes" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" class="p-button-text" (click)="payDialogVisible = false"></button>
        <button pButton label="سداد" (click)="payDebt()" [loading]="saving"></button>
      </ng-template>
    </p-dialog>

    <!-- نافذة تقرير أعمار الذمم -->
    <p-dialog [(visible)]="agingDialogVisible" header="تقرير أعمار الذمم المدينة" [modal]="true" [style]="{width: '600px'}">
      <div class="grid grid-cols-2 gap-4" *ngIf="agingReport">
        <p-card header="0-30 يوم" styleClass="bg-green-50">
          <div class="text-2xl font-bold">{{ agingReport.aging.current | number:'1.0-0' }}</div>
        </p-card>
        <p-card header="31-60 يوم" styleClass="bg-yellow-50">
          <div class="text-2xl font-bold">{{ agingReport.aging.days30 | number:'1.0-0' }}</div>
        </p-card>
        <p-card header="61-90 يوم" styleClass="bg-orange-50">
          <div class="text-2xl font-bold">{{ agingReport.aging.days60 | number:'1.0-0' }}</div>
        </p-card>
        <p-card header="91-180 يوم" styleClass="bg-red-50">
          <div class="text-2xl font-bold">{{ agingReport.aging.days90 | number:'1.0-0' }}</div>
        </p-card>
        <p-card header="أكثر من 180 يوم" styleClass="bg-red-100" class="col-span-2">
          <div class="text-2xl font-bold text-red-600">{{ agingReport.aging.days180Plus | number:'1.0-0' }}</div>
        </p-card>
        <div class="col-span-2 bg-blue-100 p-4 rounded-lg text-center">
          <div class="text-3xl font-bold">{{ agingReport.total | number:'1.0-0' }}</div>
          <div class="text-gray-600">إجمالي الذمم المدينة</div>
        </div>
      </div>
    </p-dialog>
  `,
})
export class DebtsComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  debts: Debt[] = [];
  loading = false;
  saving = false;
  payDialogVisible = false;
  agingDialogVisible = false;

  selectedDebt: Debt | null = null;
  payAmount = 0;
  payNotes = '';

  filterStatus = '';
  filterType = '';

  statistics = { total: 0, outstanding: 0, partial: 0, paid: 0, writtenOff: 0, totalOutstandingAmount: 0 };
  agingReport: any = null;

  statusOptions = [
    { label: 'الكل', value: '' },
    { label: 'مستحقة', value: 'outstanding' },
    { label: 'مسددة جزئياً', value: 'partial' },
    { label: 'مسددة', value: 'paid' },
    { label: 'مشطوبة', value: 'written_off' },
  ];

  typeOptions = [
    { label: 'الكل', value: '' },
    { label: 'فاتورة', value: 'invoice' },
    { label: 'غرامة', value: 'penalty' },
    { label: 'إعادة توصيل', value: 'reconnection' },
    { label: 'أخرى', value: 'other' },
  ];

  ngOnInit() {
    this.loadDebts();
    this.loadStatistics();
  }

  loadDebts() {
    this.loading = true;
    let url = `${environment.apiUrl}/debts?`;
    if (this.filterStatus) url += `status=${this.filterStatus}&`;
    if (this.filterType) url += `debtType=${this.filterType}&`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.debts = res.data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل البيانات' });
        this.loading = false;
      },
    });
  }

  loadStatistics() {
    this.http.get<any>(`${environment.apiUrl}/debts/statistics`).subscribe({
      next: (res) => {
        this.statistics = res;
      },
    });
  }

  showPayDialog(debt: Debt) {
    this.selectedDebt = debt;
    this.payAmount = debt.remainingAmount;
    this.payNotes = '';
    this.payDialogVisible = true;
  }

  payDebt() {
    if (!this.selectedDebt || this.payAmount <= 0) return;

    this.saving = true;
    this.http.post(`${environment.apiUrl}/debts/${this.selectedDebt.id}/pay`, {
      amount: this.payAmount,
      notes: this.payNotes,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم السداد بنجاح' });
        this.payDialogVisible = false;
        this.loadDebts();
        this.loadStatistics();
        this.saving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
        this.saving = false;
      },
    });
  }

  writeOff(debt: Debt) {
    const reason = prompt('سبب الشطب:');
    if (!reason) return;

    this.http.post(`${environment.apiUrl}/debts/${debt.id}/write-off`, { reason }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم شطب الدين' });
        this.loadDebts();
        this.loadStatistics();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في الشطب' });
      },
    });
  }

  showAgingReport() {
    this.http.get<any>(`${environment.apiUrl}/debts/aging-report`).subscribe({
      next: (res) => {
        this.agingReport = res;
        this.agingDialogVisible = true;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل التقرير' });
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      outstanding: 'مستحقة',
      partial: 'مسددة جزئياً',
      paid: 'مسددة',
      written_off: 'مشطوبة',
      disputed: 'متنازع عليها',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      outstanding: 'danger',
      partial: 'warn',
      paid: 'success',
      written_off: 'secondary',
      disputed: 'info',
    };
    return severities[status] || 'info';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      invoice: 'فاتورة',
      penalty: 'غرامة',
      reconnection: 'إعادة توصيل',
      other: 'أخرى',
    };
    return labels[type] || type;
  }
}
