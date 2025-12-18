import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { POSService, POSCustomer, CustomerSummary, PendingInvoice, PrepaidMeter } from './pos.service';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    DialogModule,
    SelectModule,
    InputNumberModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      <!-- قسم البحث -->
      <div class="lg:col-span-1">
        <p-card header="البحث عن عميل" styleClass="h-full">
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">رقم الحساب</label>
              <input pInputText [(ngModel)]="searchParams.accountNo" 
                     class="w-full" placeholder="ابحث برقم الحساب"
                     (keyup.enter)="search()">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">رقم العداد</label>
              <input pInputText [(ngModel)]="searchParams.meterNo" 
                     class="w-full" placeholder="ابحث برقم العداد"
                     (keyup.enter)="search()">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">رقم الهوية</label>
              <input pInputText [(ngModel)]="searchParams.idNumber" 
                     class="w-full" placeholder="ابحث برقم الهوية"
                     (keyup.enter)="search()">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">رقم الهاتف</label>
              <input pInputText [(ngModel)]="searchParams.phone" 
                     class="w-full" placeholder="ابحث برقم الهاتف"
                     (keyup.enter)="search()">
            </div>
            <p-button label="بحث" icon="pi pi-search" 
                      (onClick)="search()" [loading]="searching()"
                      styleClass="w-full"></p-button>
          </div>
          
          <!-- نتائج البحث -->
          @if (searchResults().length > 0) {
            <div class="mt-4">
              <h4 class="font-semibold mb-2">نتائج البحث</h4>
              <div class="flex flex-col gap-2">
                @for (customer of searchResults(); track customer.id) {
                  <div class="p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                       [class.bg-blue-50]="selectedCustomer()?.id === customer.id"
                       [class.border-blue-500]="selectedCustomer()?.id === customer.id"
                       (click)="selectCustomer(customer)">
                    <div class="font-semibold">{{ customer.name }}</div>
                    <div class="text-sm text-gray-600">{{ customer.accountNo }}</div>
                    <div class="text-xs text-gray-500">{{ customer.category }}</div>
                  </div>
                }
              </div>
            </div>
          }
        </p-card>
      </div>
      
      <!-- قسم تفاصيل العميل -->
      <div class="lg:col-span-2">
        @if (customerSummary()) {
          <div class="flex flex-col gap-4">
            <!-- معلومات العميل -->
            <p-card>
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-xl font-bold">{{ customerSummary()!.customer.name }}</h2>
                  <p class="text-gray-600">{{ customerSummary()!.customer.accountNo }}</p>
                  <p class="text-sm text-gray-500">{{ customerSummary()!.customer.phone }}</p>
                </div>
                <div class="text-left">
                  <div class="text-sm text-gray-500">إجمالي المستحقات</div>
                  <div class="text-2xl font-bold" 
                       [class.text-red-600]="customerSummary()!.balance.total > 0"
                       [class.text-green-600]="customerSummary()!.balance.total === 0">
                    {{ customerSummary()!.balance.total | number:'1.2-2' }} ر.س
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ customerSummary()!.balance.invoicesCount }} فاتورة مستحقة
                  </div>
                </div>
              </div>
            </p-card>
            
            <!-- الفواتير المستحقة -->
            @if (customerSummary()!.pendingInvoices.length > 0) {
              <p-card header="الفواتير المستحقة">
                <p-table [value]="customerSummary()!.pendingInvoices" [tableStyle]="{'min-width': '50rem'}">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>رقم الفاتورة</th>
                      <th>الفترة</th>
                      <th>المبلغ</th>
                      <th>المدفوع</th>
                      <th>المتبقي</th>
                      <th>الحالة</th>
                      <th>إجراء</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-invoice>
                    <tr>
                      <td>{{ invoice.invoiceNo }}</td>
                      <td>{{ invoice.billingPeriod }}</td>
                      <td>{{ invoice.totalAmount | number:'1.2-2' }}</td>
                      <td>{{ invoice.paidAmount | number:'1.2-2' }}</td>
                      <td class="font-semibold">{{ invoice.balance | number:'1.2-2' }}</td>
                      <td>
                        <p-tag [value]="getStatusLabel(invoice.status)" 
                               [severity]="getStatusSeverity(invoice.status)"></p-tag>
                      </td>
                      <td>
                        <p-button icon="pi pi-credit-card" label="دفع" 
                                  size="small" (onClick)="openPaymentDialog(invoice)"></p-button>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            }
            
            <!-- عدادات الدفع المسبق -->
            @if (customerSummary()!.prepaidMeters.length > 0) {
              <p-card header="عدادات الدفع المسبق (STS)">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (meter of customerSummary()!.prepaidMeters; track meter.id) {
                    <div class="p-4 border rounded-lg">
                      <div class="flex justify-between items-center">
                        <div>
                          <div class="font-semibold">{{ meter.meterNo }}</div>
                          <div class="text-sm text-gray-500">{{ meter.type }}</div>
                        </div>
                        <p-button icon="pi pi-bolt" label="شحن" 
                                  (onClick)="openRechargeDialog(meter)"></p-button>
                      </div>
                    </div>
                  }
                </div>
              </p-card>
            }
            
            <!-- آخر المدفوعات -->
            @if (customerSummary()!.lastPayments.length > 0) {
              <p-card header="آخر المدفوعات">
                <p-table [value]="customerSummary()!.lastPayments">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>رقم الإيصال</th>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>طريقة الدفع</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-payment>
                    <tr>
                      <td>{{ payment.paymentNo }}</td>
                      <td>{{ payment.paymentDate | date:'short' }}</td>
                      <td>{{ payment.amount | number:'1.2-2' }}</td>
                      <td>{{ getPaymentMethodLabel(payment.paymentMethod) }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            }
          </div>
        } @else {
          <p-card styleClass="h-full">
            <div class="flex flex-col items-center justify-center h-64 text-gray-400">
              <i class="pi pi-user text-6xl mb-4"></i>
              <p>اختر عميلاً لعرض تفاصيله</p>
            </div>
          </p-card>
        }
      </div>
    </div>
    
    <!-- حوار الدفع -->
    <p-dialog header="دفع فاتورة" [(visible)]="paymentDialogVisible" [modal]="true" [style]="{width: '450px'}">
      @if (selectedInvoice) {
        <div class="flex flex-col gap-4">
          <div class="p-4 bg-gray-100 rounded-lg">
            <div class="text-sm text-gray-500">رقم الفاتورة</div>
            <div class="font-semibold">{{ selectedInvoice.invoiceNo }}</div>
            <div class="text-sm text-gray-500 mt-2">المبلغ المتبقي</div>
            <div class="text-xl font-bold text-red-600">{{ selectedInvoice.balance | number:'1.2-2' }} ر.س</div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">المبلغ المدفوع</label>
            <p-inputNumber [(ngModel)]="paymentAmount" mode="currency" currency="SAR" locale="ar-SA"
                           [min]="0.01" [max]="selectedInvoice.balance" class="w-full"></p-inputNumber>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">طريقة الدفع</label>
            <p-select [options]="paymentMethods" [(ngModel)]="paymentMethod" 
                      optionLabel="label" optionValue="value" class="w-full"></p-select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">رقم المرجع (اختياري)</label>
            <input pInputText [(ngModel)]="paymentReference" class="w-full">
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" icon="pi pi-times" (onClick)="paymentDialogVisible = false" 
                  [text]="true"></p-button>
        <p-button label="تأكيد الدفع" icon="pi pi-check" (onClick)="processPayment()" 
                  [loading]="processing()"></p-button>
      </ng-template>
    </p-dialog>
    
    <!-- حوار الشحن -->
    <p-dialog header="شحن عداد STS" [(visible)]="rechargeDialogVisible" [modal]="true" [style]="{width: '450px'}">
      @if (selectedMeter) {
        <div class="flex flex-col gap-4">
          <div class="p-4 bg-gray-100 rounded-lg">
            <div class="text-sm text-gray-500">رقم العداد</div>
            <div class="font-semibold">{{ selectedMeter.meterNo }}</div>
            <div class="text-sm text-gray-500 mt-2">نوع العداد</div>
            <div>{{ selectedMeter.type }}</div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">مبلغ الشحن</label>
            <p-inputNumber [(ngModel)]="rechargeAmount" mode="currency" currency="SAR" locale="ar-SA"
                           [min]="10" class="w-full"></p-inputNumber>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">طريقة الدفع</label>
            <p-select [options]="paymentMethods" [(ngModel)]="rechargePaymentMethod" 
                      optionLabel="label" optionValue="value" class="w-full"></p-select>
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" icon="pi pi-times" (onClick)="rechargeDialogVisible = false" 
                  [text]="true"></p-button>
        <p-button label="تأكيد الشحن" icon="pi pi-bolt" (onClick)="processRecharge()" 
                  [loading]="processing()"></p-button>
      </ng-template>
    </p-dialog>
    
    <!-- حوار نتيجة الشحن -->
    <p-dialog header="تم الشحن بنجاح" [(visible)]="rechargeResultDialogVisible" [modal]="true" [style]="{width: '450px'}">
      @if (rechargeResult) {
        <div class="flex flex-col items-center gap-4 p-4">
          <i class="pi pi-check-circle text-6xl text-green-500"></i>
          <div class="text-center">
            <div class="text-sm text-gray-500">رقم التوكن</div>
            <div class="text-2xl font-bold font-mono tracking-wider">{{ rechargeResult.token }}</div>
          </div>
          <div class="grid grid-cols-2 gap-4 w-full text-center">
            <div>
              <div class="text-sm text-gray-500">المبلغ</div>
              <div class="font-semibold">{{ rechargeResult.amount | number:'1.2-2' }} ر.س</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">الوحدات</div>
              <div class="font-semibold">{{ rechargeResult.units }} kWh</div>
            </div>
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button label="طباعة" icon="pi pi-print" (onClick)="printToken()"></p-button>
        <p-button label="إغلاق" icon="pi pi-times" (onClick)="rechargeResultDialogVisible = false"></p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class POSComponent implements OnInit {
  private posService = inject(POSService);
  private messageService = inject(MessageService);

  // حالة البحث
  searchParams = {
    accountNo: '',
    meterNo: '',
    idNumber: '',
    phone: ''
  };
  
  searching = signal(false);
  searchResults = signal<POSCustomer[]>([]);
  selectedCustomer = signal<POSCustomer | null>(null);
  customerSummary = signal<CustomerSummary | null>(null);
  
  // حالة الدفع
  paymentDialogVisible = false;
  selectedInvoice: PendingInvoice | null = null;
  paymentAmount = 0;
  paymentMethod = 'cash';
  paymentReference = '';
  
  // حالة الشحن
  rechargeDialogVisible = false;
  selectedMeter: PrepaidMeter | null = null;
  rechargeAmount = 100;
  rechargePaymentMethod = 'cash';
  
  // نتيجة الشحن
  rechargeResultDialogVisible = false;
  rechargeResult: any = null;
  
  processing = signal(false);
  
  paymentMethods = [
    { label: 'نقدي', value: 'cash' },
    { label: 'بطاقة', value: 'card' },
    { label: 'محفظة إلكترونية', value: 'mobile' }
  ];

  ngOnInit() {}

  search() {
    const hasParams = Object.values(this.searchParams).some(v => v.trim());
    if (!hasParams) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى إدخال معيار بحث واحد على الأقل'
      });
      return;
    }

    this.searching.set(true);
    this.posService.searchCustomer(this.searchParams).subscribe({
      next: (customers) => {
        this.searchResults.set(customers);
        this.searching.set(false);
        if (customers.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'لا توجد نتائج',
            detail: 'لم يتم العثور على عملاء مطابقين'
          });
        }
      },
      error: () => {
        this.searching.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'حدث خطأ أثناء البحث'
        });
      }
    });
  }

  selectCustomer(customer: POSCustomer) {
    this.selectedCustomer.set(customer);
    this.posService.getCustomerSummary(customer.id).subscribe({
      next: (summary) => {
        this.customerSummary.set(summary);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'حدث خطأ أثناء جلب بيانات العميل'
        });
      }
    });
  }

  openPaymentDialog(invoice: PendingInvoice) {
    this.selectedInvoice = invoice;
    this.paymentAmount = invoice.balance;
    this.paymentMethod = 'cash';
    this.paymentReference = '';
    this.paymentDialogVisible = true;
  }

  processPayment() {
    if (!this.selectedInvoice || !this.selectedCustomer()) return;

    this.processing.set(true);
    this.posService.createTransaction({
      transactionType: 'invoice_payment',
      customerId: this.selectedCustomer()!.id,
      invoiceId: this.selectedInvoice.id,
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod as 'cash' | 'card' | 'mobile',
      referenceNo: this.paymentReference || undefined
    }).subscribe({
      next: (result) => {
        this.processing.set(false);
        this.paymentDialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'تم الدفع',
          detail: `تم تسجيل الدفعة بنجاح - رقم الإيصال: ${result.paymentNo}`
        });
        // تحديث بيانات العميل
        this.selectCustomer(this.selectedCustomer()!);
      },
      error: (err) => {
        this.processing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'حدث خطأ أثناء معالجة الدفع'
        });
      }
    });
  }

  openRechargeDialog(meter: PrepaidMeter) {
    this.selectedMeter = meter;
    this.rechargeAmount = 100;
    this.rechargePaymentMethod = 'cash';
    this.rechargeDialogVisible = true;
  }

  processRecharge() {
    if (!this.selectedMeter || !this.selectedCustomer()) return;

    this.processing.set(true);
    this.posService.createTransaction({
      transactionType: 'sts_recharge',
      customerId: this.selectedCustomer()!.id,
      meterId: this.selectedMeter.id,
      amount: this.rechargeAmount,
      paymentMethod: this.rechargePaymentMethod as 'cash' | 'card' | 'mobile'
    }).subscribe({
      next: (result) => {
        this.processing.set(false);
        this.rechargeDialogVisible = false;
        this.rechargeResult = result;
        this.rechargeResultDialogVisible = true;
      },
      error: (err) => {
        this.processing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'حدث خطأ أثناء معالجة الشحن'
        });
      }
    });
  }

  printToken() {
    window.print();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'issued': 'صادرة',
      'partial': 'مدفوعة جزئياً',
      'overdue': 'متأخرة',
      'paid': 'مدفوعة'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'issued': 'info',
      'partial': 'warn',
      'overdue': 'danger',
      'paid': 'success'
    };
    return severities[status] || 'secondary';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'cash': 'نقدي',
      'card': 'بطاقة',
      'bank': 'تحويل بنكي',
      'mobile': 'محفظة إلكترونية'
    };
    return labels[method] || method;
  }
}
