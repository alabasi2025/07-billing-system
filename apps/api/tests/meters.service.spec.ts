import { Test, TestingModule } from '@nestjs/testing';
import { MetersService } from '../src/modules/meters/meters.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('MetersService', () => {
  let service: MetersService;

  const mockPrismaService = {
    billMeter: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
    billMeterType: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MetersService>(MetersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new meter', async () => {
      const dto = {
        meterNumber: 'M001',
        customerId: 'customer-uuid',
        meterTypeId: 'type-uuid',
        installationDate: new Date(),
      };
      const expected = { id: 'uuid-1', ...dto, status: 'active' };

      mockPrismaService.billMeter.findFirst.mockResolvedValue(null);
      mockPrismaService.billCustomer.findUnique.mockResolvedValue({ id: 'customer-uuid' });
      mockPrismaService.billMeterType.findUnique.mockResolvedValue({ id: 'type-uuid' });
      mockPrismaService.billMeter.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrismaService.billMeter.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if meter number already exists', async () => {
      const dto = { meterNumber: 'M001', customerId: 'uuid', meterTypeId: 'uuid' };
      mockPrismaService.billMeter.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated meters', async () => {
      const meters = [
        { id: 'uuid-1', meterNumber: 'M001', status: 'active' },
        { id: 'uuid-2', meterNumber: 'M002', status: 'active' },
      ];

      mockPrismaService.billMeter.findMany.mockResolvedValue(meters);
      mockPrismaService.billMeter.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(meters);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrismaService.billMeter.findMany.mockResolvedValue([]);
      mockPrismaService.billMeter.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, status: 'inactive' });

      expect(mockPrismaService.billMeter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'inactive' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a meter by id', async () => {
      const meter = { id: 'uuid-1', meterNumber: 'M001' };
      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(meter);
    });

    it('should throw NotFoundException if meter not found', async () => {
      mockPrismaService.billMeter.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update meter status', async () => {
      const meter = { id: 'uuid-1', meterNumber: 'M001', status: 'active' };
      const updated = { ...meter, status: 'inactive' };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);
      mockPrismaService.billMeter.update.mockResolvedValue(updated);

      const result = await service.updateStatus('uuid-1', 'inactive');

      expect(result.status).toBe('inactive');
    });
  });
});
