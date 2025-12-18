import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { MeterListComponent } from './meter-list.component';
import { MetersService } from '../services/meters.service';

describe('MeterListComponent', () => {
  let component: MeterListComponent;
  let fixture: ComponentFixture<MeterListComponent>;
  let metersService: jasmine.SpyObj<MetersService>;

  const mockMeters = [
    { id: '1', meterNo: 'MTR-001', type: 'digital', status: 'active', customer: { name: 'عميل 1' } },
    { id: '2', meterNo: 'MTR-002', type: 'mechanical', status: 'active', customer: { name: 'عميل 2' } },
    { id: '3', meterNo: 'MTR-003', type: 'smart', status: 'inactive', customer: { name: 'عميل 3' } },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('MetersService', ['getMeters', 'deleteMeter', 'getStatistics']);
    spy.getMeters.and.returnValue(of({ data: mockMeters, meta: { total: 3, page: 1, limit: 10 } }));
    spy.getStatistics.and.returnValue(of({ totalMeters: 200, activeMeters: 180, inactiveMeters: 20 }));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [MeterListComponent],
      providers: [{ provide: MetersService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(MeterListComponent);
    component = fixture.componentInstance;
    metersService = TestBed.inject(MetersService) as jasmine.SpyObj<MetersService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load meters on init', () => {
      fixture.detectChanges();
      expect(metersService.getMeters).toHaveBeenCalled();
      expect(component.meters.length).toBe(3);
    });

    it('should load statistics on init', () => {
      fixture.detectChanges();
      expect(metersService.getStatistics).toHaveBeenCalled();
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
      expect(compiled.textContent).toContain('MTR-002');
    });

    it('should display customer names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('عميل 1');
      expect(compiled.textContent).toContain('عميل 2');
    });

    it('should display meter types', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('digital');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by status', () => {
      component.filterByStatus('active');
      expect(metersService.getMeters).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'active' }));
    });

    it('should filter by type', () => {
      component.filterByType('smart');
      expect(metersService.getMeters).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'smart' }));
    });

    it('should search by meter number', () => {
      component.search('MTR-001');
      expect(metersService.getMeters).toHaveBeenCalledWith(jasmine.objectContaining({ search: 'MTR-001' }));
    });

    it('should clear filters', () => {
      component.filterByStatus('active');
      component.clearFilters();
      expect(component.filters).toEqual({});
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should change page', () => {
      component.onPageChange({ page: 2, rows: 10 });
      expect(metersService.getMeters).toHaveBeenCalledWith(jasmine.objectContaining({ page: 2 }));
    });

    it('should change page size', () => {
      component.onPageChange({ page: 1, rows: 25 });
      expect(metersService.getMeters).toHaveBeenCalledWith(jasmine.objectContaining({ limit: 25 }));
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to meter detail', () => {
      spyOn(component['router'], 'navigate');
      component.viewMeter('1');
      expect(component['router'].navigate).toHaveBeenCalledWith(['/meters', '1']);
    });

    it('should navigate to edit meter', () => {
      spyOn(component['router'], 'navigate');
      component.editMeter('1');
      expect(component['router'].navigate).toHaveBeenCalledWith(['/meters', '1', 'edit']);
    });

    it('should delete meter after confirmation', () => {
      metersService.deleteMeter.and.returnValue(of({ success: true }));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.deleteMeter('1');
      
      expect(metersService.deleteMeter).toHaveBeenCalledWith('1');
    });

    it('should not delete meter if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.deleteMeter('1');
      
      expect(metersService.deleteMeter).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      metersService.getMeters.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.error).toBeTruthy();
    });

    it('should handle delete error', () => {
      fixture.detectChanges();
      metersService.deleteMeter.and.returnValue(throwError(() => new Error('Delete failed')));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.deleteMeter('1');
      
      expect(component.error).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no meters', () => {
      metersService.getMeters.and.returnValue(of({ data: [], meta: { total: 0 } }));
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد عدادات');
    });
  });
});
