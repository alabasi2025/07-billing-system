import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import {
  CreatePOSTransactionDto,
  SearchCustomerDto,

  POSTransactionType,
} from './dto/pos.dto';

@Injectable()
export class POSService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  // البحث عن عميل
  async searchCustomer(params: SearchCustomerDto) {
    const { accountNo, meterNo, idNumber, phone } = params;

    if (!accountNo && !meterNo && !idNumber && !phone) {
      throw new BadRequestException('يجب توفير معيار بحث واحد على الأقل');
    }

    const where: any = {};

    if (accountNo) {
      where.accountNo = { contains: accountNo };
    }

    if (idNumber) {
      where.idNumber = idNumber;
    }

    if (phone) {
      where.phone = { contains: phone };
    }

    let customers = await this.prisma.billCustomer.findMany({
      where,
      include: {
        category: { select: { name: true } },
        meters: {
          where: { status: 'active' },
          select: {
            id: true,
            meterNo: true,
            meterType: { select: { name: true, category: true } },
          },
        },
      },
      take: 10,
    });

    // البحث برقم العداد
    if (meterNo && customers.length === 0) {
      const meter = await this.prisma.billMeter.findFirst({
        where: { meterNo: { contains: meterNo } },
        include: {
          customer: {
            include: {
              category: { select: { name: true } },
              meters: {
                where: { status: 'active' },
                select: {
                  id: true,
                  meterNo: true,
                  meterType: { select: { name: true, category: true } },
                },
              },
            },
          },
        },
      });

      if (meter?.customer) {
        customers = [meter.customer];
      }
    }

    return customers.map((customer) => ({
      id: customer.id,
      accountNo: customer.accountNo,
      name: customer.name,
      phone: customer.phone,
      category: customer.category?.name,
      status: customer.status,
      meters: customer.meters,
    }));
  }

  // الحصول على ملخص حساب العميل
  async getCustomerSummary(customerId: string) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: customerId },
      include: {
        category: { select: { name: true } },
        meters: {
          where: { status: 'active' },
          include: {
            meterType: { select: { name: true, category: true } },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    // الفواتير المستحقة
    const pendingInvoices = await this.prisma.billInvoice.findMany({
      where: {
        customerId,
        status: { in: ['issued', 'partial', 'overdue'] },
        balance: { gt: 0 },
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        invoiceNo: true,
        billingPeriod: true,
        totalAmount: true,
        paidAmount: true,
        balance: true,
        dueDate: true,
        status: true,
      },
    });

    // إجمالي المستحقات
    const totalBalance = pendingInvoices.reduce(
      (sum, inv) => sum + Number(inv.balance),
      0,
    );

    // آخر المدفوعات
    const lastPayments = await this.prisma.billPayment.findMany({
      where: { customerId, status: 'confirmed' },
      orderBy: { paymentDate: 'desc' },
      take: 5,
      select: {
        id: true,
        paymentNo: true,
        amount: true,
        paymentDate: true,
        paymentMethod: true,
      },
    });

    // عدادات الدفع المسبق
    const prepaidMeters = customer.meters.filter(
      (m) => m.meterType?.category === 'prepaid',
    );

    return {
      customer: {
        id: customer.id,
        accountNo: customer.accountNo,
        name: customer.name,
        phone: customer.phone,
        category: customer.category?.name,
        status: customer.status,
      },
      balance: {
        total: totalBalance,
        invoicesCount: pendingInvoices.length,
      },
      pendingInvoices: pendingInvoices.map((inv) => ({
        ...inv,
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        balance: Number(inv.balance),
      })),
      lastPayments: lastPayments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      prepaidMeters: prepaidMeters.map((m) => ({
        id: m.id,
        meterNo: m.meterNo,
        type: m.meterType?.name,
      })),
    };
  }

  // إنشاء معاملة نقطة بيع
  async createTransaction(dto: CreatePOSTransactionDto) {
    const { transactionType, customerId, invoiceId, meterId, amount, paymentMethod, referenceNo, notes } = dto;

    // التحقق من العميل
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    let result: any = {};

    if (transactionType === POSTransactionType.INVOICE_PAYMENT) {
      // دفع فاتورة
      if (!invoiceId) {
        throw new BadRequestException('يجب تحديد الفاتورة');
      }

      const invoice = await this.prisma.billInvoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('الفاتورة غير موجودة');
      }

      if (Number(invoice.balance) <= 0) {
        throw new BadRequestException('الفاتورة مدفوعة بالكامل');
      }

      // إنشاء الدفعة
      const paymentNo = await this.sequenceService.getNextNumber('payment');
      
      const payment = await this.prisma.billPayment.create({
        data: {
          paymentNo,
          customerId,
          invoiceId,
          amount,
          paymentMethod,
          paymentDate: new Date(),
          referenceNo,
          notes,
          status: 'confirmed',
        },
      });

      // تحديث الفاتورة
      const newPaidAmount = Number(invoice.paidAmount) + amount;
      const newBalance = Number(invoice.totalAmount) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await this.prisma.billInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
        },
      });

      result = {
        type: 'invoice_payment',
        paymentNo: payment.paymentNo,
        amount,
        invoiceNo: invoice.invoiceNo,
        remainingBalance: newBalance,
      };
    } else if (transactionType === POSTransactionType.STS_RECHARGE) {
      // شحن STS
      if (!meterId) {
        throw new BadRequestException('يجب تحديد العداد');
      }

      const meter = await this.prisma.billMeter.findUnique({
        where: { id: meterId },
        include: { meterType: true },
      });

      if (!meter) {
        throw new NotFoundException('العداد غير موجود');
      }

      if (meter.meterType?.category !== 'prepaid') {
        throw new BadRequestException('العداد ليس من نوع الدفع المسبق');
      }

      // إنشاء توكن شحن
      const tokenNo = await this.sequenceService.getNextNumber('sts_token');
      const tokenValue = this.generateSTSToken();
      
      const recharge = await this.prisma.billPrepaidToken.create({
        data: {
          tokenNo: `STS-${tokenNo}`,
          token: tokenValue,
          customerId,
          meterId,
          amount,
          units: Math.floor(amount / 0.5), // افتراض 0.5 للوحدة
          paymentMethod,
          status: 'active',
        },
      });

      result = {
        type: 'sts_recharge',
        tokenNo: recharge.tokenNo,
        token: recharge.token,
        amount,
        units: recharge.units,
        meterNo: meter.meterNo,
      };
    }

    return result;
  }

  // إحصائيات نقطة البيع
  async getStatistics(fromDate?: string, toDate?: string) {
    const where: any = {
      status: 'confirmed',
    };

    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) where.paymentDate.gte = new Date(fromDate);
      if (toDate) where.paymentDate.lte = new Date(toDate);
    }

    const payments = await this.prisma.billPayment.findMany({
      where,
    });

    const byMethod: Record<string, { count: number; amount: number }> = {};

    for (const payment of payments) {
      const method = payment.paymentMethod;
      if (!byMethod[method]) {
        byMethod[method] = { count: 0, amount: 0 };
      }
      byMethod[method].count += 1;
      byMethod[method].amount += Number(payment.amount);
    }

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // شحنات STS
    const rechargeWhere: any = {
      status: { in: ['active', 'used'] },
    };

    if (fromDate || toDate) {
      rechargeWhere.createdAt = {};
      if (fromDate) rechargeWhere.createdAt.gte = new Date(fromDate);
      if (toDate) rechargeWhere.createdAt.lte = new Date(toDate);
    }

    const recharges = await this.prisma.billPrepaidToken.findMany({
      where: rechargeWhere,
    });

    const totalRecharges = recharges.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      payments: {
        count: payments.length,
        total: totalAmount,
        byMethod: Object.entries(byMethod).map(([method, values]) => ({
          method,
          ...values,
        })),
      },
      recharges: {
        count: recharges.length,
        total: totalRecharges,
      },
      grandTotal: totalAmount + totalRecharges,
    };
  }

  // توليد توكن STS
  private generateSTSToken(): string {
    const chars = '0123456789';
    let token = '';
    for (let i = 0; i < 20; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
