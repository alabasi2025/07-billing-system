import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('Meter Reading E2E', () => {
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

  describe('Complete Meter Reading Flow', () => {
    let customerId: string;
    let meterId: string;
    let readingId: string;
    let billingCycleId: string;

    beforeAll(async () => {
      // Setup: Create customer and meter
      const customerResponse = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل قراءة العداد',
          nationalId: '1111111111',
          phone: '0501111111',
        });
      customerId = customerResponse.body.id;

      const meterResponse = await request(app.getHttpServer())
        .post('/api/v1/meters')
        .send({
          meterNo: 'MTR-READ-001',
          customerId: customerId,
          type: 'digital',
          initialReading: 1000,
        });
      meterId = meterResponse.body.id;

      // Create billing cycle
      const cycleResponse = await request(app.getHttpServer())
        .post('/api/v1/billing-cycles')
        .send({
          name: 'دورة فبراير 2024',
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          readingStartDate: '2024-02-25',
          readingEndDate: '2024-02-28',
        });
      billingCycleId = cycleResponse.body.id;
    });

    afterAll(async () => {
      // Cleanup
      if (readingId) {
        await request(app.getHttpServer()).delete(`/api/v1/readings/${readingId}`);
      }
      if (billingCycleId) {
        await request(app.getHttpServer()).delete(`/api/v1/billing-cycles/${billingCycleId}`);
      }
      if (meterId) {
        await request(app.getHttpServer()).delete(`/api/v1/meters/${meterId}`);
      }
      if (customerId) {
        await request(app.getHttpServer()).delete(`/api/v1/customers/${customerId}`);
      }
    });

    it('Step 1: Get meter current reading', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/meters/${meterId}`)
        .expect(200);

      expect(response.body.lastReading).toBe(1000);
    });

    it('Step 2: Record new meter reading', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/readings')
        .send({
          meterId: meterId,
          billingCycleId: billingCycleId,
          currentReading: 1300,
          readingDate: '2024-02-26',
          readingType: 'actual',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.currentReading).toBe(1300);
      expect(response.body.previousReading).toBe(1000);
      expect(response.body.consumption).toBe(300);
      readingId = response.body.id;
    });

    it('Step 3: Verify reading was recorded', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/readings/${readingId}`)
        .expect(200);

      expect(response.body.id).toBe(readingId);
      expect(response.body.consumption).toBe(300);
    });

    it('Step 4: Verify meter last reading updated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/meters/${meterId}`)
        .expect(200);

      expect(response.body.lastReading).toBe(1300);
    });

    it('Step 5: Get meter reading history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/meters/${meterId}/readings`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('Step 6: Update reading', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/readings/${readingId}`)
        .send({
          currentReading: 1350,
          notes: 'تم تصحيح القراءة',
        })
        .expect(200);

      expect(response.body.currentReading).toBe(1350);
      expect(response.body.consumption).toBe(350);
    });

    it('Step 7: Get consumption report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/consumption')
        .query({
          meterId: meterId,
          fromDate: '2024-02-01',
          toDate: '2024-02-28',
        })
        .expect(200);

      expect(response.body.totalConsumption).toBeDefined();
    });
  });

  describe('Reading Validation Tests', () => {
    let testMeterId: string;
    let testCustomerId: string;

    beforeAll(async () => {
      const customerResponse = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          name: 'عميل اختبار التحقق',
          nationalId: '2222222222',
          phone: '0502222222',
        });
      testCustomerId = customerResponse.body.id;

      const meterResponse = await request(app.getHttpServer())
        .post('/api/v1/meters')
        .send({
          meterNo: 'MTR-VAL-001',
          customerId: testCustomerId,
          type: 'digital',
          initialReading: 5000,
        });
      testMeterId = meterResponse.body.id;
    });

    afterAll(async () => {
      if (testMeterId) {
        await request(app.getHttpServer()).delete(`/api/v1/meters/${testMeterId}`);
      }
      if (testCustomerId) {
        await request(app.getHttpServer()).delete(`/api/v1/customers/${testCustomerId}`);
      }
    });

    it('should reject reading less than previous', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/readings')
        .send({
          meterId: testMeterId,
          currentReading: 4000, // Less than initial 5000
          readingDate: '2024-02-26',
        })
        .expect(400);
    });

    it('should reject reading without meter ID', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/readings')
        .send({
          currentReading: 6000,
          readingDate: '2024-02-26',
        })
        .expect(400);
    });

    it('should reject reading without date', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/readings')
        .send({
          meterId: testMeterId,
          currentReading: 6000,
        })
        .expect(400);
    });

    it('should accept estimated reading', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/readings')
        .send({
          meterId: testMeterId,
          currentReading: 5500,
          readingDate: '2024-02-26',
          readingType: 'estimated',
          estimationReason: 'عداد غير متاح',
        })
        .expect(201);

      expect(response.body.readingType).toBe('estimated');

      // Cleanup
      await request(app.getHttpServer()).delete(`/api/v1/readings/${response.body.id}`);
    });

    it('should flag abnormal consumption', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/readings')
        .send({
          meterId: testMeterId,
          currentReading: 15000, // Very high consumption
          readingDate: '2024-02-26',
        })
        .expect(201);

      expect(response.body.hasAbnormalConsumption).toBe(true);

      // Cleanup
      await request(app.getHttpServer()).delete(`/api/v1/readings/${response.body.id}`);
    });
  });

  describe('Bulk Reading Tests', () => {
    it('should accept bulk readings', async () => {
      // This test would require multiple meters setup
      // Skipping for now
    });

    it('should report bulk reading errors', async () => {
      // This test would require multiple meters setup
      // Skipping for now
    });
  });
});
