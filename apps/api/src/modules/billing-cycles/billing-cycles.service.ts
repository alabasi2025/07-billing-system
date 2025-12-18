import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBillingCycleDto, UpdateBillingCycleDto } from './dto';

@Injectable()
export class BillingCyclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; isActive?: boolean }) {
    const { skip = 0, take = 10, isActive } = params;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.billBillingCycle.findMany({
        where,
        skip,
        take,
        orderBy: { cycleCode: 'asc' },
      }),
      this.prisma.billBillingCycle.count({ where }),
    ]);

    return { data, meta: { total, skip, take, hasMore: skip + take < total } };
  }

  async findOne(id: string) {
    const cycle = await this.prisma.billBillingCycle.findUnique({
      where: { id },
    });

    if (!cycle) {
      throw new NotFoundException('دورة الفوترة غير موجودة');
    }

    return cycle;
  }

  async findByCode(cycleCode: string) {
    const cycle = await this.prisma.billBillingCycle.findUnique({
      where: { cycleCode },
    });

    if (!cycle) {
      throw new NotFoundException('دورة الفوترة غير موجودة');
    }

    return cycle;
  }

  async create(dto: CreateBillingCycleDto) {
    // التحقق من عدم تكرار الرمز
    const existing = await this.prisma.billBillingCycle.findUnique({
      where: { cycleCode: dto.cycleCode },
    });

    if (existing) {
      throw new ConflictException('رمز دورة الفوترة موجود مسبقاً');
    }

    return this.prisma.billBillingCycle.create({
      data: {
        cycleCode: dto.cycleCode,
        cycleName: dto.cycleName,
        cycleType: dto.cycleType,
        startDay: dto.startDay,
        endDay: dto.endDay,
        dueDay: dto.dueDay,
        gracePeriod: dto.gracePeriod || 0,
      },
    });
  }

  async update(id: string, dto: UpdateBillingCycleDto) {
    await this.findOne(id);

    return this.prisma.billBillingCycle.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.billBillingCycle.delete({
      where: { id },
    });
  }

  async getActiveCycles() {
    return this.prisma.billBillingCycle.findMany({
      where: { isActive: true },
      orderBy: { cycleCode: 'asc' },
    });
  }
}
