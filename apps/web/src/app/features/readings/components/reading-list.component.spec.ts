import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ReadingListComponent } from './reading-list.component';
import { ReadingsService } from '../services/readings.service';

describe('ReadingListComponent', () => {
  let component: ReadingListComponent;
  let fixture: ComponentFixture<ReadingListComponent>;
  let readingsService: jasmine.SpyObj<ReadingsService>;

  const mockReadings = [
    { id: '1', meterNo: 'MTR-001', currentReading: 1500, previousReading: 1200, consumption: 300, readingDate: '2024-02-15' },
    { id: '2', meterNo: 'MTR-002', currentReading: 2500, previousReading: 2200, consumption: 300, readingDate: '2024-02-15' },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ReadingsService', ['getReadings', 'deleteReading', 'getStatistics']);
    spy.getReadings.and.returnValue(of({ data: mockReadings, meta: { total: 2, page: 1, limit: 10 } }));
    spy.getStatistics.and.returnValue(of({ totalReadings: 180, pendingReadings: 20 }));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [ReadingListComponent],
      providers: [{ provide: ReadingsService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadingListComponent);
    component = fixture.componentInstance;
    readingsService = TestBed.inject(ReadingsService) as jasmine.SpyObj<ReadingsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load readings on init', () => {
      fixture.detectChanges();
      expect(readingsService.getReadings).toHaveBeenCalled();
      expect(component.readings.length).toBe(2);
    });

    it('should set loading to false after data loads', () => {
      fixture.detectChanges();
      expect(component.loading).toBeFalse();
    });
  });

  describe('Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display meter numbers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('MTR-001');
    });

    it('should display consumption values', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('300');
    });

    it('should display reading dates', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('2024-02-15');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by date range', () => {
      component.filterByDateRange('2024-02-01', '2024-02-28');
      expect(readingsService.getReadings).toHaveBeenCalledWith(
        jasmine.objectContaining({ fromDate: '2024-02-01', toDate: '2024-02-28' })
      );
    });

    it('should filter by billing cycle', () => {
      component.filterByCycle('cycle-1');
      expect(readingsService.getReadings).toHaveBeenCalledWith(
        jasmine.objectContaining({ billingCycleId: 'cycle-1' })
      );
    });

    it('should search by meter number', () => {
      component.search('MTR-001');
      expect(readingsService.getReadings).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'MTR-001' })
      );
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should change page', () => {
      component.onPageChange({ page: 2, rows: 10 });
      expect(readingsService.getReadings).toHaveBeenCalledWith(
        jasmine.objectContaining({ page: 2 })
      );
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to add reading', () => {
      spyOn(component['router'], 'navigate');
      component.addReading();
      expect(component['router'].navigate).toHaveBeenCalledWith(['/readings', 'new']);
    });

    it('should navigate to edit reading', () => {
      spyOn(component['router'], 'navigate');
      component.editReading('1');
      expect(component['router'].navigate).toHaveBeenCalledWith(['/readings', '1', 'edit']);
    });

    it('should delete reading after confirmation', () => {
      readingsService.deleteReading.and.returnValue(of({ success: true }));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.deleteReading('1');
      
      expect(readingsService.deleteReading).toHaveBeenCalledWith('1');
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      readingsService.getReadings.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.error).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no readings', () => {
      readingsService.getReadings.and.returnValue(of({ data: [], meta: { total: 0 } }));
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد قراءات');
    });
  });
});
