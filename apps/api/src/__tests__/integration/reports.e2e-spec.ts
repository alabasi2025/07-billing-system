/**
 * اختبارات التكامل - التقارير
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Reports Integration Tests (e2e)', () => {
  let app: INestApplication;

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

  describe('Dashboard Reports', () => {
    it('GET /api/v1/reports/dashboard - should return dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('customers');
      expect(response.body.data).toHaveProperty('meters');
      expect(response.body.data).toHaveProperty('invoices');
      expect(response.body.data).toHaveProperty('revenue');
    });
  });

  describe('Revenue Reports', () => {
    it('GET /api/v1/reports/revenue - should return revenue report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/revenue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totals');
    });

    it('GET /api/v1/reports/revenue - should filter by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/revenue?fromDate=2024-01-01&toDate=2024-12-31')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/v1/reports/revenue - should group by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/revenue?groupBy=category')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Customer Reports', () => {
    it('GET /api/v1/reports/customers - should return customer report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/customers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
    });

    it('GET /api/v1/reports/customers - should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/customers?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Consumption Reports', () => {
    it('GET /api/v1/reports/consumption - should return consumption report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/consumption')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
    });

    it('GET /api/v1/reports/consumption - should filter by billing period', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/consumption?billingPeriod=2024-01')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Outstanding Reports', () => {
    it('GET /api/v1/reports/outstanding - should return outstanding report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/outstanding')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('summary');
    });
  });

  describe('Daily Cash Closing Report', () => {
    it('GET /api/v1/reports/daily-cash-closing - should return daily cash closing report', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app.getHttpServer())
        .get(`/api/v1/reports/daily-cash-closing?date=${today}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('date');
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('byMethod');
      expect(response.body.data).toHaveProperty('totals');
      expect(response.body.data).toHaveProperty('closingBalance');
    });

    it('GET /api/v1/reports/daily-cash-closing - should filter by POS terminal', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app.getHttpServer())
        .get(`/api/v1/reports/daily-cash-closing?date=${today}&posTerminalId=test-terminal`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Detailed Aging Report', () => {
    it('GET /api/v1/reports/detailed-aging - should return detailed aging report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/detailed-aging')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('asOfDate');
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totals');
      expect(response.body.data).toHaveProperty('percentages');
    });

    it('GET /api/v1/reports/detailed-aging - should filter by minimum balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/detailed-aging?minBalance=100')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/v1/reports/detailed-aging - totals should include aging buckets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/detailed-aging')
        .expect(200);

      const totals = response.body.data.totals;
      expect(totals).toHaveProperty('current');
      expect(totals).toHaveProperty('days1to30');
      expect(totals).toHaveProperty('days31to60');
      expect(totals).toHaveProperty('days61to90');
      expect(totals).toHaveProperty('days90plus');
      expect(totals).toHaveProperty('total');
    });
  });

  describe('Collection Reports', () => {
    it('GET /api/v1/reports/collection - should return collection report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/collection')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('byMethod');
      expect(response.body.data).toHaveProperty('totals');
    });

    it('GET /api/v1/reports/collection - should filter by payment method', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/collection?paymentMethod=cash')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Meter Reports', () => {
    it('GET /api/v1/reports/meters - should return meter report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/meters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
    });
  });

  describe('Subsidy Reports', () => {
    it('GET /api/v1/reports/subsidy - should return subsidy report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/subsidy')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Installment Reports', () => {
    it('GET /api/v1/reports/installments - should return installment report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/installments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('summary');
    });
  });

  describe('Disconnection Reports', () => {
    it('GET /api/v1/reports/disconnections - should return disconnection report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/disconnections')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('summary');
    });
  });

  describe('Complaint Reports', () => {
    it('GET /api/v1/reports/complaints - should return complaint report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/complaints')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totals');
    });
  });
});
