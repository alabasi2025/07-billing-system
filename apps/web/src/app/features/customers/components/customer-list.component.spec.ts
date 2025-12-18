import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CustomerListComponent } from './customer-list.component';
import { CustomersService } from '../services/customers.service';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let customersServiceSpy: jasmine.SpyObj<CustomersService>;

  const mockCustomers = [
    {
      id: '1',
      accountNo: 'ACC-001',
      name: 'أحمد محمد',
      phone: '0501234567',
      status: 'active',
      category: { name: 'سكني' },
      balance: 500,
    },
    {
      id: '2',
      accountNo: 'ACC-002',
      name: 'سارة علي',
      phone: '0507654321',
      status: 'suspended',
      category: { name: 'تجاري' },
      balance: 1200,
    },
    {
      id: '3',
      accountNo: 'ACC-003',
      name: 'محمد خالد',
      phone: '0509876543',
      status: 'active',
      category: { name: 'صناعي' },
      balance: 0,
    },
  ];

  const mockStatistics = {
    total: 100,
    active: 80,
    suspended: 15,
    disconnected: 5,
  };

  beforeEach(async () => {
    customersServiceSpy = jasmine.createSpyObj('CustomersService', [
      'getCustomers',
      'getStatistics',
      'deleteCustomer',
    ]);

    customersServiceSpy.getCustomers.and.returnValue(of({ 
      data: mockCustomers,
      meta: { total: 3, page: 1, limit: 10 }
    }));
    customersServiceSpy.getStatistics.and.returnValue(of({ data: mockStatistics }));
    customersServiceSpy.deleteCustomer.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [
        CustomerListComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        FormsModule,
      ],
      providers: [
        { provide: CustomersService, useValue: customersServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load customers on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(customersServiceSpy.getCustomers).toHaveBeenCalled();
      expect(component.customers.length).toBe(3);
    }));

    it('should load statistics on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(customersServiceSpy.getStatistics).toHaveBeenCalled();
      expect(component.statistics).toEqual(mockStatistics);
    }));

    it('should set loading to false after data loads', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading).toBeFalse();
    }));
  });

  describe('Customer Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display customer names', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('أحمد محمد');
      expect(compiled.textContent).toContain('سارة علي');
    });

    it('should display account numbers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('ACC-001');
      expect(compiled.textContent).toContain('ACC-002');
    });

    it('should display phone numbers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('0501234567');
    });

    it('should display customer categories', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('سكني');
      expect(compiled.textContent).toContain('تجاري');
    });
  });

  describe('Status Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return correct class for active status', () => {
      const statusClass = component.getStatusClass('active');
      expect(statusClass).toContain('green');
    });

    it('should return correct class for suspended status', () => {
      const statusClass = component.getStatusClass('suspended');
      expect(statusClass).toContain('yellow');
    });

    it('should return correct class for disconnected status', () => {
      const statusClass = component.getStatusClass('disconnected');
      expect(statusClass).toContain('red');
    });

    it('should return correct label for active status', () => {
      const label = component.getStatusLabel('active');
      expect(label).toBe('نشط');
    });

    it('should return correct label for suspended status', () => {
      const label = component.getStatusLabel('suspended');
      expect(label).toBe('موقوف');
    });
  });

  describe('Search and Filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter customers by search term', fakeAsync(() => {
      component.searchTerm = 'أحمد';
      component.onSearch();
      tick();

      expect(customersServiceSpy.getCustomers).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'أحمد' })
      );
    }));

    it('should filter customers by status', fakeAsync(() => {
      component.filterStatus = 'active';
      component.onFilterChange();
      tick();

      expect(customersServiceSpy.getCustomers).toHaveBeenCalledWith(
        jasmine.objectContaining({ status: 'active' })
      );
    }));

    it('should filter customers by category', fakeAsync(() => {
      component.filterCategory = 'category-id';
      component.onFilterChange();
      tick();

      expect(customersServiceSpy.getCustomers).toHaveBeenCalledWith(
        jasmine.objectContaining({ categoryId: 'category-id' })
      );
    }));

    it('should reset filters', fakeAsync(() => {
      component.searchTerm = 'test';
      component.filterStatus = 'active';
      component.resetFilters();
      tick();

      expect(component.searchTerm).toBe('');
      expect(component.filterStatus).toBe('');
    }));
  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should change page', fakeAsync(() => {
      component.onPageChange(2);
      tick();

      expect(component.currentPage).toBe(2);
      expect(customersServiceSpy.getCustomers).toHaveBeenCalledWith(
        jasmine.objectContaining({ page: 2 })
      );
    }));

    it('should change page size', fakeAsync(() => {
      component.onPageSizeChange(25);
      tick();

      expect(component.pageSize).toBe(25);
      expect(component.currentPage).toBe(1);
    }));
  });

  describe('Delete Customer', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call delete service', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.deleteCustomer('1');
      tick();

      expect(customersServiceSpy.deleteCustomer).toHaveBeenCalledWith('1');
    }));

    it('should not delete if not confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.deleteCustomer('1');
      tick();

      expect(customersServiceSpy.deleteCustomer).not.toHaveBeenCalled();
    }));

    it('should refresh list after delete', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      const initialCallCount = customersServiceSpy.getCustomers.calls.count();
      
      component.deleteCustomer('1');
      tick();

      expect(customersServiceSpy.getCustomers.calls.count()).toBeGreaterThan(initialCallCount);
    }));
  });

  describe('Error Handling', () => {
    it('should handle load error', fakeAsync(() => {
      customersServiceSpy.getCustomers.and.returnValue(throwError(() => new Error('Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.customers.length).toBe(0);
      expect(component.loading).toBeFalse();
    }));

    it('should handle delete error', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      customersServiceSpy.deleteCustomer.and.returnValue(throwError(() => new Error('Error')));
      
      fixture.detectChanges();
      tick();

      component.deleteCustomer('1');
      tick();

      // Should not crash
      expect(component).toBeTruthy();
    }));
  });

  describe('Statistics Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display total customers', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('100');
    });

    it('should display active customers count', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('80');
    });
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have link to add new customer', () => {
      const compiled = fixture.nativeElement;
      const link = compiled.querySelector('a[routerLink="/customers/new"]');
      expect(link).toBeTruthy();
    });

    it('should have link to view customer details', () => {
      const compiled = fixture.nativeElement;
      const links = compiled.querySelectorAll('a[routerLink*="/customers/"]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Balance Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format balance correctly', () => {
      const formatted = component.formatCurrency(1000);
      expect(formatted).toBeDefined();
    });

    it('should show balance with correct color for positive', () => {
      const balanceClass = component.getBalanceClass(500);
      expect(balanceClass).toContain('red');
    });

    it('should show balance with correct color for zero', () => {
      const balanceClass = component.getBalanceClass(0);
      expect(balanceClass).toContain('green');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no customers', fakeAsync(() => {
      customersServiceSpy.getCustomers.and.returnValue(of({ 
        data: [],
        meta: { total: 0, page: 1, limit: 10 }
      }));
      
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('لا يوجد عملاء');
    }));
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      component.loading = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.loading') || compiled.textContent.includes('جاري')).toBeTruthy();
    });
  });
});
