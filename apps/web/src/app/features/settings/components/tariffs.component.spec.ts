import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { TariffsComponent } from './tariffs.component';
import { TariffsService } from '../services/tariffs.service';

describe('TariffsComponent', () => {
  let component: TariffsComponent;
  let fixture: ComponentFixture<TariffsComponent>;
  let tariffsService: jasmine.SpyObj<TariffsService>;

  const mockTariffs = [
    { 
      id: '1', 
      name: 'سكني', 
      code: 'RES', 
      slabs: [
        { from: 0, to: 100, rate: 0.18 },
        { from: 101, to: 200, rate: 0.25 },
        { from: 201, to: null, rate: 0.32 },
      ],
      isActive: true,
    },
    { 
      id: '2', 
      name: 'تجاري', 
      code: 'COM', 
      slabs: [
        { from: 0, to: null, rate: 0.30 },
      ],
      isActive: true,
    },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TariffsService', [
      'getTariffs',
      'getTariff',
      'createTariff',
      'updateTariff',
      'deleteTariff',
      'activateTariff',
      'deactivateTariff',
    ]);
    spy.getTariffs.and.returnValue(of({ data: mockTariffs, meta: { total: 2 } }));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [TariffsComponent],
      providers: [{ provide: TariffsService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TariffsComponent);
    component = fixture.componentInstance;
    tariffsService = TestBed.inject(TariffsService) as jasmine.SpyObj<TariffsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load tariffs on init', () => {
      fixture.detectChanges();
      expect(tariffsService.getTariffs).toHaveBeenCalled();
      expect(component.tariffs.length).toBe(2);
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

    it('should display tariff names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('سكني');
      expect(compiled.textContent).toContain('تجاري');
    });

    it('should display tariff codes', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('RES');
      expect(compiled.textContent).toContain('COM');
    });

    it('should display slab rates', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('0.18');
      expect(compiled.textContent).toContain('0.25');
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open create form', () => {
      component.openCreateForm();
      expect(component.showForm).toBeTrue();
      expect(component.editingTariff).toBeNull();
    });

    it('should open edit form', () => {
      component.openEditForm(mockTariffs[0]);
      expect(component.showForm).toBeTrue();
      expect(component.editingTariff).toEqual(mockTariffs[0]);
    });

    it('should create tariff', () => {
      const newTariff = { name: 'صناعي', code: 'IND', slabs: [] };
      tariffsService.createTariff.and.returnValue(of({ id: 'new-id', ...newTariff }));

      component.saveTariff(newTariff);

      expect(tariffsService.createTariff).toHaveBeenCalledWith(newTariff);
    });

    it('should update tariff', () => {
      component.editingTariff = mockTariffs[0];
      const updateData = { name: 'سكني محدث' };
      tariffsService.updateTariff.and.returnValue(of({ ...mockTariffs[0], ...updateData }));

      component.saveTariff(updateData);

      expect(tariffsService.updateTariff).toHaveBeenCalledWith('1', updateData);
    });

    it('should delete tariff after confirmation', () => {
      tariffsService.deleteTariff.and.returnValue(of({ success: true }));
      spyOn(window, 'confirm').and.returnValue(true);

      component.deleteTariff('1');

      expect(tariffsService.deleteTariff).toHaveBeenCalledWith('1');
    });

    it('should not delete if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteTariff('1');

      expect(tariffsService.deleteTariff).not.toHaveBeenCalled();
    });
  });

  describe('Slab Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.openCreateForm();
    });

    it('should add slab', () => {
      component.addSlab();
      expect(component.slabs.length).toBe(1);
    });

    it('should remove slab', () => {
      component.addSlab();
      component.addSlab();
      component.removeSlab(0);
      expect(component.slabs.length).toBe(1);
    });

    it('should validate slab ranges', () => {
      component.slabs = [
        { from: 0, to: 100, rate: 0.18 },
        { from: 50, to: 200, rate: 0.25 }, // Overlapping
      ];
      
      expect(component.validateSlabs()).toBeFalse();
    });

    it('should accept valid slab ranges', () => {
      component.slabs = [
        { from: 0, to: 100, rate: 0.18 },
        { from: 101, to: 200, rate: 0.25 },
      ];
      
      expect(component.validateSlabs()).toBeTrue();
    });
  });

  describe('Activation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should activate tariff', () => {
      tariffsService.activateTariff.and.returnValue(of({ success: true }));

      component.activateTariff('2');

      expect(tariffsService.activateTariff).toHaveBeenCalledWith('2');
    });

    it('should deactivate tariff', () => {
      tariffsService.deactivateTariff.and.returnValue(of({ success: true }));

      component.deactivateTariff('1');

      expect(tariffsService.deactivateTariff).toHaveBeenCalledWith('1');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.openCreateForm();
    });

    it('should require name', () => {
      component.tariffForm.patchValue({ name: '', code: 'TEST' });
      expect(component.tariffForm.valid).toBeFalse();
    });

    it('should require code', () => {
      component.tariffForm.patchValue({ name: 'Test', code: '' });
      expect(component.tariffForm.valid).toBeFalse();
    });

    it('should require at least one slab', () => {
      component.slabs = [];
      expect(component.canSave()).toBeFalse();
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      tariffsService.getTariffs.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.error).toBeTruthy();
    });

    it('should handle save error', () => {
      fixture.detectChanges();
      tariffsService.createTariff.and.returnValue(throwError(() => new Error('Save failed')));

      component.saveTariff({ name: 'Test', code: 'TST', slabs: [] });

      expect(component.error).toBeTruthy();
    });
  });

  describe('Cancel Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close form on cancel', () => {
      component.openCreateForm();
      component.cancelForm();
      expect(component.showForm).toBeFalse();
    });

    it('should reset form on cancel', () => {
      component.openCreateForm();
      component.tariffForm.patchValue({ name: 'Test' });
      component.cancelForm();
      
      component.openCreateForm();
      expect(component.tariffForm.get('name')?.value).toBe('');
    });
  });
});
