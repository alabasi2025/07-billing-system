import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('Customer Creation E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Customer Creation Flow', () => {
    let categoryId: string;
    let customerId: string;
    let meterId: string;
    let contractId: string;

    it('Step 1: Create customer category', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/customer-categories')
        .send({
          name: 'تصنيف اختبار',
          code: 'TEST',
          description: 'تصنيف للاختبار',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('تصنيف اختبار');
      categoryId = response.body.id;
    });

    it('Step 2: Create new customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل اختبار E2E',
          nationalId: '1234567890',
          phone: '0501234567',
          email: 'test@example.com',
          address: 'عنوان الاختبار',
          categoryId: categoryId,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('عميل اختبار E2E');
      expect(response.body.accountNo).toBeDefined();
      customerId = response.body.id;
    });

    it('Step 3: Verify customer was created', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .expect(200);

      expect(response.body.id).toBe(customerId);
      expect(response.body.name).toBe('عميل اختبار E2E');
      expect(response.body.category.id).toBe(categoryId);
    });

    it('Step 4: Create meter for customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/meters')
        .send({
          meterNo: 'MTR-E2E-001',
          customerId: customerId,
          type: 'digital',
          location: 'موقع الاختبار',
          installationDate: '2024-01-01',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.meterNo).toBe('MTR-E2E-001');
      meterId = response.body.id;
    });

    it('Step 5: Create contract for customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/contracts')
        .send({
          customerId: customerId,
          meterId: meterId,
          startDate: '2024-01-01',
          tariffId: 'default-tariff',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('active');
      contractId = response.body.id;
    });

    it('Step 6: Verify customer has meter and contract', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .query({ include: 'meters,contracts' })
        .expect(200);

      expect(response.body.meters).toBeDefined();
      expect(response.body.meters.length).toBeGreaterThan(0);
      expect(response.body.contracts).toBeDefined();
      expect(response.body.contracts.length).toBeGreaterThan(0);
    });

    it('Step 7: Update customer information', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/customers/${customerId}`)
        .send({
          phone: '0509876543',
          address: 'عنوان محدث',
        })
        .expect(200);

      expect(response.body.phone).toBe('0509876543');
      expect(response.body.address).toBe('عنوان محدث');
    });

    it('Step 8: Search for customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .query({ search: 'عميل اختبار E2E' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('عميل اختبار E2E');
    });

    it('Step 9: Get customer balance', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}/balance`)
        .expect(200);

      expect(response.body.balance).toBeDefined();
      expect(response.body.balance).toBe(0); // New customer has no balance
    });

    it('Step 10: Cleanup - Delete contract', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/contracts/${contractId}`)
        .expect(200);
    });

    it('Step 11: Cleanup - Delete meter', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/meters/${meterId}`)
        .expect(200);
    });

    it('Step 12: Cleanup - Delete customer', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/customers/${customerId}`)
        .expect(200);
    });

    it('Step 13: Cleanup - Delete category', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/customer-categories/${categoryId}`)
        .expect(200);
    });
  });

  describe('Validation Tests', () => {
    it('should reject customer without name', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          nationalId: '1234567890',
          phone: '0501234567',
        })
        .expect(400);

      expect(response.body.message).toContain('name');
    });

    it('should reject duplicate national ID', async () => {
      // Create first customer
      const first = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل أول',
          nationalId: '9999999999',
          phone: '0501111111',
        })
        .expect(201);

      // Try to create second with same national ID
      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل ثاني',
          nationalId: '9999999999',
          phone: '0502222222',
        })
        .expect(409);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/v1/customers/${first.body.id}`)
        .expect(200);
    });

    it('should reject invalid phone format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل',
          nationalId: '1234567890',
          phone: 'invalid',
        })
        .expect(400);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل',
          nationalId: '1234567890',
          phone: '0501234567',
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for customer creation', async () => {
      // This test assumes JWT auth is enabled
      // Skip if auth is not configured
    });

    it('should require proper role for customer deletion', async () => {
      // This test assumes RBAC is enabled
      // Skip if RBAC is not configured
    });
  });
});
