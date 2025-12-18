import { Test, TestingModule } from '@nestjs/testing';
import { MeterTypesController } from '../modules/meter-types/meter-types.controller';
import { MeterTypesService } from '../modules/meter-types/meter-types.service';

describe('MeterTypesController', () => {
  let controller: MeterTypesController;
  let service: MeterTypesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeterTypesController],
      providers: [
        { provide: MeterTypesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<MeterTypesController>(MeterTypesController);
    service = module.get<MeterTypesService>(MeterTypesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of meter types', async () => {
      const mockTypes = [
        { id: '1', name: 'عداد ميكانيكي', code: 'MECH' },
        { id: '2', name: 'عداد رقمي', code: 'DIGI' },
        { id: '3', name: 'عداد ذكي', code: 'SMART' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockTypes, meta: { total: 3 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return single meter type', async () => {
      const mockType = { id: '1', name: 'عداد ميكانيكي' };
      mockService.findOne.mockResolvedValue(mockType);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.name).toBe('عداد ميكانيكي');
    });
  });

  describe('create', () => {
    it('should create new meter type', async () => {
      const createDto = { name: 'عداد مسبق الدفع', code: 'PREP', maxReading: 99999 };
      const mockType = { id: 'new-id', ...createDto };
      mockService.create.mockResolvedValue(mockType);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update meter type', async () => {
      const updateDto = { name: 'عداد ميكانيكي محدث' };
      const mockType = { id: '1', name: 'عداد ميكانيكي محدث' };
      mockService.update.mockResolvedValue(mockType);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.name).toBe('عداد ميكانيكي محدث');
    });
  });

  describe('delete', () => {
    it('should delete meter type', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return meter type statistics', async () => {
      const mockStats = {
        totalTypes: 4,
        metersPerType: [
          { type: 'عداد ميكانيكي', count: 100 },
          { type: 'عداد رقمي', count: 50 },
          { type: 'عداد ذكي', count: 30 },
        ],
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalTypes).toBe(4);
    });
  });
});
