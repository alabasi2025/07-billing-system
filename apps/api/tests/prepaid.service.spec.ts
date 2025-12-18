import { Test, TestingModule } from '@nestjs/testing';
import { PrepaidService } from '../src/modules/prepaid/prepaid.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PrepaidService', () => {
  let service: PrepaidService;

  const mockPrismaService = {
    billPrepaidMeter: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billPrepaidToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    billMeter: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrepaidService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PrepaidService>(PrepaidService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a prepaid token', async () => {
      const dto = {
        meterId: 'meter-uuid',
        amount: 100,
      };
      const meter = { id: 'meter-uuid', isPrepaid: true, tariffId: 'tariff-uuid' };
      const expected = {
        id: 'uuid-1',
        token: '1234-5678-9012-3456-7890',
        amount: 100,
        units: 200,
        status: 'active',
      };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);
      mockPrismaService.billPrepaidToken.create.mockResolvedValue(expected);

      const result = await service.generateToken(dto);

      expect(result.token).toBeDefined();
      expect(result.units).toBeGreaterThan(0);
    });

    it('should throw BadRequestException if meter is not prepaid', async () => {
      const dto = { meterId: 'meter-uuid', amount: 100 };
      const meter = { id: 'meter-uuid', isPrepaid: false };

      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);

      await expect(service.generateToken(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const token = {
        id: 'uuid-1',
        token: '1234-5678-9012-3456-7890',
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockPrismaService.billPrepaidToken.findUnique.mockResolvedValue(token);

      const result = await service.validateToken('1234-5678-9012-3456-7890');

      expect(result.isValid).toBe(true);
    });

    it('should return invalid for expired token', async () => {
      const token = {
        id: 'uuid-1',
        token: '1234-5678-9012-3456-7890',
        status: 'active',
        expiresAt: new Date(Date.now() - 86400000),
      };

      mockPrismaService.billPrepaidToken.findUnique.mockResolvedValue(token);

      const result = await service.validateToken('1234-5678-9012-3456-7890');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should return invalid for used token', async () => {
      const token = {
        id: 'uuid-1',
        token: '1234-5678-9012-3456-7890',
        status: 'used',
      };

      mockPrismaService.billPrepaidToken.findUnique.mockResolvedValue(token);

      const result = await service.validateToken('1234-5678-9012-3456-7890');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('already_used');
    });
  });

  describe('redeemToken', () => {
    it('should redeem a valid token', async () => {
      const token = {
        id: 'uuid-1',
        token: '1234-5678-9012-3456-7890',
        meterId: 'meter-uuid',
        units: 200,
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000),
      };
      const meter = { id: 'meter-uuid', balance: 100 };

      mockPrismaService.billPrepaidToken.findUnique.mockResolvedValue(token);
      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);
      mockPrismaService.billPrepaidToken.update.mockResolvedValue({ ...token, status: 'used' });
      mockPrismaService.billMeter.update.mockResolvedValue({ ...meter, balance: 300 });

      const result = await service.redeemToken('1234-5678-9012-3456-7890');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(300);
    });
  });

  describe('getBalance', () => {
    it('should return meter balance', async () => {
      const meter = { id: 'meter-uuid', balance: 500, isPrepaid: true };
      mockPrismaService.billMeter.findUnique.mockResolvedValue(meter);

      const result = await service.getBalance('meter-uuid');

      expect(result.balance).toBe(500);
    });
  });
});
