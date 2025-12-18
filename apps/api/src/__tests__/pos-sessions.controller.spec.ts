import { Test, TestingModule } from '@nestjs/testing';
import { PosSessionsController } from '../modules/pos-sessions/pos-sessions.controller';
import { PosSessionsService } from '../modules/pos-sessions/pos-sessions.service';

describe('PosSessionsController', () => {
  let controller: PosSessionsController;
  let service: PosSessionsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    close: jest.fn(),
    getTransactions: jest.fn(),
    getSummary: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosSessionsController],
      providers: [
        { provide: PosSessionsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<PosSessionsController>(PosSessionsController);
    service = module.get<PosSessionsService>(PosSessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of sessions', async () => {
      const mockSessions = [
        { id: '1', terminalId: 'term-1', status: 'open', openingBalance: 500 },
        { id: '2', terminalId: 'term-2', status: 'closed', closingBalance: 5500 },
      ];
      mockService.findAll.mockResolvedValue({ data: mockSessions, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'open' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }));
    });

    it('should filter by terminal', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ terminalId: 'term-1' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ terminalId: 'term-1' }));
    });
  });

  describe('findOne', () => {
    it('should return single session', async () => {
      const mockSession = { id: '1', terminalId: 'term-1', status: 'open' };
      mockService.findOne.mockResolvedValue(mockSession);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
    });
  });

  describe('create', () => {
    it('should create new session', async () => {
      const createDto = {
        terminalId: 'term-1',
        userId: 'user-1',
        openingBalance: 500,
      };
      const mockSession = { id: 'new-id', status: 'open', ...createDto };
      mockService.create.mockResolvedValue(mockSession);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.status).toBe('open');
    });
  });

  describe('close', () => {
    it('should close session', async () => {
      const closeDto = {
        closingBalance: 5500,
        notes: 'إغلاق نهاية اليوم',
      };
      const mockSession = { id: '1', status: 'closed', closingBalance: 5500 };
      mockService.close.mockResolvedValue(mockSession);

      const result = await controller.close('1', closeDto);

      expect(service.close).toHaveBeenCalledWith('1', closeDto);
      expect(result.status).toBe('closed');
    });
  });

  describe('getTransactions', () => {
    it('should return session transactions', async () => {
      const mockTransactions = [
        { id: '1', type: 'payment', amount: 500 },
        { id: '2', type: 'payment', amount: 1000 },
      ];
      mockService.getTransactions.mockResolvedValue(mockTransactions);

      const result = await controller.getTransactions('1');

      expect(service.getTransactions).toHaveBeenCalledWith('1');
      expect(result.length).toBe(2);
    });
  });

  describe('getSummary', () => {
    it('should return session summary', async () => {
      const mockSummary = {
        sessionId: '1',
        openingBalance: 500,
        totalReceived: 5000,
        totalPaid: 0,
        closingBalance: 5500,
        transactionCount: 10,
        byPaymentMethod: {
          cash: 3000,
          card: 1500,
          bank: 500,
        },
      };
      mockService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary('1');

      expect(service.getSummary).toHaveBeenCalledWith('1');
      expect(result.totalReceived).toBe(5000);
    });
  });

  describe('getStatistics', () => {
    it('should return session statistics', async () => {
      const mockStats = {
        totalSessions: 100,
        openSessions: 5,
        closedSessions: 95,
        averageTransactionsPerSession: 15,
        averageAmountPerSession: 7500,
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalSessions).toBe(100);
    });
  });
});
