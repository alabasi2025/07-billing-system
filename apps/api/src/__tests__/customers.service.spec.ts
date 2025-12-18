import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    billCustomer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    billCustomerCategory: {
      findMany: jest.fn(),
    },
  };

  const mockSequenceService = {
    generateSequence: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SequenceService, useValue: mockSequenceService },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        { id: '1', accountNo: 'ACC001', name: 'Customer 1' },
        { id: '2', accountNo: 'ACC002', name: 'Customer 2' },
      ];

      mockPrismaService.billCustomer.findMany.mockResolvedValue(mockCustomers);
      mockPrismaService.billCustomer.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockCustomers);
      expect(result.meta.total).toBe(2);
      expect(mockPrismaService.billCustomer.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockPrismaService.billCustomer.findMany.mockResolvedValue([]);
      mockPrismaService.billCustomer.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, status: 'active' });

      expect(mockPrismaService.billCustomer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = { id: '1', accountNo: 'ACC001', name: 'Customer 1' };
      mockPrismaService.billCustomer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.billCustomer.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: '1' } })
      );
    });

    it('should return null if customer not found', async () => {
      mockPrismaService.billCustomer.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createDto = {
        name: 'New Customer',
        categoryId: 'cat-1',
        idType: 'national_id',
        idNumber: '1234567890',
        phone: '0501234567',
        address: 'Test Address',
      };

      const mockCreatedCustomer = {
        id: 'new-id',
        accountNo: 'ACC003',
        ...createDto,
      };

      mockSequenceService.generateSequence.mockResolvedValue('ACC003');
      mockPrismaService.billCustomer.create.mockResolvedValue(mockCreatedCustomer);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedCustomer);
      expect(mockSequenceService.generateSequence).toHaveBeenCalledWith('customer');
      expect(mockPrismaService.billCustomer.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing customer', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockUpdatedCustomer = { id: '1', accountNo: 'ACC001', name: 'Updated Name' };

      mockPrismaService.billCustomer.update.mockResolvedValue(mockUpdatedCustomer);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(mockUpdatedCustomer);
      expect(mockPrismaService.billCustomer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: updateDto,
        })
      );
    });
  });

  describe('getStatistics', () => {
    it('should return customer statistics', async () => {
      mockPrismaService.billCustomer.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // active
        .mockResolvedValueOnce(10)  // suspended
        .mockResolvedValueOnce(5)   // disconnected
        .mockResolvedValueOnce(5);  // closed

      const result = await service.getStatistics();

      expect(result.total).toBe(100);
      expect(result.byStatus.active).toBe(80);
      expect(result.byStatus.suspended).toBe(10);
    });
  });
});
