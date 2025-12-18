import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintsService } from '../src/modules/complaints/complaints.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ComplaintsService', () => {
  let service: ComplaintsService;

  const mockPrismaService = {
    billComplaint: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ComplaintsService>(ComplaintsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new complaint', async () => {
      const dto = {
        customerId: 'customer-uuid',
        type: 'billing',
        subject: 'فاتورة خاطئة',
        description: 'المبلغ غير صحيح',
      };
      const expected = { id: 'uuid-1', ...dto, status: 'open', complaintNumber: 'CMP-001' };

      mockPrismaService.billCustomer.findUnique.mockResolvedValue({ id: 'customer-uuid' });
      mockPrismaService.billComplaint.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result.status).toBe('open');
      expect(result.complaintNumber).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated complaints', async () => {
      const complaints = [
        { id: 'uuid-1', subject: 'شكوى 1', status: 'open' },
        { id: 'uuid-2', subject: 'شكوى 2', status: 'resolved' },
      ];

      mockPrismaService.billComplaint.findMany.mockResolvedValue(complaints);
      mockPrismaService.billComplaint.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(complaints);
    });

    it('should filter by status', async () => {
      mockPrismaService.billComplaint.findMany.mockResolvedValue([]);
      mockPrismaService.billComplaint.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, status: 'open' });

      expect(mockPrismaService.billComplaint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'open' }),
        })
      );
    });
  });

  describe('updateStatus', () => {
    it('should update complaint status', async () => {
      const complaint = { id: 'uuid-1', status: 'open' };
      const updated = { ...complaint, status: 'in_progress' };

      mockPrismaService.billComplaint.findUnique.mockResolvedValue(complaint);
      mockPrismaService.billComplaint.update.mockResolvedValue(updated);

      const result = await service.updateStatus('uuid-1', 'in_progress');

      expect(result.status).toBe('in_progress');
    });
  });

  describe('resolve', () => {
    it('should resolve a complaint', async () => {
      const complaint = { id: 'uuid-1', status: 'in_progress' };
      const resolved = { ...complaint, status: 'resolved', resolution: 'تم الحل' };

      mockPrismaService.billComplaint.findUnique.mockResolvedValue(complaint);
      mockPrismaService.billComplaint.update.mockResolvedValue(resolved);

      const result = await service.resolve('uuid-1', 'تم الحل');

      expect(result.status).toBe('resolved');
      expect(result.resolution).toBe('تم الحل');
    });
  });

  describe('getStatistics', () => {
    it('should return complaint statistics', async () => {
      mockPrismaService.billComplaint.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // open
        .mockResolvedValueOnce(2)  // in_progress
        .mockResolvedValueOnce(5); // resolved

      const result = await service.getStatistics();

      expect(result.total).toBe(10);
      expect(result.open).toBe(3);
      expect(result.resolved).toBe(5);
    });
  });
});
