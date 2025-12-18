import { Test, TestingModule } from '@nestjs/testing';
import { PosTerminalsController } from '../modules/pos-terminals/pos-terminals.controller';
import { PosTerminalsService } from '../modules/pos-terminals/pos-terminals.service';

describe('PosTerminalsController', () => {
  let controller: PosTerminalsController;
  let service: PosTerminalsService;

  const mockPosTerminalsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosTerminalsController],
      providers: [
        { provide: PosTerminalsService, useValue: mockPosTerminalsService },
      ],
    }).compile();

    controller = module.get<PosTerminalsController>(PosTerminalsController);
    service = module.get<PosTerminalsService>(PosTerminalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of POS terminals', async () => {
      const mockTerminals = [
        { id: '1', name: 'نقطة بيع 1', status: 'active' },
        { id: '2', name: 'نقطة بيع 2', status: 'inactive' },
      ];
      mockPosTerminalsService.findAll.mockResolvedValue({ data: mockTerminals, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockPosTerminalsService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });
  });

  describe('findOne', () => {
    it('should return single terminal', async () => {
      const mockTerminal = { id: '1', name: 'نقطة بيع 1' };
      mockPosTerminalsService.findOne.mockResolvedValue(mockTerminal);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
    });
  });

  describe('create', () => {
    it('should create new terminal', async () => {
      const createDto = {
        name: 'نقطة بيع جديدة',
        location: 'الفرع الرئيسي',
      };
      const mockTerminal = { id: 'new-id', ...createDto };
      mockPosTerminalsService.create.mockResolvedValue(mockTerminal);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update terminal', async () => {
      const updateDto = { name: 'اسم محدث' };
      const mockTerminal = { id: '1', name: 'اسم محدث' };
      mockPosTerminalsService.update.mockResolvedValue(mockTerminal);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.name).toBe('اسم محدث');
    });
  });

  describe('delete', () => {
    it('should delete terminal', async () => {
      mockPosTerminalsService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('activate', () => {
    it('should activate terminal', async () => {
      const mockTerminal = { id: '1', status: 'active' };
      mockPosTerminalsService.activate.mockResolvedValue(mockTerminal);

      const result = await controller.activate('1');

      expect(service.activate).toHaveBeenCalledWith('1');
      expect(result.status).toBe('active');
    });
  });

  describe('deactivate', () => {
    it('should deactivate terminal', async () => {
      const mockTerminal = { id: '1', status: 'inactive' };
      mockPosTerminalsService.deactivate.mockResolvedValue(mockTerminal);

      const result = await controller.deactivate('1');

      expect(service.deactivate).toHaveBeenCalledWith('1');
      expect(result.status).toBe('inactive');
    });
  });

  describe('getStatistics', () => {
    it('should return terminal statistics', async () => {
      const mockStats = {
        totalTerminals: 10,
        activeTerminals: 8,
        inactiveTerminals: 2,
        totalTransactions: 500,
        totalAmount: 250000,
      };
      mockPosTerminalsService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalTerminals).toBe(10);
    });
  });
});
