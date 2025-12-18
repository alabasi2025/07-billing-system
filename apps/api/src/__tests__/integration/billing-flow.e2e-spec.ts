/**
 * اختبارات التكامل - مسار الفوترة الكامل
 * 
 * يختبر هذا الملف المسار الكامل من إنشاء العميل حتى تسجيل الدفعة
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Billing Flow Integration Tests (e2e)', () => {
  let app: INestApplication;
  let customerId: string;
  let meterId: string;
  let readingId: string;
  let invoiceId: string;
  let paymentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Customer Management', () => {
    it('should create a new customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل اختبار التكامل',
          categoryId: 'test-category-id',
          idType: 'national_id',
          idNumber: '1234567890',
          phone: '0501234567',
          address: 'عنوان الاختبار',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      customerId = response.body.data.id;
    });

    it('should get customer by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('عميل اختبار التكامل');
    });

    it('should get customer statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
    });
  });

  describe('2. Meter Management', () => {
    it('should create a new meter for customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/meters')
        .send({
          meterNo: 'MTR-TEST-001',
          meterTypeId: 'test-meter-type-id',
          customerId: customerId,
          installationDate: new Date().toISOString(),
          location: 'موقع الاختبار',
          initialReading: 0,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      meterId = response.body.data.id;
    });

    it('should get meter by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/meters/${meterId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.meterNo).toBe('MTR-TEST-001');
    });
  });

  describe('3. Reading Management', () => {
    it('should create a new reading', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/readings')
        .send({
          meterId: meterId,
          readingValue: 500,
          readingDate: new Date().toISOString(),
          readingType: 'actual',
          billingPeriod: '2024-01',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      readingId = response.body.data.id;
    });

    it('should validate reading', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/readings/validate')
        .send({
          meterId: meterId,
          readingValue: 600,
          previousReading: 500,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBeDefined();
    });
  });

  describe('4. Invoice Generation', () => {
    it('should generate invoice for customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/invoices/generate')
        .send({
          customerId: customerId,
          billingPeriod: '2024-01',
          readingId: readingId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.invoiceNo).toBeDefined();
      invoiceId = response.body.data.id;
    });

    it('should get invoice by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/invoices/${invoiceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerId).toBe(customerId);
    });

    it('should calculate consumption correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/invoices/calculate')
        .send({
          customerId: customerId,
          previousReading: 0,
          currentReading: 500,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consumption).toBe(500);
    });
  });

  describe('5. Payment Processing', () => {
    it('should create payment for invoice', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({
          customerId: customerId,
          invoiceId: invoiceId,
          amount: 100,
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.paymentNo).toBeDefined();
      paymentId = response.body.data.id;
    });

    it('should get payment by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(100);
    });

    it('should update invoice payment status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/invoices/${invoiceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paidAmount).toBeGreaterThan(0);
    });
  });

  describe('6. Reports', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toBeDefined();
      expect(response.body.data.invoices).toBeDefined();
    });

    it('should get revenue report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/revenue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
    });

    it('should get daily cash closing report', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app.getHttpServer())
        .get(`/api/v1/reports/daily-cash-closing?date=${today}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totals).toBeDefined();
    });

    it('should get detailed aging report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/detailed-aging')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totals).toBeDefined();
    });

    it('should get customer statement', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/reports/customer-statement/${customerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toBeDefined();
      expect(response.body.data.transactions).toBeDefined();
    });
  });

  describe('7. Customer Balance', () => {
    it('should get customer balance', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}/balance`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInvoiced).toBeDefined();
      expect(response.body.data.totalPaid).toBeDefined();
      expect(response.body.data.balance).toBeDefined();
    });
  });

  describe('8. Cleanup', () => {
    it('should soft delete customer', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/customers/${customerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
