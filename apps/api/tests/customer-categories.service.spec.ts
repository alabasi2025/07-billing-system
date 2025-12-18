import { Test, TestingModule } from '@nestjs/testing';
import { CustomerCategoriesService } from '../src/modules/customer-categories/customer-categories.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CustomerCategoriesService', () => {
  let service: CustomerCategoriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    billCustomerCategory: {
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
        CustomerCategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CustomerCategoriesService>(CustomerCategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new customer category', async () => {
      const dto = { code: 'RES', nameAr: 'سكني', nameEn: 'Residential' };
      const expected = { id: 'uuid-1', ...dto, isActive: true };

      mockPrismaService.billCustomerCategory.findFirst.mockResolvedValue(null);
      mockPrismaService.billCustomerCategory.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrismaService.billCustomerCategory.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if code already exists', async () => {
      const dto = { code: 'RES', nameAr: 'سكني', nameEn: 'Residential' };
      mockPrismaService.billCustomerCategory.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const categories = [
        { id: 'uuid-1', code: 'RES', nameAr: 'سكني' },
        { id: 'uuid-2', code: 'COM', nameAr: 'تجاري' },
      ];

      mockPrismaService.billCustomerCategory.findMany.mockResolvedValue(categories);
      mockPrismaService.billCustomerCategory.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(categories);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const category = { id: 'uuid-1', code: 'RES', nameAr: 'سكني' };
      mockPrismaService.billCustomerCategory.findUnique.mockResolvedValue(category);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.billCustomerCategory.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const existing = { id: 'uuid-1', code: 'RES', nameAr: 'سكني' };
      const updated = { ...existing, nameAr: 'سكني محدث' };

      mockPrismaService.billCustomerCategory.findUnique.mockResolvedValue(existing);
      mockPrismaService.billCustomerCategory.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { nameAr: 'سكني محدث' });

      expect(result.nameAr).toBe('سكني محدث');
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const category = { id: 'uuid-1', code: 'RES' };
      mockPrismaService.billCustomerCategory.findUnique.mockResolvedValue(category);
      mockPrismaService.billCustomerCategory.delete.mockResolvedValue(category);

      await service.remove('uuid-1');

      expect(mockPrismaService.billCustomerCategory.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });
  });
});
