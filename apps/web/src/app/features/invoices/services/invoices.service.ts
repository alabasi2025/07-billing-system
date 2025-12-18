import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Invoice, Tariff, ApiResponse, PaginatedResponse } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  private api = inject(ApiService);

  // Tariffs
  getTariffs(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
  }): Observable<PaginatedResponse<Tariff>> {
    return this.api.get<PaginatedResponse<Tariff>>('/api/v1/tariffs', params);
  }

  getTariffById(id: string): Observable<ApiResponse<Tariff>> {
    return this.api.get<ApiResponse<Tariff>>(`/api/v1/tariffs/${id}`);
  }

  getCategoryTariffs(categoryId: string): Observable<ApiResponse<Tariff[]>> {
    return this.api.get<ApiResponse<Tariff[]>>(`/api/v1/tariffs/category/${categoryId}`);
  }

  createTariff(data: Partial<Tariff>): Observable<ApiResponse<Tariff>> {
    return this.api.post<ApiResponse<Tariff>>('/api/v1/tariffs', data);
  }

  updateTariff(id: string, data: Partial<Tariff>): Observable<ApiResponse<Tariff>> {
    return this.api.put<ApiResponse<Tariff>>(`/api/v1/tariffs/${id}`, data);
  }

  deleteTariff(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/api/v1/tariffs/${id}`);
  }

  // Invoices
  getInvoices(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    billingPeriod?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<PaginatedResponse<Invoice>> {
    return this.api.get<PaginatedResponse<Invoice>>('/api/v1/invoices', params);
  }

  getInvoiceById(id: string): Observable<ApiResponse<Invoice>> {
    return this.api.get<ApiResponse<Invoice>>(`/api/v1/invoices/${id}`);
  }

  getInvoiceByNo(invoiceNo: string): Observable<ApiResponse<Invoice>> {
    return this.api.get<ApiResponse<Invoice>>(`/api/v1/invoices/number/${invoiceNo}`);
  }

  getCustomerInvoices(customerId: string): Observable<ApiResponse<Invoice[]>> {
    return this.api.get<ApiResponse<Invoice[]>>(`/api/v1/invoices/customer/${customerId}`);
  }

  getCustomerUnpaidInvoices(customerId: string): Observable<ApiResponse<Invoice[]>> {
    return this.api.get<ApiResponse<Invoice[]>>(`/api/v1/invoices/customer/${customerId}/unpaid`);
  }

  generateInvoice(data: {
    customerId: string;
    billingPeriod: string;
    readingId?: string;
  }): Observable<ApiResponse<Invoice>> {
    return this.api.post<ApiResponse<Invoice>>('/api/v1/invoices/generate', data);
  }

  generateBatchInvoices(data: {
    billingPeriod: string;
    categoryId?: string;
  }): Observable<ApiResponse<{ generated: number; failed: number; errors: string[] }>> {
    return this.api.post<ApiResponse<{ generated: number; failed: number; errors: string[] }>>('/api/v1/invoices/generate-batch', data);
  }

  updateInvoice(id: string, data: Partial<Invoice>): Observable<ApiResponse<Invoice>> {
    return this.api.put<ApiResponse<Invoice>>(`/api/v1/invoices/${id}`, data);
  }

  cancelInvoice(id: string, reason: string): Observable<ApiResponse<Invoice>> {
    return this.api.post<ApiResponse<Invoice>>(`/api/v1/invoices/${id}/cancel`, { reason });
  }

  getOverdueInvoices(): Observable<ApiResponse<Invoice[]>> {
    return this.api.get<ApiResponse<Invoice[]>>('/api/v1/invoices/overdue');
  }

  calculateConsumption(data: {
    customerId: string;
    previousReading: number;
    currentReading: number;
  }): Observable<ApiResponse<{
    consumption: number;
    slices: { name: string; kwh: number; rate: number; amount: number }[];
    consumptionAmount: number;
    fixedCharges: number;
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
  }>> {
    return this.api.post<ApiResponse<any>>('/api/v1/invoices/calculate', data);
  }
}
