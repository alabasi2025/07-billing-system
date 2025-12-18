import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Payment, ApiResponse, PaginatedResponse } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private api = inject(ApiService);

  getPayments(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    invoiceId?: string;
    paymentMethod?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<PaginatedResponse<Payment>> {
    return this.api.get<PaginatedResponse<Payment>>('/api/v1/payments', params);
  }

  getPaymentById(id: string): Observable<ApiResponse<Payment>> {
    return this.api.get<ApiResponse<Payment>>(`/api/v1/payments/${id}`);
  }

  getPaymentByNo(paymentNo: string): Observable<ApiResponse<Payment>> {
    return this.api.get<ApiResponse<Payment>>(`/api/v1/payments/number/${paymentNo}`);
  }

  getCustomerPayments(customerId: string): Observable<ApiResponse<Payment[]>> {
    return this.api.get<ApiResponse<Payment[]>>(`/api/v1/payments/customer/${customerId}`);
  }

  getInvoicePayments(invoiceId: string): Observable<ApiResponse<Payment[]>> {
    return this.api.get<ApiResponse<Payment[]>>(`/api/v1/payments/invoice/${invoiceId}`);
  }

  createPayment(data: {
    customerId: string;
    invoiceId?: string;
    amount: number;
    paymentMethod: string;
    paymentDate?: string;
    referenceNo?: string;
    bankId?: string;
    notes?: string;
  }): Observable<ApiResponse<Payment>> {
    return this.api.post<ApiResponse<Payment>>('/api/v1/payments', data);
  }

  cancelPayment(id: string, reason: string): Observable<ApiResponse<Payment>> {
    return this.api.post<ApiResponse<Payment>>(`/api/v1/payments/${id}/cancel`, { reason });
  }

  getTodayPayments(): Observable<ApiResponse<Payment[]>> {
    return this.api.get<ApiResponse<Payment[]>>('/api/v1/payments/today');
  }

  getPaymentSummary(params?: {
    fromDate?: string;
    toDate?: string;
  }): Observable<ApiResponse<{
    totalAmount: number;
    totalCount: number;
    byMethod: { method: string; amount: number; count: number }[];
  }>> {
    return this.api.get<ApiResponse<any>>('/api/v1/payments/summary', params);
  }
}
