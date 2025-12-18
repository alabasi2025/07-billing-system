import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CategoriesComponent } from './categories.component';
import { CategoriesService } from '../services/categories.service';

describe('CategoriesComponent', () => {
  let component: CategoriesComponent;
  let fixture: ComponentFixture<CategoriesComponent>;
  let categoriesService: jasmine.SpyObj<CategoriesService>;

  const mockCategories = [
    { id: '1', name: 'سكني', code: 'RES', description: 'عملاء سكنيين', isActive: true, customerCount: 150 },
    { id: '2', name: 'تجاري', code: 'COM', description: 'عملاء تجاريين', isActive: true, customerCount: 50 },
    { id: '3', name: 'صناعي', code: 'IND', description: 'عملاء صناعيين', isActive: false, customerCount: 20 },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('CategoriesService', [
      'getCategories',
      'getCategory',
      'createCategory',
      'updateCategory',
      'deleteCategory',
    ]);
    spy.getCategories.and.returnValue(of({ data: mockCategories, meta: { total: 3 } }));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [CategoriesComponent],
      providers: [{ provide: CategoriesService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
    categoriesService = TestBed.inject(CategoriesService) as jasmine.SpyObj<CategoriesService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load categories on init', () => {
      fixture.detectChanges();
      expect(categoriesService.getCategories).toHaveBeenCalled();
      expect(component.categories.length).toBe(3);
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

    it('should display category names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('سكني');
      expect(compiled.textContent).toContain('تجاري');
    });

    it('should display category codes', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('RES');
      expect(compiled.textContent).toContain('COM');
    });

    it('should display customer counts', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('150');
      expect(compiled.textContent).toContain('50');
    });

    it('should display status badges', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('نشط');
      expect(compiled.textContent).toContain('غير نشط');
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open create form', () => {
      component.openCreateForm();
      expect(component.showForm).toBeTrue();
      expect(component.editingCategory).toBeNull();
    });

    it('should open edit form', () => {
      component.openEditForm(mockCategories[0]);
      expect(component.showForm).toBeTrue();
      expect(component.editingCategory).toEqual(mockCategories[0]);
    });

    it('should create category', () => {
      const newCategory = { name: 'حكومي', code: 'GOV', description: 'جهات حكومية' };
      categoriesService.createCategory.and.returnValue(of({ id: 'new-id', ...newCategory }));

      component.saveCategory(newCategory);

      expect(categoriesService.createCategory).toHaveBeenCalledWith(newCategory);
    });

    it('should update category', () => {
      component.editingCategory = mockCategories[0];
      const updateData = { name: 'سكني محدث' };
      categoriesService.updateCategory.and.returnValue(of({ ...mockCategories[0], ...updateData }));

      component.saveCategory(updateData);

      expect(categoriesService.updateCategory).toHaveBeenCalledWith('1', updateData);
    });

    it('should delete category after confirmation', () => {
      categoriesService.deleteCategory.and.returnValue(of({ success: true }));
      spyOn(window, 'confirm').and.returnValue(true);

      component.deleteCategory('3');

      expect(categoriesService.deleteCategory).toHaveBeenCalledWith('3');
    });

    it('should not delete category with customers', () => {
      spyOn(window, 'alert');

      component.deleteCategory('1'); // Has 150 customers

      expect(categoriesService.deleteCategory).not.toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.openCreateForm();
    });

    it('should require name', () => {
      component.categoryForm.patchValue({ name: '', code: 'TEST' });
      expect(component.categoryForm.valid).toBeFalse();
    });

    it('should require code', () => {
      component.categoryForm.patchValue({ name: 'Test', code: '' });
      expect(component.categoryForm.valid).toBeFalse();
    });

    it('should validate code format', () => {
      component.categoryForm.patchValue({ name: 'Test', code: 'test123!' });
      expect(component.categoryForm.get('code')?.valid).toBeFalse();
    });

    it('should accept valid code format', () => {
      component.categoryForm.patchValue({ name: 'Test', code: 'TST' });
      expect(component.categoryForm.get('code')?.valid).toBeTrue();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by status', () => {
      component.filterByStatus(true);
      expect(categoriesService.getCategories).toHaveBeenCalledWith(jasmine.objectContaining({ isActive: true }));
    });

    it('should search by name', () => {
      component.search('سكني');
      expect(categoriesService.getCategories).toHaveBeenCalledWith(jasmine.objectContaining({ search: 'سكني' }));
    });

    it('should clear filters', () => {
      component.filterByStatus(true);
      component.clearFilters();
      expect(component.filters).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      categoriesService.getCategories.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.error).toBeTruthy();
    });

    it('should handle save error', () => {
      fixture.detectChanges();
      categoriesService.createCategory.and.returnValue(throwError(() => new Error('Save failed')));

      component.saveCategory({ name: 'Test', code: 'TST' });

      expect(component.error).toBeTruthy();
    });

    it('should handle delete error', () => {
      fixture.detectChanges();
      categoriesService.deleteCategory.and.returnValue(throwError(() => new Error('Delete failed')));
      spyOn(window, 'confirm').and.returnValue(true);

      component.deleteCategory('3');

      expect(component.error).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no categories', () => {
      categoriesService.getCategories.and.returnValue(of({ data: [], meta: { total: 0 } }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا توجد تصنيفات');
    });
  });
});
