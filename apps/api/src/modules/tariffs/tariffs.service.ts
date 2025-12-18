import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTariffDto) {
    // Verify category exists
    const category = await this.prisma.billCustomerCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Customer category with ID ${dto.categoryId} not found`);
    }

    // Validate slice range
    if (dto.toKwh !== undefined && dto.toKwh <= dto.fromKwh) {
      throw new BadRequestException('toKwh must be greater than fromKwh');
    }

    return this.prisma.billTariff.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        nameEn: dto.nameEn,
        sliceOrder: dto.sliceOrder,
        fromKwh: dto.fromKwh,
        toKwh: dto.toKwh !== undefined ? dto.toKwh : null,
        ratePerKwh: dto.ratePerKwh,
        fixedCharge: dto.fixedCharge ?? 0,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        isActive: dto.isActive ?? true,
      },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 10, categoryId, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.billTariff.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ categoryId: 'asc' }, { sliceOrder: 'asc' }],
        include: {
          category: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.billTariff.count({ where }),
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
    const tariff = await this.prisma.billTariff.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!tariff) {
      throw new NotFoundException(`Tariff with ID ${id} not found`);
    }

    return tariff;
  }

  async findByCategory(categoryId: string) {
    const tariffs = await this.prisma.billTariff.findMany({
      where: {
        categoryId,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      orderBy: { sliceOrder: 'asc' },
    });

    return tariffs;
  }

  async update(id: string, dto: UpdateTariffDto) {
    await this.findOne(id);

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.sliceOrder !== undefined) updateData.sliceOrder = dto.sliceOrder;
    if (dto.fromKwh !== undefined) updateData.fromKwh = dto.fromKwh;
    if (dto.toKwh !== undefined) updateData.toKwh = dto.toKwh;
    if (dto.ratePerKwh !== undefined) updateData.ratePerKwh = dto.ratePerKwh;
    if (dto.fixedCharge !== undefined) updateData.fixedCharge = dto.fixedCharge;
    if (dto.effectiveFrom !== undefined) updateData.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) updateData.effectiveTo = new Date(dto.effectiveTo);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.billTariff.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.billTariff.delete({
      where: { id },
    });
  }

  // Calculate consumption amount based on tariff slices
  async calculateConsumption(categoryId: string, consumption: number): Promise<{
    items: Array<{
      description: string;
      fromKwh: number;
      toKwh: number;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    totalAmount: number;
    fixedCharge: number;
  }> {
    const tariffs = await this.findByCategory(categoryId);

    if (tariffs.length === 0) {
      throw new NotFoundException('No active tariffs found for this category');
    }

    let remainingKwh = consumption;
    let totalAmount = 0;
    const items: Array<{
      description: string;
      fromKwh: number;
      toKwh: number;
      quantity: number;
      rate: number;
      amount: number;
    }> = [];

    for (const tariff of tariffs) {
      if (remainingKwh <= 0) break;

      const fromKwh = Number(tariff.fromKwh);
      const toKwh = tariff.toKwh ? Number(tariff.toKwh) : Infinity;
      const ratePerKwh = Number(tariff.ratePerKwh);

      const sliceRange = toKwh - fromKwh;
      const sliceKwh = Math.min(remainingKwh, sliceRange);

      if (sliceKwh > 0) {
        const sliceAmount = sliceKwh * ratePerKwh;
        totalAmount += sliceAmount;

        items.push({
          description: `استهلاك ${fromKwh}-${toKwh === Infinity ? '∞' : toKwh} ك.و.س`,
          fromKwh,
          toKwh: fromKwh + sliceKwh,
          quantity: sliceKwh,
          rate: ratePerKwh,
          amount: sliceAmount,
        });

        remainingKwh -= sliceKwh;
      }
    }

    const fixedCharge = tariffs.length > 0 ? Number(tariffs[0].fixedCharge) : 0;

    return {
      items,
      totalAmount,
      fixedCharge,
    };
  }
}
