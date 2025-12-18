import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { CreateInstallmentPlanDto, PayInstallmentDto, CancelInstallmentPlanDto, InstallmentPlanStatus, InstallmentStatus } from './dto/installment.dto';

@Injectable()
export class InstallmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  async createPlan(dto: CreateInstallmentPlanDto) {
    // Verify customer exists
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // Check if customer has active installment plan
    const existingPlan = await this.prisma.billInstallmentPlan.findFirst({
      where: {
        customerId: dto.customerId,
        status: InstallmentPlanStatus.ACTIVE,
      },
    });

    if (existingPlan) {
      throw new ConflictException('Customer already has an active installment plan');
    }

    const downPayment = dto.downPayment ?? 0;
    const remainingAmount = dto.totalAmount - downPayment;
    const installmentAmount = remainingAmount / dto.numberOfInstallments;

    // Calculate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + dto.numberOfInstallments);

    // Generate plan number
    const planNo = await this.sequenceService.getNextNumber('installment_plan');

    // Create plan with installments
    const plan = await this.prisma.billInstallmentPlan.create({
      data: {
        planNo,
        customerId: dto.customerId,
        totalAmount: dto.totalAmount,
        downPayment,
        remainingAmount,
        numberOfInstallments: dto.numberOfInstallments,
        installmentAmount,
        startDate,
        endDate,
        status: InstallmentPlanStatus.ACTIVE,
        notes: dto.notes,
        installments: {
          create: Array.from({ length: dto.numberOfInstallments }, (_, i) => {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i + 1);
            return {
              installmentNo: i + 1,
              dueDate,
              amount: installmentAmount,
              status: InstallmentStatus.PENDING,
            };
          }),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        installments: {
          orderBy: { installmentNo: 'asc' },
        },
      },
    });

    // Link invoices if provided
    if (dto.invoiceIds && dto.invoiceIds.length > 0) {
      await this.prisma.billInvoice.updateMany({
        where: {
          id: { in: dto.invoiceIds },
          customerId: dto.customerId,
        },
        data: {
          installmentPlanId: plan.id,
        },
      });
    }

    return plan;
  }

  async findAllPlans(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, customerId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.billInstallmentPlan.findMany({
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
          installments: {
            orderBy: { installmentNo: 'asc' },
          },
        },
      }),
      this.prisma.billInstallmentPlan.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePlan(id: string) {
    const plan = await this.prisma.billInstallmentPlan.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            phone: true,
          },
        },
        installments: {
          orderBy: { installmentNo: 'asc' },
        },
        invoices: {
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            balance: true,
            status: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Installment plan with ID ${id} not found`);
    }

    return plan;
  }

  async payInstallment(planId: string, installmentNo: number, dto: PayInstallmentDto) {
    const plan = await this.findOnePlan(planId);

    if (plan.status !== InstallmentPlanStatus.ACTIVE) {
      throw new BadRequestException('Cannot pay installment for inactive plan');
    }

    const installment = plan.installments.find((i) => i.installmentNo === installmentNo);

    if (!installment) {
      throw new NotFoundException(`Installment ${installmentNo} not found in plan`);
    }

    if (installment.status === InstallmentStatus.PAID) {
      throw new ConflictException('Installment is already paid');
    }

    const expectedAmount = Number(installment.amount);
    if (dto.amount < expectedAmount) {
      throw new BadRequestException(`Payment amount must be at least ${expectedAmount}`);
    }

    // Update installment
    await this.prisma.billInstallment.update({
      where: { id: installment.id },
      data: {
        paidAmount: dto.amount,
        paidDate: new Date(),
        status: InstallmentStatus.PAID,
        notes: dto.notes,
      },
    });

    // Update plan remaining amount
    const newRemainingAmount = Number(plan.remainingAmount) - dto.amount;
    const updateData: any = {
      remainingAmount: Math.max(0, newRemainingAmount),
    };

    // Check if all installments are paid
    const paidInstallments = plan.installments.filter(
      (i) => i.status === InstallmentStatus.PAID || i.installmentNo === installmentNo
    ).length;

    if (paidInstallments >= plan.numberOfInstallments) {
      updateData.status = InstallmentPlanStatus.COMPLETED;
    }

    await this.prisma.billInstallmentPlan.update({
      where: { id: planId },
      data: updateData,
    });

    return this.findOnePlan(planId);
  }

  async cancelPlan(id: string, dto: CancelInstallmentPlanDto) {
    const plan = await this.findOnePlan(id);

    if (plan.status !== InstallmentPlanStatus.ACTIVE) {
      throw new BadRequestException('Can only cancel active plans');
    }

    // Cancel all pending installments
    await this.prisma.billInstallment.updateMany({
      where: {
        planId: id,
        status: InstallmentStatus.PENDING,
      },
      data: {
        status: InstallmentStatus.CANCELLED,
      },
    });

    // Update plan status
    return this.prisma.billInstallmentPlan.update({
      where: { id },
      data: {
        status: InstallmentPlanStatus.CANCELLED,
        notes: `${plan.notes || ''}\nإلغاء: ${dto.reason}`,
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        installments: {
          orderBy: { installmentNo: 'asc' },
        },
      },
    });
  }

  async checkOverdueInstallments() {
    const today = new Date();

    const overdueInstallments = await this.prisma.billInstallment.updateMany({
      where: {
        status: InstallmentStatus.PENDING,
        dueDate: { lt: today },
      },
      data: {
        status: InstallmentStatus.OVERDUE,
      },
    });

    return { updated: overdueInstallments.count };
  }

  async getStatistics() {
    const [total, byStatus, totals] = await Promise.all([
      this.prisma.billInstallmentPlan.count(),
      this.prisma.billInstallmentPlan.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.billInstallmentPlan.aggregate({
        _sum: {
          totalAmount: true,
          remainingAmount: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    return {
      total,
      byStatus: statusMap,
      totalAmount: Number(totals._sum.totalAmount) || 0,
      remainingAmount: Number(totals._sum.remainingAmount) || 0,
    };
  }
}
