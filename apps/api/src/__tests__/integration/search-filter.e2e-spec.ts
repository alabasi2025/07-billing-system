import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('Search and Filter E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testCustomerIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup: Create test customers
    const customers = [
      { name: 'أحمد محمد علي', nationalId: '3001', phone: '0501001001', status: 'active' },
      { name: 'محمد أحمد سعيد', nationalId: '3002', phone: '0501002002', status: 'active' },
      { name: 'علي سعيد أحمد', nationalId: '3003', phone: '0501003003', status: 'inactive' },
      { name: 'سعيد علي محمد', nationalId: '3004', phone: '0501004004', status: 'active' },
      { name: 'خالد عبدالله', nationalId: '3005', phone: '0501005005', status: 'suspended' },
    ];

    for (const customer of customers) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send(customer);
      if (response.body.id) {
        testCustomerIds.push(response.body.id);
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    for (const id of testCustomerIds) {
      await request(app.getHttpServer()).delete(`/api/v1/customers/${id}`);
    }
    await app.close();
  });

  describe('Customer Search', () => {
    it('should search by exact name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ search: 'أحمد محمد علي' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toBe('أحمد محمد علي');
    });

    it('should search by partial name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ search: 'أحمد' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should search by phone number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ search: '0501001001' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].phone).toBe('0501001001');
    });

    it('should search by national ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ search: '3001' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
    });

    it('should return empty for non-matching search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ search: 'غير موجود' })
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });
  });

  describe('Customer Filtering', () => {
    it('should filter by status active', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ status: 'active' })
        .expect(200);

      response.body.data.forEach((customer: any) => {
        expect(customer.status).toBe('active');
      });
    });

    it('should filter by status inactive', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ status: 'inactive' })
        .expect(200);

      response.body.data.forEach((customer: any) => {
        expect(customer.status).toBe('inactive');
      });
    });

    it('should filter by status suspended', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ status: 'suspended' })
        .expect(200);

      response.body.data.forEach((customer: any) => {
        expect(customer.status).toBe('suspended');
      });
    });

    it('should combine search and filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ search: 'أحمد', status: 'active' })
        .expect(200);

      response.body.data.forEach((customer: any) => {
        expect(customer.name).toContain('أحمد');
        expect(customer.status).toBe('active');
      });
    });
  });

  describe('Pagination', () => {
    it('should return first page', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should return second page', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(response.body.meta.page).toBe(2);
    });

    it('should return total count', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.meta.total).toBeDefined();
      expect(response.body.meta.total).toBeGreaterThanOrEqual(5);
    });

    it('should return empty for out of range page', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ page: 1000, limit: 10 })
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });
  });

  describe('Sorting', () => {
    it('should sort by name ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      const names = response.body.data.map((c: any) => c.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b, 'ar'));
      expect(names).toEqual(sortedNames);
    });

    it('should sort by name descending', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ sortBy: 'name', sortOrder: 'desc' })
        .expect(200);

      const names = response.body.data.map((c: any) => c.name);
      const sortedNames = [...names].sort((a, b) => b.localeCompare(a, 'ar'));
      expect(names).toEqual(sortedNames);
    });

    it('should sort by created date', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Invoice Search and Filter', () => {
    it('should search invoices by invoice number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/invoices')
        .query({ search: 'INV-' })
        .expect(200);

      // May return empty if no invoices exist
      expect(response.body.data).toBeDefined();
    });

    it('should filter invoices by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/invoices')
        .query({ status: 'unpaid' })
        .expect(200);

      response.body.data.forEach((invoice: any) => {
        expect(invoice.status).toBe('unpaid');
      });
    });

    it('should filter invoices by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/invoices')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter invoices by amount range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/invoices')
        .query({
          minAmount: 100,
          maxAmount: 1000,
        })
        .expect(200);

      response.body.data.forEach((invoice: any) => {
        expect(invoice.totalAmount).toBeGreaterThanOrEqual(100);
        expect(invoice.totalAmount).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('Payment Search and Filter', () => {
    it('should search payments by receipt number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .query({ search: 'RCP-' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter payments by method', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .query({ paymentMethod: 'cash' })
        .expect(200);

      response.body.data.forEach((payment: any) => {
        expect(payment.paymentMethod).toBe('cash');
      });
    });

    it('should filter payments by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('Meter Search and Filter', () => {
    it('should search meters by meter number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/meters')
        .query({ search: 'MTR-' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter meters by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/meters')
        .query({ type: 'digital' })
        .expect(200);

      response.body.data.forEach((meter: any) => {
        expect(meter.type).toBe('digital');
      });
    });

    it('should filter meters by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/meters')
        .query({ status: 'active' })
        .expect(200);

      response.body.data.forEach((meter: any) => {
        expect(meter.status).toBe('active');
      });
    });
  });
});
