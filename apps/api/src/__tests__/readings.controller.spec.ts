import { Test, TestingModule } from '@nestjs/testing';
import { ReadingsController } from '../modules/meters/readings.controller';
import { ReadingsService } from '../modules/meters/readings.service';

describe('ReadingsController', () => {
  let controller: ReadingsController;
  let service: ReadingsService;

  const mockReadingsService = {
    create: jest.fn(),
    createBatch: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getMeterReadings: jest.fn(),
    getCustomerReadings: jest.fn(),
    getUnprocessedReadings: jest.fn(),
    update: jest.fn(),
    markAsProcessed: jest.fn(),
    validateReading: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadingsController],
      providers: [
        { provide: ReadingsService, useValue: mockReadingsService },
      ],
    }).compile();

    controller = module.get<ReadingsController>(ReadingsController);
    service = module.get<ReadingsService>(ReadingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new reading', async () => {
      const createDto = {
        meterId: 'meter-1',
        readingValue: 1500,
        readingDate: '2024-01-15',
        readingType: 'actual',
      };

      const mockReading = { id: 'read-1', ...createDto };
      mockReadingsService.create.mockResolvedValue(mockReading);

      const result = await controller.create(createDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReading);
      expect(mockReadingsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('createBatch', () => {
    it('should create batch readings', async () => {
      const batchDto = {
        readings: [
          { meterId: 'meter-1', readingValue: 1500 },
          { meterId: 'meter-2', readingValue: 2000 },
        ],
        readingDate: '2024-01-15',
      };

      const mockResult = { created: 2, failed: 0, errors: [] };
      mockReadingsService.createBatch.mockResolvedValue(mockResult);

      const result = await controller.createBatch(batchDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockReadingsService.createBatch).toHaveBeenCalledWith(batchDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated readings', async () => {
      const mockResult = {
        data: [{ id: 'read-1', readingValue: 1500 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      mockReadingsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockReadingsService.findAll).toHaveBeenCalled();
    });

    it('should filter by meter', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockReadingsService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ meterId: 'meter-1' });

      expect(mockReadingsService.findAll).toHaveBeenCalledWith({ meterId: 'meter-1' });
    });

    it('should filter by billing period', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockReadingsService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ billingPeriod: '2024-01' });

      expect(mockReadingsService.findAll).toHaveBeenCalledWith({ billingPeriod: '2024-01' });
    });
  });

  describe('findOne', () => {
    it('should return a reading by id', async () => {
      const mockReading = { id: 'read-1', readingValue: 1500 };
      mockReadingsService.findOne.mockResolvedValue(mockReading);

      const result = await controller.findOne('read-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReading);
      expect(mockReadingsService.findOne).toHaveBeenCalledWith('read-1');
    });
  });

  describe('getMeterReadings', () => {
    it('should return meter readings', async () => {
      const mockReadings = [
        { id: 'read-1', readingValue: 1500 },
        { id: 'read-2', readingValue: 1600 },
      ];
      mockReadingsService.getMeterReadings.mockResolvedValue(mockReadings);

      const result = await controller.getMeterReadings('meter-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReadings);
      expect(mockReadingsService.getMeterReadings).toHaveBeenCalledWith('meter-1');
    });
  });

  describe('getCustomerReadings', () => {
    it('should return customer readings', async () => {
      const mockReadings = [{ id: 'read-1', readingValue: 1500 }];
      mockReadingsService.getCustomerReadings.mockResolvedValue(mockReadings);

      const result = await controller.getCustomerReadings('cust-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReadings);
      expect(mockReadingsService.getCustomerReadings).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('getUnprocessedReadings', () => {
    it('should return unprocessed readings', async () => {
      const mockReadings = [{ id: 'read-1', isProcessed: false }];
      mockReadingsService.getUnprocessedReadings.mockResolvedValue(mockReadings);

      const result = await controller.getUnprocessedReadings();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReadings);
      expect(mockReadingsService.getUnprocessedReadings).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing reading', async () => {
      const updateDto = { readingValue: 1550 };
      const mockReading = { id: 'read-1', readingValue: 1550 };
      mockReadingsService.update.mockResolvedValue(mockReading);

      const result = await controller.update('read-1', updateDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReading);
      expect(mockReadingsService.update).toHaveBeenCalledWith('read-1', updateDto);
    });
  });

  describe('markAsProcessed', () => {
    it('should mark reading as processed', async () => {
      const mockReading = { id: 'read-1', isProcessed: true };
      mockReadingsService.markAsProcessed.mockResolvedValue(mockReading);

      const result = await controller.markAsProcessed('read-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReading);
      expect(mockReadingsService.markAsProcessed).toHaveBeenCalledWith('read-1');
    });
  });

  describe('validateReading', () => {
    it('should validate a reading', async () => {
      const validateDto = {
        meterId: 'meter-1',
        readingValue: 1500,
        previousReading: 1400,
      };

      const mockResult = {
        isValid: true,
        consumption: 100,
        warnings: [],
      };
      mockReadingsService.validateReading.mockResolvedValue(mockResult);

      const result = await controller.validateReading(validateDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockReadingsService.validateReading).toHaveBeenCalledWith(validateDto);
    });

    it('should return validation warnings', async () => {
      const validateDto = {
        meterId: 'meter-1',
        readingValue: 5000,
        previousReading: 1400,
      };

      const mockResult = {
        isValid: true,
        consumption: 3600,
        warnings: ['استهلاك مرتفع بشكل غير طبيعي'],
      };
      mockReadingsService.validateReading.mockResolvedValue(mockResult);

      const result = await controller.validateReading(validateDto);

      expect(result.data.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getStatistics', () => {
    it('should return reading statistics', async () => {
      const mockStats = {
        totalReadings: 1000,
        processedReadings: 950,
        unprocessedReadings: 50,
        averageConsumption: 350,
      };
      mockReadingsService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(mockReadingsService.getStatistics).toHaveBeenCalled();
    });
  });
});
