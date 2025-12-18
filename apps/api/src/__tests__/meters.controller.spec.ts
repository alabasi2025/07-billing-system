import { Test, TestingModule } from '@nestjs/testing';
import { MetersController } from '../modules/meters/meters.controller';
import { MetersService } from '../modules/meters/meters.service';

describe('MetersController', () => {
  let controller: MetersController;
  let service: MetersService;

  const mockMetersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByMeterNo: jest.fn(),
    getCustomerMeters: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    assignToCustomer: jest.fn(),
    unassign: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetersController],
      providers: [
        { provide: MetersService, useValue: mockMetersService },
      ],
    }).compile();

    controller = module.get<MetersController>(MetersController);
    service = module.get<MetersService>(MetersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new meter', async () => {
      const createDto = {
        meterNo: 'MTR-001',
        meterTypeId: 'type-1',
        customerId: 'cust-1',
        installationDate: '2024-01-01',
        location: 'Test Location',
      };

      const mockMeter = { id: 'meter-1', ...createDto };
      mockMetersService.create.mockResolvedValue(mockMeter);

      const result = await controller.create(createDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeter);
      expect(mockMetersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated meters', async () => {
      const mockResult = {
        data: [{ id: 'meter-1', meterNo: 'MTR-001' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      mockMetersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockMetersService.findAll).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockMetersService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ status: 'active' });

      expect(mockMetersService.findAll).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should filter by customer', async () => {
      const mockResult = { data: [], meta: { total: 0 } };
      mockMetersService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ customerId: 'cust-1' });

      expect(mockMetersService.findAll).toHaveBeenCalledWith({ customerId: 'cust-1' });
    });
  });

  describe('findOne', () => {
    it('should return a meter by id', async () => {
      const mockMeter = { id: 'meter-1', meterNo: 'MTR-001' };
      mockMetersService.findOne.mockResolvedValue(mockMeter);

      const result = await controller.findOne('meter-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeter);
      expect(mockMetersService.findOne).toHaveBeenCalledWith('meter-1');
    });
  });

  describe('findByMeterNo', () => {
    it('should return a meter by meter number', async () => {
      const mockMeter = { id: 'meter-1', meterNo: 'MTR-001' };
      mockMetersService.findByMeterNo.mockResolvedValue(mockMeter);

      const result = await controller.findByMeterNo('MTR-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeter);
      expect(mockMetersService.findByMeterNo).toHaveBeenCalledWith('MTR-001');
    });
  });

  describe('getCustomerMeters', () => {
    it('should return customer meters', async () => {
      const mockMeters = [
        { id: 'meter-1', meterNo: 'MTR-001' },
        { id: 'meter-2', meterNo: 'MTR-002' },
      ];
      mockMetersService.getCustomerMeters.mockResolvedValue(mockMeters);

      const result = await controller.getCustomerMeters('cust-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeters);
      expect(mockMetersService.getCustomerMeters).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('update', () => {
    it('should update an existing meter', async () => {
      const updateDto = { location: 'New Location' };
      const mockMeter = { id: 'meter-1', location: 'New Location' };
      mockMetersService.update.mockResolvedValue(mockMeter);

      const result = await controller.update('meter-1', updateDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeter);
      expect(mockMetersService.update).toHaveBeenCalledWith('meter-1', updateDto);
    });
  });

  describe('changeStatus', () => {
    it('should change meter status', async () => {
      const statusDto = { status: 'inactive', reason: 'Test reason' };
      const mockMeter = { id: 'meter-1', status: 'inactive' };
      mockMetersService.changeStatus.mockResolvedValue(mockMeter);

      const result = await controller.changeStatus('meter-1', statusDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeter);
      expect(mockMetersService.changeStatus).toHaveBeenCalledWith('meter-1', statusDto);
    });
  });

  describe('assignToCustomer', () => {
    it('should assign meter to customer', async () => {
      const assignDto = { customerId: 'cust-1' };
      const mockMeter = { id: 'meter-1', customerId: 'cust-1' };
      mockMetersService.assignToCustomer.mockResolvedValue(mockMeter);

      const result = await controller.assignToCustomer('meter-1', assignDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeter);
      expect(mockMetersService.assignToCustomer).toHaveBeenCalledWith('meter-1', assignDto);
    });
  });

  describe('unassign', () => {
    it('should unassign meter from customer', async () => {
      const mockMeter = { id: 'meter-1', customerId: null };
      mockMetersService.unassign.mockResolvedValue(mockMeter);

      const result = await controller.unassign('meter-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMeter);
      expect(mockMetersService.unassign).toHaveBeenCalledWith('meter-1');
    });
  });

  describe('getStatistics', () => {
    it('should return meter statistics', async () => {
      const mockStats = {
        total: 100,
        byStatus: { active: 80, inactive: 15, faulty: 5 },
        byType: { smart: 60, analog: 40 },
      };
      mockMetersService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(mockMetersService.getStatistics).toHaveBeenCalled();
    });
  });
});
