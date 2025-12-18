import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { SettingsService } from '../services/settings.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: jasmine.SpyObj<SettingsService>;

  const mockSettings = {
    general: {
      companyName: 'شركة الكهرباء',
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      language: 'ar',
    },
    billing: {
      billingCycleDay: 1,
      dueDateDays: 15,
      lateFeePercentage: 5,
      vatPercentage: 15,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      reminderDays: [7, 3, 1],
    },
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('SettingsService', [
      'getSettings',
      'updateSettings',
      'getCategories',
      'getTariffs',
      'getBillingCycles',
    ]);
    spy.getSettings.and.returnValue(of(mockSettings));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [SettingsComponent],
      providers: [{ provide: SettingsService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load settings on init', () => {
      fixture.detectChanges();
      expect(settingsService.getSettings).toHaveBeenCalled();
      expect(component.settings).toEqual(mockSettings);
    });

    it('should set loading to false after data loads', () => {
      fixture.detectChanges();
      expect(component.loading).toBeFalse();
    });

    it('should initialize form with settings values', () => {
      fixture.detectChanges();
      expect(component.generalForm.get('companyName')?.value).toBe('شركة الكهرباء');
    });
  });

  describe('Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display settings tabs', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('الإعدادات العامة');
      expect(compiled.textContent).toContain('إعدادات الفوترة');
      expect(compiled.textContent).toContain('الإشعارات');
    });

    it('should display company name', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('شركة الكهرباء');
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should switch to general tab', () => {
      component.selectTab('general');
      expect(component.activeTab).toBe('general');
    });

    it('should switch to billing tab', () => {
      component.selectTab('billing');
      expect(component.activeTab).toBe('billing');
    });

    it('should switch to notifications tab', () => {
      component.selectTab('notifications');
      expect(component.activeTab).toBe('notifications');
    });
  });

  describe('General Settings', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update company name', () => {
      component.generalForm.patchValue({ companyName: 'شركة جديدة' });
      expect(component.generalForm.get('companyName')?.value).toBe('شركة جديدة');
    });

    it('should validate required fields', () => {
      component.generalForm.patchValue({ companyName: '' });
      expect(component.generalForm.valid).toBeFalse();
    });

    it('should save general settings', () => {
      settingsService.updateSettings.and.returnValue(of({ success: true }));
      
      component.saveGeneralSettings();

      expect(settingsService.updateSettings).toHaveBeenCalledWith('general', jasmine.any(Object));
    });
  });

  describe('Billing Settings', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTab('billing');
    });

    it('should update billing cycle day', () => {
      component.billingForm.patchValue({ billingCycleDay: 15 });
      expect(component.billingForm.get('billingCycleDay')?.value).toBe(15);
    });

    it('should validate billing cycle day range', () => {
      component.billingForm.patchValue({ billingCycleDay: 32 });
      expect(component.billingForm.get('billingCycleDay')?.valid).toBeFalse();
    });

    it('should update VAT percentage', () => {
      component.billingForm.patchValue({ vatPercentage: 20 });
      expect(component.billingForm.get('vatPercentage')?.value).toBe(20);
    });

    it('should save billing settings', () => {
      settingsService.updateSettings.and.returnValue(of({ success: true }));
      
      component.saveBillingSettings();

      expect(settingsService.updateSettings).toHaveBeenCalledWith('billing', jasmine.any(Object));
    });
  });

  describe('Notification Settings', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectTab('notifications');
    });

    it('should toggle email notifications', () => {
      component.notificationsForm.patchValue({ emailEnabled: false });
      expect(component.notificationsForm.get('emailEnabled')?.value).toBeFalse();
    });

    it('should toggle SMS notifications', () => {
      component.notificationsForm.patchValue({ smsEnabled: false });
      expect(component.notificationsForm.get('smsEnabled')?.value).toBeFalse();
    });

    it('should update reminder days', () => {
      component.notificationsForm.patchValue({ reminderDays: [10, 5, 1] });
      expect(component.notificationsForm.get('reminderDays')?.value).toEqual([10, 5, 1]);
    });

    it('should save notification settings', () => {
      settingsService.updateSettings.and.returnValue(of({ success: true }));
      
      component.saveNotificationSettings();

      expect(settingsService.updateSettings).toHaveBeenCalledWith('notifications', jasmine.any(Object));
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable save button when form is invalid', () => {
      component.generalForm.patchValue({ companyName: '' });
      expect(component.canSaveGeneral()).toBeFalse();
    });

    it('should enable save button when form is valid', () => {
      component.generalForm.patchValue({ companyName: 'شركة صالحة' });
      expect(component.canSaveGeneral()).toBeTrue();
    });

    it('should show validation errors', () => {
      component.generalForm.patchValue({ companyName: '' });
      component.generalForm.get('companyName')?.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('مطلوب');
    });
  });

  describe('Save Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show success message after save', () => {
      settingsService.updateSettings.and.returnValue(of({ success: true }));
      
      component.saveGeneralSettings();

      expect(component.successMessage).toBeTruthy();
    });

    it('should handle save error', () => {
      settingsService.updateSettings.and.returnValue(throwError(() => new Error('Save failed')));
      
      component.saveGeneralSettings();

      expect(component.error).toBeTruthy();
    });

    it('should show loading during save', () => {
      settingsService.updateSettings.and.returnValue(of({ success: true }));
      
      component.saveGeneralSettings();

      expect(component.saving).toBeFalse(); // After completion
    });
  });

  describe('Reset Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to original values', () => {
      component.generalForm.patchValue({ companyName: 'تغيير' });
      component.resetGeneralForm();

      expect(component.generalForm.get('companyName')?.value).toBe('شركة الكهرباء');
    });

    it('should confirm before reset', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.generalForm.patchValue({ companyName: 'تغيير' });
      
      component.resetGeneralForm();

      expect(component.generalForm.get('companyName')?.value).toBe('تغيير');
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      settingsService.getSettings.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.error).toBeTruthy();
    });
  });
});
