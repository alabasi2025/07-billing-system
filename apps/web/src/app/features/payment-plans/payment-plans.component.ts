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
import { StepsModule } from 'primeng/steps';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';

interface PaymentPlan {
  id: string;
  planNumber: string;
  customerId: string;
  totalAmount: number;
  downPayment: number;
  remainingAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  startDate: string;
  status: string;
  installments: Installment[];
}

interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
}

@Component({
  selector: 'app-payment-plans',
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
    StepsModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">خطط السداد</h2>
        <button pButton label="إنشاء خطة جديدة" icon="pi pi-plus" (click)="showCreateDialog()"></button>
      </div>

      <!-- الإحصائيات -->
      <div class="grid grid-cols-5 gap-4 mb-4">
        <div class="bg-blue-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.total }}</div>
          <div class="text-gray-600">إجمالي الخطط</div>
        </div>
        <div class="bg-green-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.active }}</div>
          <div class="text-gray-600">نشطة</div>
        </div>
        <div class="bg-blue-200 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.completed }}</div>
          <div class="text-gray-600">مكتملة</div>
        </div>
        <div class="bg-red-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.overdueInstallments }}</div>
          <div class="text-gray-600">أقساط متأخرة</div>
        </div>
        <div class="bg-yellow-100 p-4 rounded-lg">
          <div class="text-2xl font-bold">{{ statistics.totalRemainingAmount | number:'1.0-0' }}</div>
          <div class="text-gray-600">إجمالي المتبقي</div>
        </div>
      </div>

      <!-- الجدول -->
      <p-table [value]="plans" [loading]="loading" [paginator]="true" [rows]="10"
               [expandedRowKeys]="expandedRows" dataKey="id"
               [showCurrentPageReport]="true" currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords}">
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 3rem"></th>
            <th>رقم الخطة</th>
            <th>المبلغ الإجمالي</th>
            <th>الدفعة المقدمة</th>
            <th>عدد الأقساط</th>
            <th>قيمة القسط</th>
            <th>المتبقي</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-plan let-expanded="expanded">
          <tr>
            <td>
              <button type="button" pButton [pRowToggler]="plan" class="p-button-text p-button-rounded p-button-plain"
                      [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-left'"></button>
            </td>
            <td>{{ plan.planNumber }}</td>
            <td>{{ plan.totalAmount | number:'1.2-2' }}</td>
            <td>{{ plan.downPayment | number:'1.2-2' }}</td>
            <td>{{ plan.numberOfInstallments }}</td>
            <td>{{ plan.installmentAmount | number:'1.2-2' }}</td>
            <td class="font-bold">{{ plan.remainingAmount | number:'1.2-2' }}</td>
            <td>
              <p-tag [value]="getStatusLabel(plan.status)" [severity]="getStatusSeverity(plan.status)"></p-tag>
            </td>
            <td>
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewPlan(plan)" pTooltip="عرض"></button>
              <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" 
                      (click)="cancelPlan(plan)" [disabled]="plan.status !== 'active'" pTooltip="إلغاء"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="rowexpansion" let-plan>
          <tr>
            <td colspan="9">
              <div class="p-4">
                <h4 class="font-bold mb-2">الأقساط</h4>
                <p-table [value]="plan.installments" styleClass="p-datatable-sm">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>رقم القسط</th>
                      <th>تاريخ الاستحقاق</th>
                      <th>المبلغ</th>
                      <th>المدفوع</th>
                      <th>الحالة</th>
                      <th>الإجراء</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-inst>
                    <tr>
                      <td>{{ inst.installmentNumber }}</td>
                      <td>{{ inst.dueDate | date:'yyyy-MM-dd' }}</td>
                      <td>{{ inst.amount | number:'1.2-2' }}</td>
                      <td>{{ inst.paidAmount | number:'1.2-2' }}</td>
                      <td>
                        <p-tag [value]="getInstallmentStatusLabel(inst.status)" [severity]="getInstallmentStatusSeverity(inst.status)"></p-tag>
                      </td>
                      <td>
                        <button pButton label="سداد" class="p-button-sm p-button-success" 
                                (click)="payInstallment(plan, inst)" [disabled]="inst.status === 'paid'"></button>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center py-4">لا توجد خطط سداد</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- نافذة إنشاء خطة -->
    <p-dialog [(visible)]="createDialogVisible" header="إنشاء خطة سداد جديدة" [modal]="true" [style]="{width: '500px'}">
      <div class="flex flex-col gap-4">
        <div>
          <label class="block mb-2">العميل *</label>
          <p-select [(ngModel)]="newPlan.customerId" [options]="customers" optionLabel="name" optionValue="id" 
                    [filter]="true" filterBy="name,accountNo" placeholder="اختر العميل" class="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-2">المبلغ الإجمالي *</label>
          <input pInputText type="number" [(ngModel)]="newPlan.totalAmount" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الدفعة المقدمة</label>
          <input pInputText type="number" [(ngModel)]="newPlan.downPayment" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">عدد الأقساط *</label>
          <input pInputText type="number" [(ngModel)]="newPlan.numberOfInstallments" class="w-full" min="1" max="60" />
        </div>
        <div>
          <label class="block mb-2">تاريخ البداية *</label>
          <input pInputText type="date" [(ngModel)]="newPlan.startDate" class="w-full" />
        </div>
        <div class="bg-gray-100 p-4 rounded" *ngIf="newPlan.totalAmount && newPlan.numberOfInstallments">
          <div class="flex justify-between">
            <span>قيمة القسط التقريبية:</span>
            <span class="font-bold">{{ calculateInstallment() | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" class="p-button-text" (click)="createDialogVisible = false"></button>
        <button pButton label="إنشاء" (click)="createPlan()" [loading]="saving"></button>
      </ng-template>
    </p-dialog>

    <!-- نافذة سداد قسط -->
    <p-dialog [(visible)]="payDialogVisible" header="سداد قسط" [modal]="true" [style]="{width: '400px'}">
      <div class="flex flex-col gap-4" *ngIf="selectedInstallment">
        <div class="bg-gray-100 p-4 rounded">
          <div class="flex justify-between mb-2">
            <span>قيمة القسط:</span>
            <span class="font-bold">{{ selectedInstallment.amount | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between">
            <span>المدفوع مسبقاً:</span>
            <span>{{ selectedInstallment.paidAmount | number:'1.2-2' }}</span>
          </div>
        </div>
        <div>
          <label class="block mb-2">مبلغ السداد *</label>
          <input pInputText type="number" [(ngModel)]="payAmount" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="إلغاء" class="p-button-text" (click)="payDialogVisible = false"></button>
        <button pButton label="سداد" (click)="confirmPayInstallment()" [loading]="saving"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class PaymentPlansComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  plans: PaymentPlan[] = [];
  customers: any[] = [];
  loading = false;
  saving = false;
  createDialogVisible = false;
  payDialogVisible = false;
  expandedRows: { [key: string]: boolean } = {};

  newPlan: any = {};
  selectedPlan: PaymentPlan | null = null;
  selectedInstallment: Installment | null = null;
  payAmount = 0;

  statistics = { total: 0, active: 0, completed: 0, defaulted: 0, cancelled: 0, totalRemainingAmount: 0, overdueInstallments: 0 };

  ngOnInit() {
    this.loadPlans();
    this.loadStatistics();
    this.loadCustomers();
  }

  loadPlans() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/payment-plans`).subscribe({
      next: (res) => {
        this.plans = res.data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحميل البيانات' });
        this.loading = false;
      },
    });
  }

  loadStatistics() {
    this.http.get<any>(`${environment.apiUrl}/payment-plans/statistics`).subscribe({
      next: (res) => {
        this.statistics = res;
      },
    });
  }

  loadCustomers() {
    this.http.get<any>(`${environment.apiUrl}/customers?take=1000`).subscribe({
      next: (res) => {
        this.customers = res.data;
      },
    });
  }

  showCreateDialog() {
    this.newPlan = {
      totalAmount: 0,
      downPayment: 0,
      numberOfInstallments: 12,
      startDate: new Date().toISOString().split('T')[0],
    };
    this.createDialogVisible = true;
  }

  calculateInstallment(): number {
    const remaining = (this.newPlan.totalAmount || 0) - (this.newPlan.downPayment || 0);
    return remaining / (this.newPlan.numberOfInstallments || 1);
  }

  createPlan() {
    if (!this.newPlan.customerId || !this.newPlan.totalAmount || !this.newPlan.numberOfInstallments) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    this.saving = true;
    this.http.post(`${environment.apiUrl}/payment-plans`, this.newPlan).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء خطة السداد بنجاح' });
        this.createDialogVisible = false;
        this.loadPlans();
        this.loadStatistics();
        this.saving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
        this.saving = false;
      },
    });
  }

  viewPlan(plan: PaymentPlan) {
    this.expandedRows[plan.id] = !this.expandedRows[plan.id];
  }

  payInstallment(plan: PaymentPlan, installment: Installment) {
    this.selectedPlan = plan;
    this.selectedInstallment = installment;
    this.payAmount = installment.amount - installment.paidAmount;
    this.payDialogVisible = true;
  }

  confirmPayInstallment() {
    if (!this.selectedPlan || !this.selectedInstallment || this.payAmount <= 0) return;

    this.saving = true;
    this.http.post(`${environment.apiUrl}/payment-plans/${this.selectedPlan.id}/installments/${this.selectedInstallment.id}/pay`, {
      amount: this.payAmount,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم سداد القسط بنجاح' });
        this.payDialogVisible = false;
        this.loadPlans();
        this.loadStatistics();
        this.saving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
        this.saving = false;
      },
    });
  }

  cancelPlan(plan: PaymentPlan) {
    const reason = prompt('سبب الإلغاء:');
    if (!reason) return;

    this.http.put(`${environment.apiUrl}/payment-plans/${plan.id}/cancel`, { reason }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إلغاء الخطة' });
        this.loadPlans();
        this.loadStatistics();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في الإلغاء' });
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'نشطة',
      completed: 'مكتملة',
      defaulted: 'متعثرة',
      cancelled: 'ملغاة',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      active: 'info',
      completed: 'success',
      defaulted: 'danger',
      cancelled: 'secondary',
    };
    return severities[status] || 'info';
  }

  getInstallmentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'معلق',
      paid: 'مسدد',
      overdue: 'متأخر',
      partial: 'جزئي',
    };
    return labels[status] || status;
  }

  getInstallmentStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      pending: 'info',
      paid: 'success',
      overdue: 'danger',
      partial: 'warn',
    };
    return severities[status] || 'info';
  }
}
