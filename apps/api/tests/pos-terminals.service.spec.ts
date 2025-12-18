import { Test, TestingModule } from '@nestjs/testing';
import { PosTerminalsService } from '../src/modules/pos-terminals/pos-terminals.service';
import { PrismaService } from '../src/database/prisma.service';

describe('PosTerminalsService', () => {
  let service: PosTerminalsService;
  let prisma: PrismaService;

  const mockPrisma = {
    billPosTerminal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    billPosSession: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosTerminalsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PosTerminalsService>(PosTerminalsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated terminals', async () => {
      const mockTerminals = [
        { id: '1', terminalCode: 'POS001', terminalName: 'نقطة بيع 1' },
        { id: '2', terminalCode: 'POS002', terminalName: 'نقطة بيع 2' },
      ];

      mockPrisma.billPosTerminal.findMany.mockResolvedValue(mockTerminals);
      mockPrisma.billPosTerminal.count.mockResolvedValue(2);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result.data).toEqual(mockTerminals);
      expect(result.meta.total).toBe(2);
      expect(mockPrisma.billPosTerminal.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockPrisma.billPosTerminal.findMany.mockResolvedValue([]);
      mockPrisma.billPosTerminal.count.mockResolvedValue(0);

      await service.findAll({ status: 'active' });

      expect(mockPrisma.billPosTerminal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a terminal by id', async () => {
      const mockTerminal = { id: '1', terminalCode: 'POS001', terminalName: 'نقطة بيع 1' };
      mockPrisma.billPosTerminal.findUnique.mockResolvedValue(mockTerminal);

      const result = await service.findOne('1');

      expect(result).toEqual(mockTerminal);
      expect(mockPrisma.billPosTerminal.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if terminal not found', async () => {
      mockPrisma.billPosTerminal.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('نقطة البيع غير موجودة');
    });
  });

  describe('create', () => {
    it('should create a new terminal', async () => {
      const dto = {
        terminalCode: 'POS003',
        terminalName: 'نقطة بيع جديدة',
        status: 'active',
        printerType: 'thermal',
        openingBalance: 1000,
      };

      mockPrisma.billPosTerminal.findUnique.mockResolvedValue(null);
      mockPrisma.billPosTerminal.create.mockResolvedValue({ id: '3', ...dto });

      const result = await service.create(dto);

      expect(result.terminalCode).toBe('POS003');
      expect(mockPrisma.billPosTerminal.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if terminal code exists', async () => {
      const dto = { terminalCode: 'POS001', terminalName: 'نقطة بيع', status: 'active', printerType: 'thermal', openingBalance: 0 };
      mockPrisma.billPosTerminal.findUnique.mockResolvedValue({ id: '1' });

      await expect(service.create(dto)).rejects.toThrow('رمز نقطة البيع موجود مسبقاً');
    });
  });

  describe('getStatistics', () => {
    it('should return terminal statistics', async () => {
      mockPrisma.billPosTerminal.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(1)  // inactive
        .mockResolvedValueOnce(1); // maintenance
      mockPrisma.billPosSession.count.mockResolvedValue(3);

      const result = await service.getStatistics();

      expect(result.total).toBe(10);
      expect(result.active).toBe(8);
      expect(result.openSessions).toBe(3);
    });
  });
});
