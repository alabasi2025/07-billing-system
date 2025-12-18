import { Test, TestingModule } from '@nestjs/testing';
import { TariffsController } from '../modules/tariffs/tariffs.controller';
import { TariffsService } from '../modules/tariffs/tariffs.service';

describe('TariffsController', () => {
  let controller: TariffsController;
  let service: TariffsService;

  const mockTariffsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getTiers: jest.fn(),
    createTier: jest.fn(),
    updateTier: jest.fn(),
    deleteTier: jest.fn(),
    calculateAmount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TariffsController],
      providers: [
        { provide: TariffsService, useValue: mockTariffsService },
      ],
    }).compile();

    controller = module.get<TariffsController>(TariffsController);
    service = module.get<TariffsService>(TariffsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of tariffs', async () => {
      const mockTariffs = [
        { id: '1', name: 'تعرفة سكنية', pricePerUnit: 0.5 },
        { id: '2', name: 'تعرفة تجارية', pricePerUnit: 0.8 },
      ];
      mockTariffsService.findAll.mockResolvedValue({ data: mockTariffs, meta: { total: 2 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      mockTariffsService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll({ status: 'active' });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });
  });

  describe('findOne', () => {
    it('should return single tariff', async () => {
      const mockTariff = { id: '1', name: 'تعرفة سكنية' };
      mockTariffsService.findOne.mockResolvedValue(mockTariff);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
    });
  });

  describe('create', () => {
    it('should create new tariff', async () => {
      const createDto = {
        name: 'تعرفة جديدة',
        pricePerUnit: 0.6,
        fixedCharge: 10,
      };
      const mockTariff = { id: 'new-id', ...createDto };
      mockTariffsService.create.mockResolvedValue(mockTariff);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update tariff', async () => {
      const updateDto = { pricePerUnit: 0.7 };
      const mockTariff = { id: '1', pricePerUnit: 0.7 };
      mockTariffsService.update.mockResolvedValue(mockTariff);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.pricePerUnit).toBe(0.7);
    });
  });

  describe('delete', () => {
    it('should delete tariff', async () => {
      mockTariffsService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('Tiers', () => {
    describe('getTiers', () => {
      it('should return tariff tiers', async () => {
        const mockTiers = [
          { id: '1', fromUnit: 0, toUnit: 100, pricePerUnit: 0.3 },
          { id: '2', fromUnit: 101, toUnit: 200, pricePerUnit: 0.5 },
        ];
        mockTariffsService.getTiers.mockResolvedValue(mockTiers);

        const result = await controller.getTiers('tariff-1');

        expect(service.getTiers).toHaveBeenCalledWith('tariff-1');
        expect(result.length).toBe(2);
      });
    });

    describe('createTier', () => {
      it('should create tariff tier', async () => {
        const createDto = {
          fromUnit: 201,
          toUnit: 300,
          pricePerUnit: 0.7,
        };
        const mockTier = { id: 'new-id', ...createDto };
        mockTariffsService.createTier.mockResolvedValue(mockTier);

        const result = await controller.createTier('tariff-1', createDto);

        expect(service.createTier).toHaveBeenCalledWith('tariff-1', createDto);
        expect(result.id).toBe('new-id');
      });
    });

    describe('updateTier', () => {
      it('should update tariff tier', async () => {
        const updateDto = { pricePerUnit: 0.75 };
        const mockTier = { id: '1', pricePerUnit: 0.75 };
        mockTariffsService.updateTier.mockResolvedValue(mockTier);

        const result = await controller.updateTier('tariff-1', 'tier-1', updateDto);

        expect(service.updateTier).toHaveBeenCalledWith('tariff-1', 'tier-1', updateDto);
        expect(result.pricePerUnit).toBe(0.75);
      });
    });

    describe('deleteTier', () => {
      it('should delete tariff tier', async () => {
        mockTariffsService.deleteTier.mockResolvedValue({ success: true });

        const result = await controller.deleteTier('tariff-1', 'tier-1');

        expect(service.deleteTier).toHaveBeenCalledWith('tariff-1', 'tier-1');
        expect(result.success).toBe(true);
      });
    });
  });

  describe('calculateAmount', () => {
    it('should calculate amount for consumption', async () => {
      const calcDto = { tariffId: 'tariff-1', consumption: 150 };
      const mockResult = {
        consumption: 150,
        amount: 65,
        breakdown: [
          { tier: 1, units: 100, rate: 0.3, amount: 30 },
          { tier: 2, units: 50, rate: 0.5, amount: 25 },
          { fixedCharge: 10 },
        ],
      };
      mockTariffsService.calculateAmount.mockResolvedValue(mockResult);

      const result = await controller.calculateAmount(calcDto);

      expect(service.calculateAmount).toHaveBeenCalledWith(calcDto);
      expect(result.amount).toBe(65);
    });
  });
});
