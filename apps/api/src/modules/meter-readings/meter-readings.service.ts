import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMeterReadingDto, BulkUploadReadingsDto, ReadingType } from './dto/meter-reading.dto';

@Injectable()
export class MeterReadingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMeterReadingDto) {
    // Get meter with last reading
    const meter = await this.prisma.billMeter.findUnique({
      where: { id: dto.meterId },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
      },
    });

    if (!meter) {
      throw new NotFoundException(`Meter with ID ${dto.meterId} not found`);
    }

    if (meter.status !== 'active') {
      throw new BadRequestException('Cannot add reading for inactive meter');
    }

    const readingDate = new Date(dto.readingDate);
    const billingPeriod = `${readingDate.getFullYear()}-${String(readingDate.getMonth() + 1).padStart(2, '0')}`;

    // Validate reading is not less than previous
    if (dto.reading < Number(meter.lastReading)) {
      throw new BadRequestException(
        `Reading (${dto.reading}) cannot be less than previous reading (${meter.lastReading})`
      );
    }

    const previousReading = Number(meter.lastReading);
    const consumption = dto.reading - previousReading;

    // Create reading
    const reading = await this.prisma.billMeterReading.create({
      data: {
        meterId: dto.meterId,
        readingDate,
        reading: dto.reading,
        previousReading: previousReading,
        consumption: consumption,
        readingType: dto.readingType ?? ReadingType.NORMAL,
        readerId: dto.readerId,
        imageUrl: dto.imageUrl,
        notes: dto.notes,
        billingPeriod,
      },
      include: {
        meter: {
          select: {
            id: true,
            meterNo: true,
            customer: {
              select: {
                id: true,
                accountNo: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update meter's last reading
    await this.prisma.billMeter.update({
      where: { id: dto.meterId },
      data: {
        lastReading: dto.reading,
        lastReadDate: readingDate,
      },
    });

    return reading;
  }

  async bulkUpload(dto: BulkUploadReadingsDto) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ meterId: string; error: string }>,
    };

    const readingDate = new Date(dto.readingDate);

    for (const item of dto.readings) {
      try {
        // Get meter
        const meter = await this.prisma.billMeter.findUnique({
          where: { id: item.meterId },
        });

        if (!meter) {
          results.failed++;
          results.errors.push({
            meterId: item.meterId,
            error: 'Meter not found',
          });
          continue;
        }

        if (meter.status !== 'active') {
          results.failed++;
          results.errors.push({
            meterId: item.meterId,
            error: 'Meter is not active',
          });
          continue;
        }

        if (item.reading < Number(meter.lastReading)) {
          results.failed++;
          results.errors.push({
            meterId: item.meterId,
            error: `Reading (${item.reading}) is less than previous (${meter.lastReading})`,
          });
          continue;
        }

        const previousReading = Number(meter.lastReading);
        const consumption = item.reading - previousReading;

        // Create reading
        await this.prisma.billMeterReading.create({
          data: {
            meterId: item.meterId,
            readingDate,
            reading: item.reading,
            previousReading: previousReading,
            consumption: consumption,
            readingType: ReadingType.NORMAL,
            readerId: dto.readerId,
            billingPeriod: dto.billingPeriod,
          },
        });

        // Update meter
        await this.prisma.billMeter.update({
          where: { id: item.meterId },
          data: {
            lastReading: item.reading,
            lastReadDate: readingDate,
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          meterId: item.meterId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    meterId?: string;
    billingPeriod?: string;
    readingType?: string;
    isProcessed?: boolean;
  }) {
    const { page = 1, limit = 10, meterId, billingPeriod, readingType, isProcessed } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (meterId) {
      where.meterId = meterId;
    }

    if (billingPeriod) {
      where.billingPeriod = billingPeriod;
    }

    if (readingType) {
      where.readingType = readingType;
    }

    if (isProcessed !== undefined) {
      where.isProcessed = isProcessed;
    }

    const [data, total] = await Promise.all([
      this.prisma.billMeterReading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { readingDate: 'desc' },
        include: {
          meter: {
            select: {
              id: true,
              meterNo: true,
              customer: {
                select: {
                  id: true,
                  accountNo: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.billMeterReading.count({ where }),
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
    const reading = await this.prisma.billMeterReading.findUnique({
      where: { id },
      include: {
        meter: {
          select: {
            id: true,
            meterNo: true,
            customer: {
              select: {
                id: true,
                accountNo: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!reading) {
      throw new NotFoundException(`Meter reading with ID ${id} not found`);
    }

    return reading;
  }

  async getPendingReadings(billingPeriod?: string) {
    const where: any = {
      isProcessed: false,
    };

    if (billingPeriod) {
      where.billingPeriod = billingPeriod;
    }

    return this.prisma.billMeterReading.findMany({
      where,
      orderBy: { readingDate: 'desc' },
      include: {
        meter: {
          select: {
            id: true,
            meterNo: true,
            customer: {
              select: {
                id: true,
                accountNo: true,
                name: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });
  }

  async markAsProcessed(ids: string[]) {
    return this.prisma.billMeterReading.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        isProcessed: true,
      },
    });
  }
}
