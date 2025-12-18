import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from '../src/modules/contracts/contracts.service';
import { PrismaService } from '../src/database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ContractsService', () => {
  let service: ContractsService;

  const mockPrismaService = {
    billContract: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    billCustomer: {
      findUnique: jest.fn(),
    },
    billTariff: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new contract', async () => {
      const dto = {
        contractNumber: 'C001',
        customerId: 'customer-uuid',
        tariffId: 'tariff-uuid',
        startDate: new Date(),
      };
      const expected = { id: 'uuid-1', ...dto, status: 'active' };

      mockPrismaService.billContract.findFirst.mockResolvedValue(null);
      mockPrismaService.billCustomer.findUnique.mockResolvedValue({ id: 'customer-uuid' });
      mockPrismaService.billTariff.findUnique.mockResolvedValue({ id: 'tariff-uuid' });
      mockPrismaService.billContract.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
    });

    it('should throw ConflictException if contract number exists', async () => {
      const dto = { contractNumber: 'C001', customerId: 'uuid', tariffId: 'uuid' };
      mockPrismaService.billContract.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated contracts', async () => {
      const contracts = [
        { id: 'uuid-1', contractNumber: 'C001', status: 'active' },
        { id: 'uuid-2', contractNumber: 'C002', status: 'active' },
      ];

      mockPrismaService.billContract.findMany.mockResolvedValue(contracts);
      mockPrismaService.billContract.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(contracts);
    });
  });

  describe('findOne', () => {
    it('should return a contract by id', async () => {
      const contract = { id: 'uuid-1', contractNumber: 'C001' };
      mockPrismaService.billContract.findUnique.mockResolvedValue(contract);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(contract);
    });

    it('should throw NotFoundException if contract not found', async () => {
      mockPrismaService.billContract.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('terminate', () => {
    it('should terminate an active contract', async () => {
      const contract = { id: 'uuid-1', status: 'active' };
      const terminated = { ...contract, status: 'terminated', endDate: expect.any(Date) };

      mockPrismaService.billContract.findUnique.mockResolvedValue(contract);
      mockPrismaService.billContract.update.mockResolvedValue(terminated);

      const result = await service.terminate('uuid-1');

      expect(result.status).toBe('terminated');
    });
  });
});
