import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DashboardStats, ApiResponse } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private api = inject(ApiService);

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.api.get<ApiResponse<DashboardStats>>('/api/v1/reports/dashboard');
  }

  getRevenueReport(params?: {
    fromDate?: string;
    toDate?: string;
    categoryId?: string;
    groupBy?: string;
  }): Observable<ApiResponse<{
    totalRevenue: number;
    totalCollected: number;
    totalOutstanding: number;
    data: { period: string; revenue: number; collected: number; outstanding: number }[];
  }>> {
    return this.api.get<ApiResponse<any>>('/api/v1/reports/revenue', params);
  }

  getCustomerReport(params?: {
    categoryId?: string;
    status?: string;
  }): Observable<ApiResponse<{
    totalCustomers: number;
    byCategory: { category: string; count: number }[];
    byStatus: { status: string; count: number }[];
    newCustomers: number;
    disconnectedCustomers: number;
  }>> {
    return this.api.get<ApiResponse<any>>('/api/v1/reports/customers', params);
  }

  getConsumptionReport(params?: {
    billingPeriod?: string;
    categoryId?: string;
  }): Observable<ApiResponse<{
    totalConsumption: number;
    averageConsumption: number;
    byCategory: { category: string; consumption: number; customers: number }[];
    topConsumers: { customerId: string; name: string; consumption: number }[];
  }>> {
    return this.api.get<ApiResponse<any>>('/api/v1/reports/consumption', params);
  }

  getOutstandingReport(params?: {
    asOfDate?: string;
    categoryId?: string;
  }): Observable<ApiResponse<{
    totalOutstanding: number;
    overdueAmount: number;
    aging: {
      current: number;
      days30: number;
      days60: number;
      days90: number;
      over90: number;
    };
    topDebtors: { customerId: string; name: string; outstanding: number; overdue: number }[];
  }>> {
    return this.api.get<ApiResponse<any>>('/api/v1/reports/outstanding', params);
  }

  getMeterReport(params?: {
    meterTypeId?: string;
    status?: string;
  }): Observable<ApiResponse<{
    totalMeters: number;
    byType: { type: string; count: number }[];
    byStatus: { status: string; count: number }[];
    smartMeters: number;
    analogMeters: number;
  }>> {
    return this.api.get<ApiResponse<any>>('/api/v1/reports/meters', params);
  }

  getComplaintReport(params?: {
    fromDate?: string;
    toDate?: string;
    type?: string;
  }): Observable<ApiResponse<{
    totalComplaints: number;
    openComplaints: number;
    resolvedComplaints: number;
    averageResolutionTime: number;
    byType: { type: string; count: number }[];
    byPriority: { priority: string; count: number }[];
  }>> {
    return this.api.get<ApiResponse<any>>('/api/v1/reports/complaints', params);
  }
}
