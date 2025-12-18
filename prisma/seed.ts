import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sequences
  console.log('Creating sequences...');
  const sequences = [
    { name: 'customer', prefix: 'CUST', padLength: 8, resetPeriod: null },
    { name: 'invoice', prefix: 'INV', padLength: 10, resetPeriod: 'yearly' },
    { name: 'payment', prefix: 'PAY', padLength: 10, resetPeriod: 'yearly' },
    { name: 'meter', prefix: 'MTR', padLength: 8, resetPeriod: null },
    { name: 'contract', prefix: 'CNT', padLength: 8, resetPeriod: null },
  ];

  for (const seq of sequences) {
    await prisma.billSequence.upsert({
      where: { name: seq.name },
      update: {},
      create: {
        name: seq.name,
        prefix: seq.prefix,
        padLength: seq.padLength,
        resetPeriod: seq.resetPeriod,
        currentNo: 0,
        lastReset: new Date(),
      },
    });
  }

  // Create customer categories
  console.log('Creating customer categories...');
  const categories = [
    { code: 'RES', name: 'سكني', nameEn: 'Residential', description: 'الاستخدام السكني للمنازل والشقق' },
    { code: 'COM', name: 'تجاري', nameEn: 'Commercial', description: 'الاستخدام التجاري للمحلات والمكاتب' },
    { code: 'IND', name: 'صناعي', nameEn: 'Industrial', description: 'الاستخدام الصناعي للمصانع والورش' },
    { code: 'GOV', name: 'حكومي', nameEn: 'Government', description: 'المباني والمنشآت الحكومية' },
    { code: 'AGR', name: 'زراعي', nameEn: 'Agricultural', description: 'الاستخدام الزراعي للمزارع والآبار' },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.billCustomerCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
    createdCategories[cat.code] = created.id;
  }

  // Create tariffs for residential category
  console.log('Creating tariffs...');
  const residentialTariffs = [
    { sliceOrder: 1, fromKwh: 0, toKwh: 100, ratePerKwh: 0.18, name: 'الشريحة الأولى (0-100)' },
    { sliceOrder: 2, fromKwh: 100, toKwh: 200, ratePerKwh: 0.20, name: 'الشريحة الثانية (100-200)' },
    { sliceOrder: 3, fromKwh: 200, toKwh: 500, ratePerKwh: 0.25, name: 'الشريحة الثالثة (200-500)' },
    { sliceOrder: 4, fromKwh: 500, toKwh: 1000, ratePerKwh: 0.30, name: 'الشريحة الرابعة (500-1000)' },
    { sliceOrder: 5, fromKwh: 1000, toKwh: null, ratePerKwh: 0.35, name: 'الشريحة الخامسة (أكثر من 1000)' },
  ];

  for (const tariff of residentialTariffs) {
    await prisma.billTariff.create({
      data: {
        categoryId: createdCategories['RES'],
        name: tariff.name,
        sliceOrder: tariff.sliceOrder,
        fromKwh: tariff.fromKwh,
        toKwh: tariff.toKwh,
        ratePerKwh: tariff.ratePerKwh,
        fixedCharge: 10,
        effectiveFrom: new Date('2024-01-01'),
      },
    });
  }

  // Create commercial tariffs
  const commercialTariffs = [
    { sliceOrder: 1, fromKwh: 0, toKwh: 500, ratePerKwh: 0.22, name: 'الشريحة الأولى (0-500)' },
    { sliceOrder: 2, fromKwh: 500, toKwh: 2000, ratePerKwh: 0.28, name: 'الشريحة الثانية (500-2000)' },
    { sliceOrder: 3, fromKwh: 2000, toKwh: null, ratePerKwh: 0.35, name: 'الشريحة الثالثة (أكثر من 2000)' },
  ];

  for (const tariff of commercialTariffs) {
    await prisma.billTariff.create({
      data: {
        categoryId: createdCategories['COM'],
        name: tariff.name,
        sliceOrder: tariff.sliceOrder,
        fromKwh: tariff.fromKwh,
        toKwh: tariff.toKwh,
        ratePerKwh: tariff.ratePerKwh,
        fixedCharge: 25,
        effectiveFrom: new Date('2024-01-01'),
      },
    });
  }

  // Create meter types
  console.log('Creating meter types...');
  const meterTypes = [
    { code: 'SM1P', name: 'عداد ذكي أحادي الطور', nameEn: 'Smart Single Phase', phases: 1, isSmartMeter: true },
    { code: 'SM3P', name: 'عداد ذكي ثلاثي الطور', nameEn: 'Smart Three Phase', phases: 3, isSmartMeter: true },
    { code: 'AN1P', name: 'عداد تقليدي أحادي الطور', nameEn: 'Analog Single Phase', phases: 1, isSmartMeter: false },
    { code: 'AN3P', name: 'عداد تقليدي ثلاثي الطور', nameEn: 'Analog Three Phase', phases: 3, isSmartMeter: false },
  ];

  const createdMeterTypes: Record<string, string> = {};
  for (const mt of meterTypes) {
    const created = await prisma.billMeterType.upsert({
      where: { code: mt.code },
      update: {},
      create: mt,
    });
    createdMeterTypes[mt.code] = created.id;
  }

  // Create sample customers
  console.log('Creating sample customers...');
  const customers = [
    {
      accountNo: 'CUST00000001',
      name: 'أحمد محمد العلي',
      categoryId: createdCategories['RES'],
      idType: 'national_id',
      idNumber: '1234567890',
      phone: '0501234567',
      address: 'شارع الملك فهد، حي النخيل',
      city: 'الرياض',
    },
    {
      accountNo: 'CUST00000002',
      name: 'شركة الأمل التجارية',
      categoryId: createdCategories['COM'],
      idType: 'cr',
      idNumber: '1010123456',
      phone: '0112345678',
      address: 'طريق الملك عبدالعزيز، حي العليا',
      city: 'الرياض',
    },
    {
      accountNo: 'CUST00000003',
      name: 'فاطمة عبدالله السعيد',
      categoryId: createdCategories['RES'],
      idType: 'national_id',
      idNumber: '2345678901',
      phone: '0559876543',
      address: 'شارع التحلية، حي الروضة',
      city: 'جدة',
    },
  ];

  const createdCustomers: string[] = [];
  for (const cust of customers) {
    const existing = await prisma.billCustomer.findUnique({
      where: { accountNo: cust.accountNo },
    });

    if (!existing) {
      const created = await prisma.billCustomer.create({
        data: cust,
      });
      createdCustomers.push(created.id);
    } else {
      createdCustomers.push(existing.id);
    }
  }

  // Create sample meters
  console.log('Creating sample meters...');
  const meters = [
    { meterNo: 'MTR00000001', customerId: createdCustomers[0], meterTypeId: createdMeterTypes['SM1P'], lastReading: 15000 },
    { meterNo: 'MTR00000002', customerId: createdCustomers[1], meterTypeId: createdMeterTypes['SM3P'], lastReading: 85000 },
    { meterNo: 'MTR00000003', customerId: createdCustomers[2], meterTypeId: createdMeterTypes['AN1P'], lastReading: 8500 },
    { meterNo: 'MTR00000004', customerId: null, meterTypeId: createdMeterTypes['SM1P'], lastReading: 0, status: 'in_stock' },
    { meterNo: 'MTR00000005', customerId: null, meterTypeId: createdMeterTypes['SM3P'], lastReading: 0, status: 'in_stock' },
  ];

  for (const meter of meters) {
    const existing = await prisma.billMeter.findUnique({
      where: { meterNo: meter.meterNo },
    });

    if (!existing) {
      await prisma.billMeter.create({
        data: {
          meterNo: meter.meterNo,
          customerId: meter.customerId,
          meterTypeId: meter.meterTypeId,
          lastReading: meter.lastReading,
          status: meter.status ?? 'active',
          installDate: meter.customerId ? new Date('2024-01-01') : null,
        },
      });
    }
  }

  // Update sequence counters
  await prisma.billSequence.update({
    where: { name: 'customer' },
    data: { currentNo: 3 },
  });

  await prisma.billSequence.update({
    where: { name: 'meter' },
    data: { currentNo: 5 },
  });

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
