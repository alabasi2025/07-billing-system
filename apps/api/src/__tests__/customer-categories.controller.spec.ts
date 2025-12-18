import { Test, TestingModule } from '@nestjs/testing';
import { CustomerCategoriesController } from '../modules/customer-categories/customer-categories.controller';
import { CustomerCategoriesService } from '../modules/customer-categories/customer-categories.service';

describe('CustomerCategoriesController', () => {
  let controller: CustomerCategoriesController;
  let service: CustomerCategoriesService;

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
      controllers: [CustomerCategoriesController],
      providers: [
        { provide: CustomerCategoriesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<CustomerCategoriesController>(CustomerCategoriesController);
    service = module.get<CustomerCategoriesService>(CustomerCategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of categories', async () => {
      const mockCategories = [
        { id: '1', name: 'سكني', code: 'RES' },
        { id: '2', name: 'تجاري', code: 'COM' },
        { id: '3', name: 'صناعي', code: 'IND' },
      ];
      mockService.findAll.mockResolvedValue({ data: mockCategories, meta: { total: 3 } });

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return single category', async () => {
      const mockCategory = { id: '1', name: 'سكني', code: 'RES' };
      mockService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result.name).toBe('سكني');
    });
  });

  describe('create', () => {
    it('should create new category', async () => {
      const createDto = { name: 'حكومي', code: 'GOV', tariffId: 'tariff-1' };
      const mockCategory = { id: 'new-id', ...createDto };
      mockService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const updateDto = { name: 'سكني محدث' };
      const mockCategory = { id: '1', name: 'سكني محدث' };
      mockService.update.mockResolvedValue(mockCategory);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.name).toBe('سكني محدث');
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      mockService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return category statistics', async () => {
      const mockStats = {
        totalCategories: 4,
        customersPerCategory: [
          { category: 'سكني', count: 100 },
          { category: 'تجاري', count: 30 },
        ],
      };
      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result.totalCategories).toBe(4);
    });
  });
});
