import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMeterTypeDto, UpdateMeterTypeDto } from './dto/meter-type.dto';

@Injectable()
export class MeterTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMeterTypeDto) {
    // Check if code already exists
    const existing = await this.prisma.billMeterType.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Meter type with code ${dto.code} already exists`);
    }

    return this.prisma.billMeterType.create({
      data: {
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        description: dto.description,
        phases: dto.phases ?? 1,
        isSmartMeter: dto.isSmartMeter ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isSmartMeter?: boolean;
  }) {
    const { page = 1, limit = 10, search, isActive, isSmartMeter } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isSmartMeter !== undefined) {
      where.isSmartMeter = isSmartMeter;
    }

    const [data, total] = await Promise.all([
      this.prisma.billMeterType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              meters: true,
            },
          },
        },
      }),
      this.prisma.billMeterType.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const meterType = await this.prisma.billMeterType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            meters: true,
          },
        },
      },
    });

    if (!meterType) {
      throw new NotFoundException(`Meter type with ID ${id} not found`);
    }

    return meterType;
  }

  async findByCode(code: string) {
    const meterType = await this.prisma.billMeterType.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            meters: true,
          },
        },
      },
    });

    if (!meterType) {
      throw new NotFoundException(`Meter type with code ${code} not found`);
    }

    return meterType;
  }

  async update(id: string, dto: UpdateMeterTypeDto) {
    await this.findOne(id);

    return this.prisma.billMeterType.update({
      where: { id },
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        description: dto.description,
        phases: dto.phases,
        isSmartMeter: dto.isSmartMeter,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const meterType = await this.prisma.billMeterType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            meters: true,
          },
        },
      },
    });

    if (!meterType) {
      throw new NotFoundException(`Meter type with ID ${id} not found`);
    }

    if (meterType._count.meters > 0) {
      throw new ConflictException('Cannot delete meter type with associated meters');
    }

    return this.prisma.billMeterType.delete({
      where: { id },
    });
  }

  async getActiveMeterTypes() {
    return this.prisma.billMeterType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
