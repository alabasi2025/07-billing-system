import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDebtDto, UpdateDebtDto, PayDebtDto } from './dto';

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    customerId?: string;
    status?: string;
    debtType?: string;
  }) {
    const { skip = 0, take = 10, customerId, status, debtType } = params;

    const where: any = { isDeleted: false };

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (debtType) where.debtType = debtType;

    const [data, total] = await Promise.all([
      this.prisma.billDebt.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billDebt.count({ where }),
    ]);

    return { data, meta: { total, skip, take, hasMore: skip + take < total } };
  }

  async findOne(id: string) {
    const debt = await this.prisma.billDebt.findFirst({
      where: { id, isDeleted: false },
    });

    if (!debt) {
      throw new NotFoundException('الدين غير موجود');
    }

    return debt;
  }

  async findByCustomer(customerId: string) {
    const debts = await this.prisma.billDebt.findMany({
      where: { customerId, isDeleted: false, status: { in: ['outstanding', 'partial'] } },
      orderBy: { dueDate: 'asc' },
    });

    const totalOutstanding = debts.reduce((sum, d) => sum + Number(d.remainingAmount), 0);

    return {
      debts,
      summary: {
        count: debts.length,
        totalOutstanding,
      },
    };
  }

  async create(dto: CreateDebtDto) {
    // التحقق من وجود العميل
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    return this.prisma.billDebt.create({
      data: {
        customerId: dto.customerId,
        debtType: dto.debtType,
        referenceId: dto.referenceId,
        originalAmount: dto.originalAmount,
        remainingAmount: dto.originalAmount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        penaltyAmount: dto.penaltyAmount || 0,
        notes: dto.notes,
        status: 'outstanding',
      },
    });
  }

  async update(id: string, dto: UpdateDebtDto) {
    await this.findOne(id);

    const updateData: any = { ...dto };

    // إذا تم تحديث المبلغ المدفوع، نحدث المبلغ المتبقي
    if (dto.paidAmount !== undefined) {
      const debt = await this.findOne(id);
      const remaining = Number(debt.originalAmount) + Number(debt.penaltyAmount) - dto.paidAmount;
      updateData.remainingAmount = remaining;

      // تحديث الحالة تلقائياً
      if (remaining <= 0) {
        updateData.status = 'paid';
        updateData.remainingAmount = 0;
      } else if (dto.paidAmount > 0) {
        updateData.status = 'partial';
      }
    }

    return this.prisma.billDebt.update({
      where: { id },
      data: updateData,
    });
  }

  async payDebt(id: string, dto: PayDebtDto) {
    const debt = await this.findOne(id);

    if (debt.status === 'paid') {
      throw new BadRequestException('الدين مسدد بالفعل');
    }

    const newPaidAmount = Number(debt.paidAmount) + dto.amount;
    const totalDue = Number(debt.originalAmount) + Number(debt.penaltyAmount);
    const remaining = totalDue - newPaidAmount;

    let status = 'partial';
    if (remaining <= 0) {
      status = 'paid';
    }

    return this.prisma.billDebt.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: remaining > 0 ? remaining : 0,
        status,
        notes: dto.notes ? `${debt.notes || ''}\n${dto.notes}` : debt.notes,
      },
    });
  }

  async writeOff(id: string, reason: string) {
    await this.findOne(id);

    return this.prisma.billDebt.update({
      where: { id },
      data: {
        status: 'written_off',
        notes: `شطب الدين: ${reason}`,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.billDebt.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getAgingReport() {
    const debts = await this.prisma.billDebt.findMany({
      where: { isDeleted: false, status: { in: ['outstanding', 'partial'] } },
    });

    const now = new Date();
    const aging = {
      current: 0,      // 0-30 يوم
      days30: 0,       // 31-60 يوم
      days60: 0,       // 61-90 يوم
      days90: 0,       // 91-180 يوم
      days180Plus: 0,  // أكثر من 180 يوم
    };

    debts.forEach(debt => {
      const dueDate = debt.dueDate || debt.createdAt;
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(debt.remainingAmount);

      if (daysDiff <= 30) {
        aging.current += amount;
      } else if (daysDiff <= 60) {
        aging.days30 += amount;
      } else if (daysDiff <= 90) {
        aging.days60 += amount;
      } else if (daysDiff <= 180) {
        aging.days90 += amount;
      } else {
        aging.days180Plus += amount;
      }
    });

    return {
      aging,
      total: aging.current + aging.days30 + aging.days60 + aging.days90 + aging.days180Plus,
      count: debts.length,
    };
  }

  async getStatistics() {
    const [total, outstanding, partial, paid, writtenOff] = await Promise.all([
      this.prisma.billDebt.count({ where: { isDeleted: false } }),
      this.prisma.billDebt.count({ where: { isDeleted: false, status: 'outstanding' } }),
      this.prisma.billDebt.count({ where: { isDeleted: false, status: 'partial' } }),
      this.prisma.billDebt.count({ where: { isDeleted: false, status: 'paid' } }),
      this.prisma.billDebt.count({ where: { isDeleted: false, status: 'written_off' } }),
    ]);

    const totalOutstanding = await this.prisma.billDebt.aggregate({
      where: { isDeleted: false, status: { in: ['outstanding', 'partial'] } },
      _sum: { remainingAmount: true },
    });

    return {
      total,
      outstanding,
      partial,
      paid,
      writtenOff,
      totalOutstandingAmount: totalOutstanding._sum.remainingAmount || 0,
    };
  }
}
