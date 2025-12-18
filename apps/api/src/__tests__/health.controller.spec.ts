import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../modules/health/health.controller';
import { HealthService } from '../modules/health/health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockService = {
    check: jest.fn(),
    getStatus: jest.fn(),
    getDatabaseStatus: jest.fn(),
    getMemoryUsage: jest.fn(),
    getUptime: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status', async () => {
      const mockHealth = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory: { status: 'up' },
        },
      };
      mockService.check.mockResolvedValue(mockHealth);

      const result = await controller.check();

      expect(service.check).toHaveBeenCalled();
      expect(result.status).toBe('ok');
    });

    it('should return unhealthy status when database is down', async () => {
      const mockHealth = {
        status: 'error',
        info: {
          memory: { status: 'up' },
        },
        error: {
          database: { status: 'down', message: 'Connection refused' },
        },
        details: {
          database: { status: 'down', message: 'Connection refused' },
          memory: { status: 'up' },
        },
      };
      mockService.check.mockResolvedValue(mockHealth);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error.database.status).toBe('down');
    });
  });

  describe('getStatus', () => {
    it('should return simple status', async () => {
      mockService.getStatus.mockResolvedValue({ status: 'ok' });

      const result = await controller.getStatus();

      expect(service.getStatus).toHaveBeenCalled();
      expect(result.status).toBe('ok');
    });
  });

  describe('getDatabaseStatus', () => {
    it('should return database status', async () => {
      const mockDbStatus = {
        status: 'up',
        responseTime: 5,
        connections: {
          active: 10,
          idle: 5,
          max: 100,
        },
      };
      mockService.getDatabaseStatus.mockResolvedValue(mockDbStatus);

      const result = await controller.getDatabaseStatus();

      expect(service.getDatabaseStatus).toHaveBeenCalled();
      expect(result.status).toBe('up');
      expect(result.responseTime).toBe(5);
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage', async () => {
      const mockMemory = {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        rss: 120 * 1024 * 1024,
      };
      mockService.getMemoryUsage.mockResolvedValue(mockMemory);

      const result = await controller.getMemoryUsage();

      expect(service.getMemoryUsage).toHaveBeenCalled();
      expect(result.heapUsed).toBeDefined();
    });
  });

  describe('getUptime', () => {
    it('should return uptime', async () => {
      const mockUptime = {
        uptime: 86400,
        startTime: '2024-02-14T00:00:00Z',
        formatted: '1 day',
      };
      mockService.getUptime.mockResolvedValue(mockUptime);

      const result = await controller.getUptime();

      expect(service.getUptime).toHaveBeenCalled();
      expect(result.uptime).toBe(86400);
    });
  });
});
