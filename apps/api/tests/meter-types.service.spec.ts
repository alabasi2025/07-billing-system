import { Test, TestingModule } from '@nestjs/testing';
import { MeterTypesService } from '../src/modules/meter-types/meter-types.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('MeterTypesService', () => {
  let service: MeterTypesService;

  const mockPrismaService = {
    billMeterType: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeterTypesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MeterTypesService>(MeterTypesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new meter type', async () => {
      const dto = {
        code: 'ELEC',
        nameAr: 'كهرباء',
        nameEn: 'Electricity',
        unit: 'kWh',
      };
      const expected = { id: 'uuid-1', ...dto, isActive: true };

      mockPrismaService.billMeterType.findFirst.mockResolvedValue(null);
      mockPrismaService.billMeterType.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
    });

    it('should throw ConflictException if code exists', async () => {
      const dto = { code: 'ELEC', nameAr: 'كهرباء' };
      mockPrismaService.billMeterType.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated meter types', async () => {
      const types = [
        { id: 'uuid-1', code: 'ELEC', nameAr: 'كهرباء' },
        { id: 'uuid-2', code: 'WATER', nameAr: 'مياه' },
      ];

      mockPrismaService.billMeterType.findMany.mockResolvedValue(types);
      mockPrismaService.billMeterType.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(types);
    });
  });

  describe('findOne', () => {
    it('should return a meter type by id', async () => {
      const type = { id: 'uuid-1', code: 'ELEC', nameAr: 'كهرباء' };
      mockPrismaService.billMeterType.findUnique.mockResolvedValue(type);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(type);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.billMeterType.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a meter type', async () => {
      const existing = { id: 'uuid-1', code: 'ELEC', nameAr: 'كهرباء' };
      const updated = { ...existing, nameAr: 'كهرباء محدث' };

      mockPrismaService.billMeterType.findUnique.mockResolvedValue(existing);
      mockPrismaService.billMeterType.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { nameAr: 'كهرباء محدث' });

      expect(result.nameAr).toBe('كهرباء محدث');
    });
  });

  describe('remove', () => {
    it('should delete a meter type', async () => {
      const type = { id: 'uuid-1', code: 'ELEC' };
      mockPrismaService.billMeterType.findUnique.mockResolvedValue(type);
      mockPrismaService.billMeterType.delete.mockResolvedValue(type);

      await service.remove('uuid-1');

      expect(mockPrismaService.billMeterType.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });
  });
});
