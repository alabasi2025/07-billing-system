import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface POSCustomer {
  id: string;
  accountNo: string;
  name: string;
  phone: string;
  category: string;
  status: string;
  meters: POSMeter[];
}

export interface POSMeter {
  id: string;
  meterNo: string;
  meterType: {
    name: string;
    category: string;
  };
}

export interface CustomerSummary {
  customer: {
    id: string;
    accountNo: string;
    name: string;
    phone: string;
    category: string;
    status: string;
  };
  balance: {
    total: number;
    invoicesCount: number;
  };
  pendingInvoices: PendingInvoice[];
  lastPayments: LastPayment[];
  prepaidMeters: PrepaidMeter[];
}

export interface PendingInvoice {
  id: string;
  invoiceNo: string;
  billingPeriod: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: string;
}

export interface LastPayment {
  id: string;
  paymentNo: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
}

export interface PrepaidMeter {
  id: string;
  meterNo: string;
  type: string;
}

export interface POSTransaction {
  transactionType: 'invoice_payment' | 'sts_recharge' | 'service_fee';
  customerId: string;
  invoiceId?: string;
  meterId?: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  referenceNo?: string;
  notes?: string;
}

export interface POSStatistics {
  payments: {
    count: number;
    total: number;
    byMethod: { method: string; count: number; amount: number }[];
  };
  recharges: {
    count: number;
    total: number;
  };
  grandTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class POSService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pos`;

  searchCustomer(params: {
    accountNo?: string;
    meterNo?: string;
    idNumber?: string;
    phone?: string;
  }): Observable<POSCustomer[]> {
    let httpParams = new HttpParams();
    if (params.accountNo) httpParams = httpParams.set('accountNo', params.accountNo);
    if (params.meterNo) httpParams = httpParams.set('meterNo', params.meterNo);
    if (params.idNumber) httpParams = httpParams.set('idNumber', params.idNumber);
    if (params.phone) httpParams = httpParams.set('phone', params.phone);

    return this.http.get<{ success: boolean; data: POSCustomer[] }>(
      `${this.apiUrl}/search`,
      { params: httpParams }
    ).pipe(map(res => res.data));
  }

  getCustomerSummary(customerId: string): Observable<CustomerSummary> {
    return this.http.get<{ success: boolean; data: CustomerSummary }>(
      `${this.apiUrl}/customer/${customerId}/summary`
    ).pipe(map(res => res.data));
  }

  createTransaction(transaction: POSTransaction): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/transaction`,
      transaction
    ).pipe(map(res => res.data));
  }

  getStatistics(fromDate?: string, toDate?: string): Observable<POSStatistics> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<{ success: boolean; data: POSStatistics }>(
      `${this.apiUrl}/statistics`,
      { params }
    ).pipe(map(res => res.data));
  }
}
