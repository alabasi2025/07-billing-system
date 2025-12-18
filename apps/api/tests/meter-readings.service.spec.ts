import { Test, TestingModule } from '@nestjs/testing';
import { MeterReadingsService } from '../src/modules/meter-readings/meter-readings.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MeterReadingsService', () => {
  let service: MeterReadingsService;

  const mockPrismaService = {
    billMeterReading: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billMeter: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeterReadingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MeterReadingsService>(MeterReadingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new reading', async () => {
      const dto = {
        meterId: 'meter-uuid',
        currentReading: 1500,
        readingDate: new Date(),
      };
      const meter = { id: 'meter-uuid', lastReading: 1000 };
      const expected = {
        id: 'uuid-1',
        ...dto,
        previousReading: 1000,
        consumption: 500,
      };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);
      mockPrismaService.billMeterReading.create.mockResolvedValue(expected);
      mockPrismaService.billMeter.update.mockResolvedValue({ ...meter, lastReading: 1500 });

      const result = await service.create(dto);

      expect(result.consumption).toBe(500);
      expect(mockPrismaService.billMeter.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if reading is less than previous', async () => {
      const dto = { meterId: 'meter-uuid', currentReading: 500, readingDate: new Date() };
      const meter = { id: 'meter-uuid', lastReading: 1000 };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated readings', async () => {
      const readings = [
        { id: 'uuid-1', currentReading: 1500, consumption: 500 },
        { id: 'uuid-2', currentReading: 2000, consumption: 500 },
      ];

      mockPrismaService.billMeterReading.findMany.mockResolvedValue(readings);
      mockPrismaService.billMeterReading.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(readings);
    });

    it('should filter by meter id', async () => {
      mockPrismaService.billMeterReading.findMany.mockResolvedValue([]);
      mockPrismaService.billMeterReading.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, meterId: 'meter-uuid' });

      expect(mockPrismaService.billMeterReading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ meterId: 'meter-uuid' }),
        })
      );
    });
  });

  describe('getLatestReading', () => {
    it('should return the latest reading for a meter', async () => {
      const reading = { id: 'uuid-1', currentReading: 2000, readingDate: new Date() };
      mockPrismaService.billMeterReading.findFirst.mockResolvedValue(reading);

      const result = await service.getLatestReading('meter-uuid');

      expect(result).toEqual(reading);
    });
  });

  describe('calculateConsumption', () => {
    it('should calculate consumption between two readings', async () => {
      const readings = [
        { currentReading: 2000, readingDate: new Date('2024-02-01') },
        { currentReading: 1500, readingDate: new Date('2024-01-01') },
      ];
      mockPrismaService.billMeterReading.findMany.mockResolvedValue(readings);

      const result = await service.calculateConsumption('meter-uuid', new Date('2024-01-01'), new Date('2024-02-01'));

      expect(result).toBe(500);
    });
  });
});
