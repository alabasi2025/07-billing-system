import { Test, TestingModule } from '@nestjs/testing';
import { DisconnectionsService } from '../src/modules/disconnections/disconnections.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DisconnectionsService', () => {
  let service: DisconnectionsService;

  const mockPrismaService = {
    billDisconnection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billMeter: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisconnectionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DisconnectionsService>(DisconnectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDisconnection', () => {
    it('should create a disconnection order', async () => {
      const dto = {
        meterId: 'meter-uuid',
        reason: 'non_payment',
        scheduledDate: new Date(),
      };
      const meter = { id: 'meter-uuid', status: 'active', customerId: 'customer-uuid' };
      const expected = { id: 'uuid-1', ...dto, status: 'pending' };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);
      mockPrismaService.billDisconnection.create.mockResolvedValue(expected);

      const result = await service.createDisconnection(dto);

      expect(result.status).toBe('pending');
    });

    it('should throw BadRequestException if meter already disconnected', async () => {
      const dto = { meterId: 'meter-uuid', reason: 'non_payment' };
      const meter = { id: 'meter-uuid', status: 'disconnected' };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);

      await expect(service.createDisconnection(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('executeDisconnection', () => {
    it('should execute a pending disconnection', async () => {
      const disconnection = { id: 'uuid-1', meterId: 'meter-uuid', status: 'pending' };
      const executed = { ...disconnection, status: 'executed', executedAt: new Date() };

      mockPrismaService.billDisconnection.findUnique.mockResolvedValue(disconnection);
      mockPrismaService.billDisconnection.update.mockResolvedValue(executed);
      mockPrismaService.billMeter.update.mockResolvedValue({ status: 'disconnected' });

      const result = await service.executeDisconnection('uuid-1');

      expect(result.status).toBe('executed');
      expect(mockPrismaService.billMeter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'disconnected' }),
        })
      );
    });
  });

  describe('createReconnection', () => {
    it('should create a reconnection order', async () => {
      const dto = { meterId: 'meter-uuid' };
      const meter = { id: 'meter-uuid', status: 'disconnected' };
      const expected = { id: 'uuid-1', ...dto, type: 'reconnection', status: 'pending' };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);
      mockPrismaService.billDisconnection.create.mockResolvedValue(expected);

      const result = await service.createReconnection(dto);

      expect(result.type).toBe('reconnection');
    });
  });

  describe('executeReconnection', () => {
    it('should execute a reconnection and update meter status', async () => {
      const reconnection = { id: 'uuid-1', meterId: 'meter-uuid', type: 'reconnection', status: 'pending' };
      const executed = { ...reconnection, status: 'executed' };

      mockPrismaService.billDisconnection.findUnique.mockResolvedValue(reconnection);
      mockPrismaService.billDisconnection.update.mockResolvedValue(executed);
      mockPrismaService.billMeter.update.mockResolvedValue({ status: 'active' });

      const result = await service.executeReconnection('uuid-1');

      expect(result.status).toBe('executed');
      expect(mockPrismaService.billMeter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'active' }),
        })
      );
    });
  });

  describe('getStatistics', () => {
    it('should return disconnection statistics', async () => {
      mockPrismaService.billDisconnection.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(15); // executed

      const result = await service.getStatistics();

      expect(result.total).toBe(20);
      expect(result.pending).toBe(5);
      expect(result.executed).toBe(15);
    });
  });
});
