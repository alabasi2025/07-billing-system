import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ReportsDashboardComponent } from './reports-dashboard.component';
import { ReportsService } from '../services/reports.service';

describe('ReportsDashboardComponent', () => {
  let component: ReportsDashboardComponent;
  let fixture: ComponentFixture<ReportsDashboardComponent>;
  let reportsService: jasmine.SpyObj<ReportsService>;

  const mockReportTypes = [
    { id: 'daily-cash', name: 'تقرير إغلاق الصندوق اليومي', category: 'financial' },
    { id: 'aging', name: 'تقرير أعمار الذمم', category: 'financial' },
    { id: 'consumption', name: 'تقرير الاستهلاك', category: 'operational' },
    { id: 'collection', name: 'تقرير التحصيل', category: 'financial' },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ReportsService', [
      'getReportTypes',
      'generateReport',
      'exportReport',
      'getDailyCashClosing',
      'getDetailedAging',
      'getCustomerStatement',
    ]);
    spy.getReportTypes.and.returnValue(of(mockReportTypes));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [ReportsDashboardComponent],
      providers: [{ provide: ReportsService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsDashboardComponent);
    component = fixture.componentInstance;
    reportsService = TestBed.inject(ReportsService) as jasmine.SpyObj<ReportsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load report types on init', () => {
      fixture.detectChanges();
      expect(reportsService.getReportTypes).toHaveBeenCalled();
      expect(component.reportTypes.length).toBe(4);
    });

    it('should group reports by category', () => {
      fixture.detectChanges();
      expect(component.financialReports.length).toBe(3);
      expect(component.operationalReports.length).toBe(1);
    });
  });

  describe('Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display report names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('تقرير إغلاق الصندوق اليومي');
      expect(compiled.textContent).toContain('تقرير أعمار الذمم');
    });

    it('should display category sections', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('التقارير المالية');
      expect(compiled.textContent).toContain('التقارير التشغيلية');
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate daily cash closing report', () => {
      const mockReport = { date: '2024-02-15', totalCash: 5000, totalCard: 2000 };
      reportsService.getDailyCashClosing.and.returnValue(of(mockReport));

      component.generateDailyCashReport('2024-02-15');

      expect(reportsService.getDailyCashClosing).toHaveBeenCalledWith('2024-02-15');
    });

    it('should generate aging report', () => {
      const mockReport = { totalDebt: 100000, aging: [] };
      reportsService.getDetailedAging.and.returnValue(of(mockReport));

      component.generateAgingReport();

      expect(reportsService.getDetailedAging).toHaveBeenCalled();
    });

    it('should generate customer statement', () => {
      const mockStatement = { customer: {}, transactions: [] };
      reportsService.getCustomerStatement.and.returnValue(of(mockStatement));

      component.generateCustomerStatement('cust-1', '2024-01-01', '2024-02-28');

      expect(reportsService.getCustomerStatement).toHaveBeenCalledWith('cust-1', '2024-01-01', '2024-02-28');
    });
  });

  describe('Report Export', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should export report as PDF', () => {
      reportsService.exportReport.and.returnValue(of(new Blob()));

      component.exportReport('daily-cash', 'pdf', { date: '2024-02-15' });

      expect(reportsService.exportReport).toHaveBeenCalledWith('daily-cash', 'pdf', { date: '2024-02-15' });
    });

    it('should export report as Excel', () => {
      reportsService.exportReport.and.returnValue(of(new Blob()));

      component.exportReport('aging', 'excel', {});

      expect(reportsService.exportReport).toHaveBeenCalledWith('aging', 'excel', {});
    });
  });

  describe('Report Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select report type', () => {
      component.selectReport('daily-cash');
      expect(component.selectedReport).toBe('daily-cash');
    });

    it('should show report parameters form', () => {
      component.selectReport('daily-cash');
      expect(component.showParametersForm).toBeTrue();
    });

    it('should clear selection', () => {
      component.selectReport('daily-cash');
      component.clearSelection();
      expect(component.selectedReport).toBeNull();
      expect(component.showParametersForm).toBeFalse();
    });
  });

  describe('Error Handling', () => {
    it('should handle report generation error', () => {
      fixture.detectChanges();
      reportsService.getDailyCashClosing.and.returnValue(throwError(() => new Error('Generation failed')));

      component.generateDailyCashReport('2024-02-15');

      expect(component.error).toBeTruthy();
    });

    it('should handle export error', () => {
      fixture.detectChanges();
      reportsService.exportReport.and.returnValue(throwError(() => new Error('Export failed')));

      component.exportReport('daily-cash', 'pdf', {});

      expect(component.error).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading during report generation', () => {
      fixture.detectChanges();
      component.generateDailyCashReport('2024-02-15');
      expect(component.generatingReport).toBeTrue();
    });
  });
});
