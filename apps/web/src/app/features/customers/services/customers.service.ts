import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Customer, CustomerCategory, Contract, ApiResponse, PaginatedResponse } from '../../../core/models';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFilterDto,
  ChangeCustomerStatusDto,
  CustomerBalance,
  CustomerStatistics,
} from '../../../core/models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private api = inject(ApiService);

  // Customer Categories
  getCategories(params?: { page?: number; limit?: number; isActive?: boolean }): Observable<PaginatedResponse<CustomerCategory>> {
    return this.api.get<PaginatedResponse<CustomerCategory>>('/api/v1/customer-categories', params);
  }

  getCategoryById(id: string): Observable<ApiResponse<CustomerCategory>> {
    return this.api.get<ApiResponse<CustomerCategory>>(`/api/v1/customer-categories/${id}`);
  }

  createCategory(data: Partial<CustomerCategory>): Observable<ApiResponse<CustomerCategory>> {
    return this.api.post<ApiResponse<CustomerCategory>>('/api/v1/customer-categories', data);
  }

  updateCategory(id: string, data: Partial<CustomerCategory>): Observable<ApiResponse<CustomerCategory>> {
    return this.api.put<ApiResponse<CustomerCategory>>(`/api/v1/customer-categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/api/v1/customer-categories/${id}`);
  }

  // Customers
  getCustomers(params?: CustomerFilterDto): Observable<PaginatedResponse<Customer>> {
    return this.api.get<PaginatedResponse<Customer>>('/api/v1/customers', params as Record<string, string | number | boolean> | undefined);
  }

  getCustomerById(id: string): Observable<ApiResponse<Customer>> {
    return this.api.get<ApiResponse<Customer>>(`/api/v1/customers/${id}`);
  }

  getCustomerByAccountNo(accountNo: string): Observable<ApiResponse<Customer>> {
    return this.api.get<ApiResponse<Customer>>(`/api/v1/customers/account/${accountNo}`);
  }

  createCustomer(data: CreateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.api.post<ApiResponse<Customer>>('/api/v1/customers', data);
  }

  updateCustomer(id: string, data: UpdateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.api.put<ApiResponse<Customer>>(`/api/v1/customers/${id}`, data);
  }

  changeCustomerStatus(id: string, statusDto: ChangeCustomerStatusDto): Observable<ApiResponse<Customer>> {
    return this.api.patch<ApiResponse<Customer>>(`/api/v1/customers/${id}/status`, statusDto);
  }

  suspendCustomer(id: string, reason?: string): Observable<ApiResponse<Customer>> {
    return this.api.post<ApiResponse<Customer>>(`/api/v1/customers/${id}/suspend`, { reason });
  }

  activateCustomer(id: string): Observable<ApiResponse<Customer>> {
    return this.api.post<ApiResponse<Customer>>(`/api/v1/customers/${id}/activate`, {});
  }

  deleteCustomer(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.delete<ApiResponse<{ message: string }>>(`/api/v1/customers/${id}`);
  }

  getCustomerBalance(id: string): Observable<ApiResponse<CustomerBalance>> {
    return this.api.get<ApiResponse<CustomerBalance>>(`/api/v1/customers/${id}/balance`);
  }

  getCustomerInvoices(id: string, page = 1, limit = 10): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>(`/api/v1/customers/${id}/invoices`, { page, limit });
  }

  getCustomerPayments(id: string, page = 1, limit = 10): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>(`/api/v1/customers/${id}/payments`, { page, limit });
  }

  getStatistics(): Observable<ApiResponse<CustomerStatistics>> {
    return this.api.get<ApiResponse<CustomerStatistics>>('/api/v1/customers/statistics');
  }

  // Contracts
  getContracts(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: string;
  }): Observable<PaginatedResponse<Contract>> {
    return this.api.get<PaginatedResponse<Contract>>('/api/v1/contracts', params);
  }

  getContractById(id: string): Observable<ApiResponse<Contract>> {
    return this.api.get<ApiResponse<Contract>>(`/api/v1/contracts/${id}`);
  }

  getCustomerActiveContract(customerId: string): Observable<ApiResponse<Contract>> {
    return this.api.get<ApiResponse<Contract>>(`/api/v1/contracts/customer/${customerId}/active`);
  }

  createContract(data: Partial<Contract>): Observable<ApiResponse<Contract>> {
    return this.api.post<ApiResponse<Contract>>('/api/v1/contracts', data);
  }

  updateContract(id: string, data: Partial<Contract>): Observable<ApiResponse<Contract>> {
    return this.api.put<ApiResponse<Contract>>(`/api/v1/contracts/${id}`, data);
  }

  terminateContract(id: string, data: { terminationDate: string; reason: string }): Observable<ApiResponse<Contract>> {
    return this.api.post<ApiResponse<Contract>>(`/api/v1/contracts/${id}/terminate`, data);
  }

  suspendContract(id: string, reason?: string): Observable<ApiResponse<Contract>> {
    return this.api.post<ApiResponse<Contract>>(`/api/v1/contracts/${id}/suspend`, { reason });
  }

  activateContract(id: string): Observable<ApiResponse<Contract>> {
    return this.api.post<ApiResponse<Contract>>(`/api/v1/contracts/${id}/activate`, {});
  }
}
