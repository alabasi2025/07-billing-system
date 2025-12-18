import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Meter, MeterType, MeterReading, ApiResponse, PaginatedResponse } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class MetersService {
  private api = inject(ApiService);

  // Meter Types
  getMeterTypes(params?: { page?: number; limit?: number; isActive?: boolean }): Observable<PaginatedResponse<MeterType>> {
    return this.api.get<PaginatedResponse<MeterType>>('/api/v1/meter-types', params);
  }

  getMeterTypeById(id: string): Observable<ApiResponse<MeterType>> {
    return this.api.get<ApiResponse<MeterType>>(`/api/v1/meter-types/${id}`);
  }

  createMeterType(data: Partial<MeterType>): Observable<ApiResponse<MeterType>> {
    return this.api.post<ApiResponse<MeterType>>('/api/v1/meter-types', data);
  }

  updateMeterType(id: string, data: Partial<MeterType>): Observable<ApiResponse<MeterType>> {
    return this.api.put<ApiResponse<MeterType>>(`/api/v1/meter-types/${id}`, data);
  }

  deleteMeterType(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/api/v1/meter-types/${id}`);
  }

  // Meters
  getMeters(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    meterTypeId?: string;
    status?: string;
  }): Observable<PaginatedResponse<Meter>> {
    return this.api.get<PaginatedResponse<Meter>>('/api/v1/meters', params);
  }

  getMeterById(id: string): Observable<ApiResponse<Meter>> {
    return this.api.get<ApiResponse<Meter>>(`/api/v1/meters/${id}`);
  }

  getMeterByNo(meterNo: string): Observable<ApiResponse<Meter>> {
    return this.api.get<ApiResponse<Meter>>(`/api/v1/meters/number/${meterNo}`);
  }

  getCustomerMeters(customerId: string): Observable<ApiResponse<Meter[]>> {
    return this.api.get<ApiResponse<Meter[]>>(`/api/v1/meters/customer/${customerId}`);
  }

  getAvailableMeters(): Observable<ApiResponse<Meter[]>> {
    return this.api.get<ApiResponse<Meter[]>>('/api/v1/meters/available');
  }

  createMeter(data: Partial<Meter>): Observable<ApiResponse<Meter>> {
    return this.api.post<ApiResponse<Meter>>('/api/v1/meters', data);
  }

  updateMeter(id: string, data: Partial<Meter>): Observable<ApiResponse<Meter>> {
    return this.api.put<ApiResponse<Meter>>(`/api/v1/meters/${id}`, data);
  }

  installMeter(id: string, data: { customerId: string; installDate: string; initialReading: number; location?: string }): Observable<ApiResponse<Meter>> {
    return this.api.post<ApiResponse<Meter>>(`/api/v1/meters/${id}/install`, data);
  }

  uninstallMeter(id: string, data: { uninstallDate: string; finalReading: number; reason?: string }): Observable<ApiResponse<Meter>> {
    return this.api.post<ApiResponse<Meter>>(`/api/v1/meters/${id}/uninstall`, data);
  }

  replaceMeter(id: string, data: { newMeterId: string; replaceDate: string; finalReading: number; newInitialReading: number }): Observable<ApiResponse<Meter>> {
    return this.api.post<ApiResponse<Meter>>(`/api/v1/meters/${id}/replace`, data);
  }

  // Meter Readings
  getReadings(params?: {
    page?: number;
    limit?: number;
    meterId?: string;
    billingPeriod?: string;
    readingType?: string;
    isProcessed?: boolean;
  }): Observable<PaginatedResponse<MeterReading>> {
    return this.api.get<PaginatedResponse<MeterReading>>('/api/v1/meter-readings', params);
  }

  getReadingById(id: string): Observable<ApiResponse<MeterReading>> {
    return this.api.get<ApiResponse<MeterReading>>(`/api/v1/meter-readings/${id}`);
  }

  getMeterReadings(meterId: string): Observable<ApiResponse<MeterReading[]>> {
    return this.api.get<ApiResponse<MeterReading[]>>(`/api/v1/meter-readings/meter/${meterId}`);
  }

  createReading(data: {
    meterId: string;
    reading: number;
    readingDate: string;
    readingType: string;
    billingPeriod: string;
    notes?: string;
  }): Observable<ApiResponse<MeterReading>> {
    return this.api.post<ApiResponse<MeterReading>>('/api/v1/meter-readings', data);
  }

  updateReading(id: string, data: Partial<MeterReading>): Observable<ApiResponse<MeterReading>> {
    return this.api.put<ApiResponse<MeterReading>>(`/api/v1/meter-readings/${id}`, data);
  }

  deleteReading(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/api/v1/meter-readings/${id}`);
  }

  getUnprocessedReadings(): Observable<ApiResponse<MeterReading[]>> {
    return this.api.get<ApiResponse<MeterReading[]>>('/api/v1/meter-readings/unprocessed');
  }
}
