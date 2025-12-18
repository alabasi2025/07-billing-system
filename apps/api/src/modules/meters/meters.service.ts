import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMeterDto, UpdateMeterDto, InstallMeterDto, ReplaceMeterDto, MeterStatus } from './dto/meter.dto';

@Injectable()
export class MetersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMeterDto) {
    // Check if meter number already exists
    const existing = await this.prisma.billMeter.findUnique({
      where: { meterNo: dto.meterNo },
    });

    if (existing) {
      throw new ConflictException(`Meter with number ${dto.meterNo} already exists`);
    }

    // Verify meter type exists
    const meterType = await this.prisma.billMeterType.findUnique({
      where: { id: dto.meterTypeId },
    });

    if (!meterType) {
      throw new NotFoundException(`Meter type with ID ${dto.meterTypeId} not found`);
    }

    // Verify customer exists if provided
    if (dto.customerId) {
      const customer = await this.prisma.billCustomer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
      }
    }

    return this.prisma.billMeter.create({
      data: {
        meterNo: dto.meterNo,
        customerId: dto.customerId,
        meterTypeId: dto.meterTypeId,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNumber: dto.serialNumber,
        installDate: dto.installDate ? new Date(dto.installDate) : null,
        lastReading: dto.lastReading ?? 0,
        multiplier: dto.multiplier ?? 1,
        status: dto.customerId ? 'active' : 'in_stock',
        location: dto.location,
        notes: dto.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    meterTypeId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, search, customerId, meterTypeId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { meterNo: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (meterTypeId) {
      where.meterTypeId = meterTypeId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.billMeter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              accountNo: true,
              name: true,
            },
          },
          meterType: {
            select: {
              id: true,
              code: true,
              name: true,
              isSmartMeter: true,
            },
          },
          _count: {
            select: {
              readings: true,
            },
          },
        },
      }),
      this.prisma.billMeter.count({ where }),
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
    const meter = await this.prisma.billMeter.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
        readings: {
          orderBy: { readingDate: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            readings: true,
          },
        },
      },
    });

    if (!meter) {
      throw new NotFoundException(`Meter with ID ${id} not found`);
    }

    return meter;
  }

  async findByMeterNo(meterNo: string) {
    const meter = await this.prisma.billMeter.findUnique({
      where: { meterNo },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
    });

    if (!meter) {
      throw new NotFoundException(`Meter with number ${meterNo} not found`);
    }

    return meter;
  }

  async update(id: string, dto: UpdateMeterDto) {
    await this.findOne(id);

    const updateData: any = {};

    if (dto.customerId !== undefined) updateData.customerId = dto.customerId;
    if (dto.meterTypeId !== undefined) updateData.meterTypeId = dto.meterTypeId;
    if (dto.manufacturer !== undefined) updateData.manufacturer = dto.manufacturer;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.serialNumber !== undefined) updateData.serialNumber = dto.serialNumber;
    if (dto.installDate !== undefined) updateData.installDate = new Date(dto.installDate);
    if (dto.lastReading !== undefined) updateData.lastReading = dto.lastReading;
    if (dto.multiplier !== undefined) updateData.multiplier = dto.multiplier;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.prisma.billMeter.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
    });
  }

  async install(id: string, dto: InstallMeterDto) {
    const meter = await this.findOne(id);

    if (meter.customerId) {
      throw new ConflictException('Meter is already installed for a customer');
    }

    if (meter.status !== 'in_stock') {
      throw new BadRequestException('Only meters in stock can be installed');
    }

    // Verify customer exists
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const installDate = dto.installDate ? new Date(dto.installDate) : new Date();

    // Create initial reading if provided
    if (dto.initialReading !== undefined) {
      await this.prisma.billMeterReading.create({
        data: {
          meterId: id,
          readingDate: installDate,
          reading: dto.initialReading,
          previousReading: 0,
          consumption: 0,
          readingType: 'initial',
          billingPeriod: `${installDate.getFullYear()}-${String(installDate.getMonth() + 1).padStart(2, '0')}`,
          notes: 'قراءة أولية عند التركيب',
        },
      });
    }

    return this.prisma.billMeter.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        installDate,
        lastReading: dto.initialReading ?? 0,
        lastReadDate: installDate,
        status: 'active',
        location: dto.location,
        notes: dto.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
    });
  }

  async replace(id: string, dto: ReplaceMeterDto) {
    const oldMeter = await this.findOne(id);

    if (!oldMeter.customerId) {
      throw new BadRequestException('Cannot replace a meter that is not installed');
    }

    const newMeter = await this.findOne(dto.newMeterId);

    if (newMeter.customerId) {
      throw new ConflictException('New meter is already installed for another customer');
    }

    if (newMeter.status !== 'in_stock') {
      throw new BadRequestException('New meter must be in stock');
    }

    const replaceDate = dto.replaceDate ? new Date(dto.replaceDate) : new Date();
    const billingPeriod = `${replaceDate.getFullYear()}-${String(replaceDate.getMonth() + 1).padStart(2, '0')}`;

    // Create final reading for old meter
    if (dto.finalReading !== undefined) {
      await this.prisma.billMeterReading.create({
        data: {
          meterId: id,
          readingDate: replaceDate,
          reading: dto.finalReading,
          previousReading: oldMeter.lastReading,
          consumption: dto.finalReading - Number(oldMeter.lastReading),
          readingType: 'final',
          billingPeriod,
          notes: `قراءة نهائية - استبدال بالعداد ${newMeter.meterNo}`,
        },
      });
    }

    // Update old meter
    await this.prisma.billMeter.update({
      where: { id },
      data: {
        customerId: null,
        status: 'replaced',
        lastReading: dto.finalReading ? dto.finalReading : oldMeter.lastReading,
        lastReadDate: replaceDate,
        notes: `${oldMeter.notes ?? ''}\nتم الاستبدال بتاريخ ${replaceDate.toISOString().split('T')[0]} - ${dto.reason ?? ''}`.trim(),
      },
    });

    // Create initial reading for new meter
    if (dto.initialReading !== undefined) {
      await this.prisma.billMeterReading.create({
        data: {
          meterId: dto.newMeterId,
          readingDate: replaceDate,
          reading: dto.initialReading,
          previousReading: 0,
          consumption: 0,
          readingType: 'initial',
          billingPeriod,
          notes: `قراءة أولية - استبدال العداد ${oldMeter.meterNo}`,
        },
      });
    }

    // Update new meter
    return this.prisma.billMeter.update({
      where: { id: dto.newMeterId },
      data: {
        customerId: oldMeter.customerId,
        installDate: replaceDate,
        lastReading: dto.initialReading ?? 0,
        lastReadDate: replaceDate,
        status: 'active',
        location: oldMeter.location,
        notes: `تم التركيب كبديل للعداد ${oldMeter.meterNo}`,
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
    });
  }

  async getMeterReadings(id: string, params: { page?: number; limit?: number }) {
    await this.findOne(id);

    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.billMeterReading.findMany({
        where: { meterId: id },
        skip,
        take: limit,
        orderBy: { readingDate: 'desc' },
      }),
      this.prisma.billMeterReading.count({ where: { meterId: id } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAvailableMeters() {
    return this.prisma.billMeter.findMany({
      where: {
        status: 'in_stock',
        customerId: null,
      },
      include: {
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
      orderBy: { meterNo: 'asc' },
    });
  }

  async getStatistics() {
    const [total, byStatus, byType, installed, inStock] = await Promise.all([
      this.prisma.billMeter.count(),
      this.prisma.billMeter.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.billMeter.groupBy({
        by: ['meterTypeId'],
        _count: { meterTypeId: true },
      }),
      this.prisma.billMeter.count({ where: { customerId: { not: null } } }),
      this.prisma.billMeter.count({ where: { status: 'in_stock' } }),
    ]);

    const statusCounts: Record<string, number> = {
      active: 0,
      faulty: 0,
      replaced: 0,
      removed: 0,
      in_stock: 0,
    };
    byStatus.forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    // الحصول على أسماء أنواع العدادات
    const meterTypes = await this.prisma.billMeterType.findMany({
      select: { id: true, name: true },
    });
    const typeMap = new Map(meterTypes.map((t) => [t.id, t.name]));

    return {
      total,
      installed,
      inStock,
      byStatus: statusCounts,
      byType: byType.map((t) => ({
        typeId: t.meterTypeId,
        typeName: typeMap.get(t.meterTypeId) || 'غير معروف',
        count: t._count.meterTypeId,
      })),
    };
  }

  async uninstall(id: string, reason: string) {
    const meter = await this.findOne(id);

    if (!meter.customerId) {
      throw new BadRequestException('العداد غير مركب لدى عميل');
    }

    const uninstallDate = new Date();
    const billingPeriod = `${uninstallDate.getFullYear()}-${String(uninstallDate.getMonth() + 1).padStart(2, '0')}`;

    // تسجيل قراءة نهائية
    await this.prisma.billMeterReading.create({
      data: {
        meterId: id,
        readingDate: uninstallDate,
        reading: meter.lastReading,
        previousReading: meter.lastReading,
        consumption: 0,
        readingType: 'final',
        billingPeriod,
        notes: `قراءة نهائية - إزالة العداد: ${reason}`,
      },
    });

    return this.prisma.billMeter.update({
      where: { id },
      data: {
        customerId: null,
        status: 'removed',
        notes: `${meter.notes || ''}
تم الإزالة بتاريخ ${uninstallDate.toISOString().split('T')[0]} - ${reason}`.trim(),
      },
      include: {
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
    });
  }

  async markAsFaulty(id: string, reason: string) {
    const meter = await this.findOne(id);

    return this.prisma.billMeter.update({
      where: { id },
      data: {
        status: 'faulty',
        notes: `${meter.notes || ''}
تم التحديد كعاطل بتاريخ ${new Date().toISOString().split('T')[0]} - ${reason}`.trim(),
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meterType: {
          select: {
            id: true,
            code: true,
            name: true,
            isSmartMeter: true,
          },
        },
      },
    });
  }
}
