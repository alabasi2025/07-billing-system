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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { environment } from '../../../environments/environment';

interface PosTerminal {
  id: string;
  terminalCode: string;
  terminalName: string;
  locationName: string;
  status: string;
  printerType: string;
  openingBalance: number;
  currentBalance: number;
  sessions?: any[];
}

@Component({
  selector: 'app-pos-terminals',
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
    ConfirmDialogModule,
    TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">إدارة نقاط البيع</h2>
        <button pButton label="إضافة نقطة بيع" icon="pi pi-plus" (click)="showDialog()"></button>
      </div>

      <!-- الإحصائيات -->
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="bg-blue-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.total }}</div>
          <div class="text-gray-600">إجمالي نقاط البيع</div>
        </div>
        <div class="bg-green-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.active }}</div>
          <div class="text-gray-600">نشطة</div>
        </div>
        <div class="bg-yellow-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.openSessions }}</div>
          <div class="text-gray-600">جلسات مفتوحة</div>
        </div>
        <div class="bg-red-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.maintenance }}</div>
          <div class="text-gray-600">صيانة</div>
        </div>
      </div>

      <!-- الجدول -->
      <p-table [value]="terminals" [loading]="loading" [paginator]="true" [rows]="10"
               [showCurrentPageReport]="true" currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords}">
        <ng-template pTemplate="header">
          <tr>
            <th>رمز نقطة البيع</th>
            <th>الاسم</th>
            <th>الموقع</th>
            <th>الحالة</th>
            <th>نوع الطابعة</th>
            <th>الرصيد الحالي</th>
            <th>الإجراءات</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-terminal>
          <tr>
            <td>{{ terminal.terminalCode }}</td>
            <td>{{ terminal.terminalName }}</td>
            <td>{{ terminal.locationName || '-' }}</td>
            <td>
              <p-tag [value]="getStatusLabel(terminal.status)" [severity]="getStatusSeverity(terminal.status)"></p-tag>
            </td>
            <td>{{ terminal.printerType }}</td>
            <td>{{ terminal.currentBalance | number:'1.2-2' }}</td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editTerminal(terminal)"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(terminal)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center py-4">لا توجد نقاط بيع</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- نافذة الإضافة/التعديل -->
    <p-dialog [(visible)]="dialogVisible" [header]="editMode ? 'تعديل نقطة البيع' : 'إضافة نقطة بيع'" [modal]="true" [style]="{width: '500px'}">
      <div class="flex flex-col gap-4">
        <div>
          <label class="block mb-2">رمز نقطة البيع *</label>
          <input pInputText [(ngModel)]="terminal.terminalCode" class="w-full" [disabled]="editMode" />
        </div>
        <div>
          <label class="block mb-2">اسم نقطة البيع *</label>
          <input pInputText [(ngModel)]="terminal.terminalName" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الموقع</label>
          <input pInputText [(ngModel)]="terminal.locationName" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الحالة</label>
          <p-select [(ngModel)]="terminal.status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-2">نوع الطابعة</label>
          <p-select [(ngModel)]="terminal.printerType" [options]="printerOptions" optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div *ngIf="!editMode">
          <label class="block mb-2">الرصيد الافتتاحي</label>
          <input pInputText type="number" [(ngModel)]="terminal.openingBalance" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="حفظ" (click)="saveTerminal()" [loading]="saving"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class PosTerminalsComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  terminals: PosTerminal[] = [];
  loading = false;
  saving = false;
  dialogVisible = false;
  editMode = false;

  terminal: Partial<PosTerminal> = {};
  statistics = { total: 0, active: 0, inactive: 0, maintenance: 0, openSessions: 0 };

  statusOptions = [
    { label: 'نشط', value: 'active' },
    { label: 'غير نشط', value: 'inactive' },
    { label: 'صيانة', value: 'maintenance' },
  ];

  printerOptions = [
    { label: 'حرارية', value: 'thermal' },
    { label: 'ليزر', value: 'laser' },
    { label: 'بدون طابعة', value: 'none' },
  ];

  ngOnInit() {
    this.loadTerminals();
    this.loadStatistics();
  }

  loadTerminals() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/pos-terminals`).subscribe({
      next: (res) => {
        this.terminals = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل البيانات' });
        this.loading = false;
      },
    });
  }

  loadStatistics() {
    this.http.get<any>(`${environment.apiUrl}/pos-terminals/statistics`).subscribe({
      next: (res) => {
        this.statistics = res;
      },
    });
  }

  showDialog() {
    this.terminal = { status: 'active', printerType: 'thermal', openingBalance: 0 };
    this.editMode = false;
    this.dialogVisible = true;
  }

  editTerminal(t: PosTerminal) {
    this.terminal = { ...t };
    this.editMode = true;
    this.dialogVisible = true;
  }

  saveTerminal() {
    if (!this.terminal.terminalCode || !this.terminal.terminalName) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    this.saving = true;
    const request = this.editMode
      ? this.http.put(`${environment.apiUrl}/pos-terminals/${this.terminal.id}`, this.terminal)
      : this.http.post(`${environment.apiUrl}/pos-terminals`, this.terminal);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: this.editMode ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح' });
        this.dialogVisible = false;
        this.loadTerminals();
        this.loadStatistics();
        this.saving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
        this.saving = false;
      },
    });
  }

  confirmDelete(t: PosTerminal) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف نقطة البيع "${t.terminalName}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/pos-terminals/${t.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم الحذف بنجاح' });
            this.loadTerminals();
            this.loadStatistics();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في الحذف' });
          },
        });
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { active: 'نشط', inactive: 'غير نشط', maintenance: 'صيانة' };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warn',
    };
    return severities[status] || 'info';
  }
}
