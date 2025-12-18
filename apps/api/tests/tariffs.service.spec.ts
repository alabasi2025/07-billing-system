import { Test, TestingModule } from '@nestjs/testing';
import { TariffsService } from '../src/modules/tariffs/tariffs.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TariffsService', () => {
  let service: TariffsService;

  const mockPrismaService = {
    billTariff: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    billTariffTier: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TariffsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TariffsService>(TariffsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tariff', async () => {
      const dto = {
        code: 'T001',
        nameAr: 'تعرفة سكنية',
        nameEn: 'Residential Tariff',
        baseRate: 0.05,
        fixedCharge: 10,
      };
      const expected = { id: 'uuid-1', ...dto, isActive: true };

      mockPrismaService.billTariff.findFirst.mockResolvedValue(null);
      mockPrismaService.billTariff.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrismaService.billTariff.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if code already exists', async () => {
      const dto = { code: 'T001', nameAr: 'تعرفة', baseRate: 0.05 };
      mockPrismaService.billTariff.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated tariffs', async () => {
      const tariffs = [
        { id: 'uuid-1', code: 'T001', nameAr: 'تعرفة سكنية', baseRate: 0.05 },
        { id: 'uuid-2', code: 'T002', nameAr: 'تعرفة تجارية', baseRate: 0.08 },
      ];

      mockPrismaService.billTariff.findMany.mockResolvedValue(tariffs);
      mockPrismaService.billTariff.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(tariffs);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a tariff by id', async () => {
      const tariff = { id: 'uuid-1', code: 'T001', nameAr: 'تعرفة سكنية' };
      mockPrismaService.billTariff.findUnique.mockResolvedValue(tariff);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(tariff);
    });

    it('should throw NotFoundException if tariff not found', async () => {
      mockPrismaService.billTariff.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateBill', () => {
    it('should calculate bill amount correctly', async () => {
      const tariff = {
        id: 'uuid-1',
        baseRate: 0.05,
        fixedCharge: 10,
        tiers: [
          { fromUnit: 0, toUnit: 100, rate: 0.05 },
          { fromUnit: 100, toUnit: 500, rate: 0.08 },
        ],
      };
      mockPrismaService.billTariff.findUnique.mockResolvedValue(tariff);

      const result = await service.calculateBill('uuid-1', 150);

      expect(result).toBeDefined();
      expect(result.totalAmount).toBeGreaterThan(0);
    });
  });
});
