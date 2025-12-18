import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { CreatePaymentPlanDto, PayInstallmentDto, ApprovePaymentPlanDto } from './dto';

@Injectable()
export class PaymentPlansService {
  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    customerId?: string;
    status?: string;
  }) {
    const { skip = 0, take = 10, customerId, status } = params;

    const where: any = { isDeleted: false };

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.billPaymentPlan.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          installments: {
            orderBy: { installmentNumber: 'asc' },
          },
        },
      }),
      this.prisma.billPaymentPlan.count({ where }),
    ]);

    return { data, meta: { total, skip, take, hasMore: skip + take < total } };
  }

  async findOne(id: string) {
    const plan = await this.prisma.billPaymentPlan.findFirst({
      where: { id, isDeleted: false },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('خطة السداد غير موجودة');
    }

    return plan;
  }

  async findByCustomer(customerId: string) {
    return this.prisma.billPaymentPlan.findMany({
      where: { customerId, isDeleted: false },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePaymentPlanDto) {
    // التحقق من وجود العميل
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    // إنشاء رقم الخطة
    const planNumber = await this.sequenceService.getNextNumber('PP');

    // حساب المبلغ المتبقي بعد الدفعة المقدمة
    const downPayment = dto.downPayment || 0;
    const remainingAmount = dto.totalAmount - downPayment;

    // حساب قيمة القسط
    const interestRate = dto.interestRate || 0;
    const totalWithInterest = remainingAmount * (1 + interestRate / 100);
    const installmentAmount = Math.ceil(totalWithInterest / dto.numberOfInstallments);

    // إنشاء خطة السداد
    const plan = await this.prisma.billPaymentPlan.create({
      data: {
        planNumber,
        customerId: dto.customerId,
        totalAmount: dto.totalAmount,
        downPayment,
        remainingAmount,
        numberOfInstallments: dto.numberOfInstallments,
        installmentAmount,
        startDate: new Date(dto.startDate),
        interestRate,
        penaltyOnLate: dto.penaltyOnLate || 0,
        notes: dto.notes,
        status: 'active',
      },
    });

    // إنشاء الأقساط
    const startDate = new Date(dto.startDate);
    const installments = [];

    for (let i = 1; i <= dto.numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installments.push({
        planId: plan.id,
        installmentNumber: i,
        dueDate,
        amount: installmentAmount,
        status: 'pending',
      });
    }

    await this.prisma.billPaymentPlanInstallment.createMany({
      data: installments,
    });

    // ربط الديون بخطة السداد إذا تم تحديدها
    if (dto.debtIds && dto.debtIds.length > 0) {
      await this.prisma.billDebt.updateMany({
        where: { id: { in: dto.debtIds } },
        data: { paymentPlanId: plan.id },
      });
    }

    return this.findOne(plan.id);
  }

  async approve(id: string, dto: ApprovePaymentPlanDto) {
    const plan = await this.findOne(id);

    if (plan.approvedAt) {
      throw new BadRequestException('الخطة معتمدة بالفعل');
    }

    return this.prisma.billPaymentPlan.update({
      where: { id },
      data: {
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        notes: dto.notes ? `${plan.notes || ''}\nموافقة: ${dto.notes}` : plan.notes,
      },
      include: {
        installments: true,
      },
    });
  }

  async payInstallment(planId: string, installmentId: string, dto: PayInstallmentDto) {
    const plan = await this.findOne(planId);

    const installment = plan.installments.find(i => i.id === installmentId);
    if (!installment) {
      throw new NotFoundException('القسط غير موجود');
    }

    if (installment.status === 'paid') {
      throw new BadRequestException('القسط مسدد بالفعل');
    }

    const newPaidAmount = Number(installment.paidAmount) + dto.amount;
    const remaining = Number(installment.amount) - newPaidAmount;

    let status = 'partial';
    if (remaining <= 0) {
      status = 'paid';
    }

    // تحديث القسط
    await this.prisma.billPaymentPlanInstallment.update({
      where: { id: installmentId },
      data: {
        paidAmount: newPaidAmount,
        paidDate: status === 'paid' ? new Date() : null,
        paymentId: dto.paymentId,
        status,
      },
    });

    // تحديث المبلغ المتبقي في الخطة
    const paidInstallments = plan.installments.filter(i => i.status === 'paid' || i.id === installmentId);
    const totalPaid = paidInstallments.reduce((sum, i) => sum + Number(i.paidAmount), 0) + dto.amount;
    const planRemaining = Number(plan.totalAmount) - Number(plan.downPayment) - totalPaid;

    // التحقق من اكتمال الخطة
    const allPaid = plan.installments.every(i => 
      i.id === installmentId ? status === 'paid' : i.status === 'paid'
    );

    await this.prisma.billPaymentPlan.update({
      where: { id: planId },
      data: {
        remainingAmount: planRemaining > 0 ? planRemaining : 0,
        status: allPaid ? 'completed' : 'active',
        endDate: allPaid ? new Date() : null,
      },
    });

    return this.findOne(planId);
  }

  async cancel(id: string, reason: string) {
    await this.findOne(id);

    return this.prisma.billPaymentPlan.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: `إلغاء: ${reason}`,
      },
    });
  }

  async checkOverdue() {
    const now = new Date();

    // تحديث الأقساط المتأخرة
    await this.prisma.billPaymentPlanInstallment.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['pending', 'partial'] },
        isDeleted: false,
      },
      data: { status: 'overdue' },
    });

    // جلب الخطط التي بها أقساط متأخرة
    const overdueInstallments = await this.prisma.billPaymentPlanInstallment.findMany({
      where: { status: 'overdue', isDeleted: false },
      include: { plan: true },
    });

    return {
      count: overdueInstallments.length,
      installments: overdueInstallments,
    };
  }

  async getStatistics() {
    const [total, active, completed, defaulted, cancelled] = await Promise.all([
      this.prisma.billPaymentPlan.count({ where: { isDeleted: false } }),
      this.prisma.billPaymentPlan.count({ where: { isDeleted: false, status: 'active' } }),
      this.prisma.billPaymentPlan.count({ where: { isDeleted: false, status: 'completed' } }),
      this.prisma.billPaymentPlan.count({ where: { isDeleted: false, status: 'defaulted' } }),
      this.prisma.billPaymentPlan.count({ where: { isDeleted: false, status: 'cancelled' } }),
    ]);

    const totalRemaining = await this.prisma.billPaymentPlan.aggregate({
      where: { isDeleted: false, status: 'active' },
      _sum: { remainingAmount: true },
    });

    const overdueInstallments = await this.prisma.billPaymentPlanInstallment.count({
      where: { status: 'overdue', isDeleted: false },
    });

    return {
      total,
      active,
      completed,
      defaulted,
      cancelled,
      totalRemainingAmount: totalRemaining._sum.remainingAmount || 0,
      overdueInstallments,
    };
  }
}
