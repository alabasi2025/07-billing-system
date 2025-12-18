import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalCustomers,
      activeCustomers,
      totalMeters,
      activeMeters,
      pendingInvoices,
      overdueInvoices,
      monthlyRevenue,
      monthlyCollection,
    ] = await Promise.all([
      this.prisma.billCustomer.count(),
      this.prisma.billCustomer.count({ where: { status: 'active' } }),
      this.prisma.billMeter.count(),
      this.prisma.billMeter.count({ where: { status: 'active' } }),
      this.prisma.billInvoice.count({ where: { status: { in: ['issued', 'partial'] } } }),
      this.prisma.billInvoice.count({ where: { status: 'overdue' } }),
      this.getMonthlyRevenue(),
      this.getMonthlyCollection(),
    ]);

    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: totalCustomers - activeCustomers,
      },
      meters: {
        total: totalMeters,
        active: activeMeters,
        inactive: totalMeters - activeMeters,
      },
      invoices: {
        pending: pendingInvoices,
        overdue: overdueInvoices,
      },
      revenue: {
        monthly: monthlyRevenue,
        collection: monthlyCollection,
      },
    };
  }

  private async getMonthlyRevenue() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.prisma.billInvoice.aggregate({
      where: {
        issuedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { notIn: ['cancelled', 'draft'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return Number(result._sum.totalAmount ?? 0);
  }

  private async getMonthlyCollection() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.prisma.billPayment.aggregate({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'confirmed',
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount ?? 0);
  }

  async getRevenueReport(params: {
    fromDate?: string;
    toDate?: string;
    categoryId?: string;
    groupBy?: string;
  }) {
    const { fromDate, toDate, categoryId, groupBy = 'month' } = params;

    const where: any = {
      status: { notIn: ['cancelled', 'draft'] },
    };

    if (fromDate || toDate) {
      where.issuedAt = {};
      if (fromDate) where.issuedAt.gte = new Date(fromDate);
      if (toDate) where.issuedAt.lte = new Date(toDate);
    }

    if (categoryId) {
      where.customer = { categoryId };
    }

    const invoices = await this.prisma.billInvoice.findMany({
      where,
      include: {
        customer: {
          select: {
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: 'asc' },
    });

    // Group data
    const grouped: Record<string, { invoiced: number; collected: number; count: number }> = {};

    for (const invoice of invoices) {
      let key: string;
      if (groupBy === 'day') {
        key = invoice.issuedAt.toISOString().split('T')[0];
      } else if (groupBy === 'category') {
        key = invoice.customer.category?.name ?? 'غير محدد';
      } else {
        key = invoice.billingPeriod;
      }

      if (!grouped[key]) {
        grouped[key] = { invoiced: 0, collected: 0, count: 0 };
      }

      grouped[key].invoiced += Number(invoice.totalAmount);
      grouped[key].collected += Number(invoice.paidAmount);
      grouped[key].count += 1;
    }

    const data = Object.entries(grouped).map(([period, values]) => ({
      period,
      ...values,
      outstanding: values.invoiced - values.collected,
      collectionRate: values.invoiced > 0 
        ? Math.round((values.collected / values.invoiced) * 100) 
        : 0,
    }));

    const totals = data.reduce(
      (acc, item) => ({
        invoiced: acc.invoiced + item.invoiced,
        collected: acc.collected + item.collected,
        count: acc.count + item.count,
      }),
      { invoiced: 0, collected: 0, count: 0 }
    );

    return {
      data,
      totals: {
        ...totals,
        outstanding: totals.invoiced - totals.collected,
        collectionRate: totals.invoiced > 0 
          ? Math.round((totals.collected / totals.invoiced) * 100) 
          : 0,
      },
    };
  }

  async getCustomerReport(params: { categoryId?: string; status?: string }) {
    const { categoryId, status } = params;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const customers = await this.prisma.billCustomer.groupBy({
      by: ['categoryId', 'status'],
      where,
      _count: true,
    });

    const categories = await this.prisma.billCustomerCategory.findMany({
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const grouped: Record<string, Record<string, number>> = {};

    for (const item of customers) {
      const categoryName = categoryMap.get(item.categoryId) ?? 'غير محدد';
      if (!grouped[categoryName]) {
        grouped[categoryName] = { active: 0, suspended: 0, disconnected: 0, closed: 0 };
      }
      grouped[categoryName][item.status] = item._count;
    }

    const data = Object.entries(grouped).map(([category, statuses]) => ({
      category,
      ...statuses,
      total: Object.values(statuses).reduce((a, b) => a + b, 0),
    }));

    return { data };
  }

  async getConsumptionReport(params: { billingPeriod?: string; categoryId?: string }) {
    const { billingPeriod, categoryId } = params;

    const where: any = {};
    if (billingPeriod) where.billingPeriod = billingPeriod;
    if (categoryId) where.customer = { categoryId };

    const invoices = await this.prisma.billInvoice.findMany({
      where,
      include: {
        customer: {
          select: {
            categoryId: true,
            category: {
              select: { name: true },
            },
          },
        },
      },
    });

    const grouped: Record<string, { consumption: number; amount: number; count: number }> = {};

    for (const invoice of invoices) {
      const categoryName = invoice.customer.category?.name ?? 'غير محدد';
      if (!grouped[categoryName]) {
        grouped[categoryName] = { consumption: 0, amount: 0, count: 0 };
      }

      grouped[categoryName].consumption += Number(invoice.consumption);
      grouped[categoryName].amount += Number(invoice.consumptionAmount);
      grouped[categoryName].count += 1;
    }

    const data = Object.entries(grouped).map(([category, values]) => ({
      category,
      ...values,
      avgConsumption: values.count > 0 ? Math.round(values.consumption / values.count) : 0,
      avgAmount: values.count > 0 ? Math.round(values.amount / values.count) : 0,
    }));

    return { data };
  }

  async getOutstandingReport(params: { asOfDate?: string; categoryId?: string }) {
    const { asOfDate, categoryId } = params;

    const where: any = {
      status: { in: ['issued', 'partial', 'overdue'] },
      balance: { gt: 0 },
    };

    if (asOfDate) {
      where.dueDate = { lte: new Date(asOfDate) };
    }

    if (categoryId) {
      where.customer = { categoryId };
    }

    const invoices = await this.prisma.billInvoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            category: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const data = invoices.map((invoice) => {
      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        invoiceNo: invoice.invoiceNo,
        customer: invoice.customer,
        billingPeriod: invoice.billingPeriod,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balance: Number(invoice.balance),
        dueDate: invoice.dueDate,
        daysOverdue,
        agingBucket: this.getAgingBucket(daysOverdue),
      };
    });

    // Summary by aging bucket
    const summary = data.reduce(
      (acc, item) => {
        acc[item.agingBucket] = (acc[item.agingBucket] || 0) + item.balance;
        acc.total += item.balance;
        return acc;
      },
      { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 }
    );

    return { data, summary };
  }

  private getAgingBucket(daysOverdue: number): string {
    if (daysOverdue <= 0) return 'current';
    if (daysOverdue <= 30) return '1-30';
    if (daysOverdue <= 60) return '31-60';
    if (daysOverdue <= 90) return '61-90';
    return '90+';
  }

  // تقرير الدعم الحكومي
  async getSubsidyReport(params: { fromDate?: string; toDate?: string; categoryId?: string }) {
    const { fromDate, toDate, categoryId } = params;

    const where: any = {
      isSubsidized: true,
    };

    if (categoryId) where.categoryId = categoryId;

    const customers = await this.prisma.billCustomer.findMany({
      where,
      include: {
        category: { select: { name: true } },
      },
    });

    // حساب إجمالي الدعم من الفواتير
    const invoiceWhere: any = {
      customer: { isSubsidized: true },
      status: { notIn: ['cancelled', 'draft'] },
    };

    if (fromDate || toDate) {
      invoiceWhere.issuedAt = {};
      if (fromDate) invoiceWhere.issuedAt.gte = new Date(fromDate);
      if (toDate) invoiceWhere.issuedAt.lte = new Date(toDate);
    }

    const invoices = await this.prisma.billInvoice.findMany({
      where: invoiceWhere,
      include: {
        customer: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    // تجميع بيانات الدعم
    const grouped: Record<string, { customers: number; totalConsumption: number; totalAmount: number; subsidyAmount: number }> = {};

    for (const invoice of invoices) {
      const categoryName = invoice.customer.category?.name ?? 'غير محدد';
      if (!grouped[categoryName]) {
        grouped[categoryName] = { customers: 0, totalConsumption: 0, totalAmount: 0, subsidyAmount: 0 };
      }

      // افتراض نسبة دعم ثابتة 50% للعملاء المدعومين
      const subsidyPercentage = invoice.customer.isSubsidized ? 50 : 0;
      const totalAmount = Number(invoice.totalAmount);
      const subsidyAmount = (totalAmount * subsidyPercentage) / 100;

      grouped[categoryName].totalConsumption += Number(invoice.consumption);
      grouped[categoryName].totalAmount += totalAmount;
      grouped[categoryName].subsidyAmount += subsidyAmount;
    }

    // إضافة عدد العملاء
    for (const customer of customers) {
      const categoryName = customer.category?.name ?? 'غير محدد';
      if (!grouped[categoryName]) {
        grouped[categoryName] = { customers: 0, totalConsumption: 0, totalAmount: 0, subsidyAmount: 0 };
      }
      grouped[categoryName].customers += 1;
    }

    const data = Object.entries(grouped).map(([category, values]) => ({
      category,
      ...values,
    }));

    const totals = data.reduce(
      (acc, item) => ({
        customers: acc.customers + item.customers,
        totalConsumption: acc.totalConsumption + item.totalConsumption,
        totalAmount: acc.totalAmount + item.totalAmount,
        subsidyAmount: acc.subsidyAmount + item.subsidyAmount,
      }),
      { customers: 0, totalConsumption: 0, totalAmount: 0, subsidyAmount: 0 }
    );

    return { data, totals };
  }

  // تقرير العدادات
  async getMeterReport(params: { meterTypeId?: string; status?: string }) {
    const { meterTypeId, status } = params;

    const where: any = {};
    if (meterTypeId) where.meterTypeId = meterTypeId;
    if (status) where.status = status;

    const meters = await this.prisma.billMeter.groupBy({
      by: ['meterTypeId', 'status'],
      where,
      _count: true,
    });

    const meterTypes = await this.prisma.billMeterType.findMany({
      select: { id: true, name: true },
    });

    const typeMap = new Map(meterTypes.map((t) => [t.id, t.name]));

    const grouped: Record<string, Record<string, number>> = {};

    for (const item of meters) {
      const typeName = typeMap.get(item.meterTypeId) ?? 'غير محدد';
      if (!grouped[typeName]) {
        grouped[typeName] = { active: 0, inactive: 0, faulty: 0, replaced: 0 };
      }
      grouped[typeName][item.status] = item._count;
    }

    const data = Object.entries(grouped).map(([meterType, statuses]) => ({
      meterType,
      ...statuses,
      total: Object.values(statuses).reduce((a, b) => a + b, 0),
    }));

    return { data };
  }

  // تقرير التحصيل
  async getCollectionReport(params: { fromDate?: string; toDate?: string; paymentMethod?: string }) {
    const { fromDate, toDate, paymentMethod } = params;

    const where: any = {
      status: 'confirmed',
    };

    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) where.paymentDate.gte = new Date(fromDate);
      if (toDate) where.paymentDate.lte = new Date(toDate);
    }

    if (paymentMethod) where.paymentMethod = paymentMethod;

    const payments = await this.prisma.billPayment.findMany({
      where,
      include: {
        customer: {
          select: {
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    });

    // تجميع حسب طريقة الدفع
    const byMethod: Record<string, { count: number; amount: number }> = {};
    const byCategory: Record<string, { count: number; amount: number }> = {};
    const byDate: Record<string, { count: number; amount: number }> = {};

    for (const payment of payments) {
      const method = payment.paymentMethod;
      const category = payment.customer.category?.name ?? 'غير محدد';
      const date = payment.paymentDate.toISOString().split('T')[0];

      if (!byMethod[method]) byMethod[method] = { count: 0, amount: 0 };
      byMethod[method].count += 1;
      byMethod[method].amount += Number(payment.amount);

      if (!byCategory[category]) byCategory[category] = { count: 0, amount: 0 };
      byCategory[category].count += 1;
      byCategory[category].amount += Number(payment.amount);

      if (!byDate[date]) byDate[date] = { count: 0, amount: 0 };
      byDate[date].count += 1;
      byDate[date].amount += Number(payment.amount);
    }

    const totals = {
      count: payments.length,
      amount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    };

    return {
      byMethod: Object.entries(byMethod).map(([method, values]) => ({ method, ...values })),
      byCategory: Object.entries(byCategory).map(([category, values]) => ({ category, ...values })),
      byDate: Object.entries(byDate).map(([date, values]) => ({ date, ...values })),
      totals,
    };
  }

  // تقرير خطط التقسيط
  async getInstallmentReport(params: { status?: string }) {
    const { status } = params;

    const where: any = {};
    if (status) where.status = status;

    const plans = await this.prisma.billInstallmentPlan.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            accountNo: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const summary = {
      totalPlans: plans.length,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      byStatus: {} as Record<string, number>,
    };

    for (const plan of plans) {
      summary.totalAmount += Number(plan.totalAmount);
      summary.remainingAmount += Number(plan.remainingAmount);
      summary.byStatus[plan.status] = (summary.byStatus[plan.status] || 0) + 1;
    }

    // حساب المبلغ المدفوع
    summary.paidAmount = summary.totalAmount - summary.remainingAmount;

    return {
      data: plans.map((plan) => ({
        planNo: plan.planNo,
        customer: plan.customer,
        totalAmount: Number(plan.totalAmount),
        paidAmount: Number(plan.totalAmount) - Number(plan.remainingAmount),
        remainingAmount: Number(plan.remainingAmount),
        numberOfInstallments: plan.numberOfInstallments,
        status: plan.status,
        startDate: plan.startDate,
        endDate: plan.endDate,
      })),
      summary,
    };
  }

  // تقرير الفصل والتوصيل
  async getDisconnectionReport(params: { fromDate?: string; toDate?: string; reason?: string }) {
    const { fromDate, toDate, reason } = params;

    const where: any = {};

    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) where.scheduledDate.gte = new Date(fromDate);
      if (toDate) where.scheduledDate.lte = new Date(toDate);
    }

    if (reason) where.reason = reason;

    const orders = await this.prisma.billDisconnectionOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            accountNo: true,
            category: { select: { name: true } },
          },
        },
        meter: {
          select: { meterNo: true },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    const summary = {
      total: orders.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byReason: {} as Record<string, number>,
    };

    for (const order of orders) {
      summary.byType[order.orderType] = (summary.byType[order.orderType] || 0) + 1;
      summary.byStatus[order.status] = (summary.byStatus[order.status] || 0) + 1;
      summary.byReason[order.reason] = (summary.byReason[order.reason] || 0) + 1;
    }

    return {
      data: orders.map((order) => ({
        orderNo: order.orderNo,
        customer: order.customer,
        meter: order.meter,
        orderType: order.orderType,
        reason: order.reason,
        status: order.status,
        scheduledDate: order.scheduledDate,
        executedDate: order.executedDate,
      })),
      summary,
    };
  }

  // تقرير الشكاوى
  async getComplaintReport(params: { fromDate?: string; toDate?: string; status?: string }) {
    const { fromDate, toDate, status } = params;

    const where: any = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (status) where.status = status;

    const complaints = await this.prisma.billComplaint.findMany({
      where,
      select: {
        type: true,
        status: true,
      },
    });

    const byType: Record<string, Record<string, number>> = {};

    for (const item of complaints) {
      if (!byType[item.type]) {
        byType[item.type] = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
      }
      byType[item.type][item.status] = (byType[item.type][item.status] || 0) + 1;
    }

    const data = Object.entries(byType).map(([type, statuses]) => {
      const total = Object.values(statuses).reduce((a, b) => a + b, 0);
      return {
        type,
        open: statuses.open || 0,
        in_progress: statuses.in_progress || 0,
        resolved: statuses.resolved || 0,
        closed: statuses.closed || 0,
        total,
      };
    });

    const totals = data.reduce(
      (acc, item) => ({
        open: acc.open + item.open,
        in_progress: acc.in_progress + item.in_progress,
        resolved: acc.resolved + item.resolved,
        closed: acc.closed + item.closed,
        total: acc.total + item.total,
      }),
      { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 }
    );

    return { data, totals };
  }

  // تقرير إغلاق الصندوق اليومي
  async getDailyCashClosingReport(params: { date: string; posTerminalId?: string }) {
    const { date, posTerminalId } = params;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      paymentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'confirmed',
    };

    if (posTerminalId) {
      where.posTerminalId = posTerminalId;
    }

    // جلب جميع المدفوعات لليوم
    const payments = await this.prisma.billPayment.findMany({
      where,
      include: {
        customer: {
          select: {
            accountNo: true,
            name: true,
          },
        },
        invoice: {
          select: {
            invoiceNo: true,
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    });

    // تجميع حسب طريقة الدفع
    const byMethod: Record<string, { count: number; amount: number }> = {};
    for (const payment of payments) {
      const method = payment.paymentMethod;
      if (!byMethod[method]) {
        byMethod[method] = { count: 0, amount: 0 };
      }
      byMethod[method].count += 1;
      byMethod[method].amount += Number(payment.amount);
    }

    // حساب الإجماليات
    const totals = {
      totalPayments: payments.length,
      totalCash: byMethod['cash']?.amount || 0,
      totalBank: (byMethod['bank']?.amount || 0) + (byMethod['card']?.amount || 0) + (byMethod['online']?.amount || 0),
      totalCheque: byMethod['cheque']?.amount || 0,
      grandTotal: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    };

    // جلب الفواتير المصدرة في نفس اليوم
    const invoicesIssued = await this.prisma.billInvoice.aggregate({
      where: {
        issuedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { notIn: ['cancelled', 'draft'] },
      },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    return {
      date,
      payments: payments.map((p) => ({
        paymentNo: p.paymentNo,
        customer: p.customer,
        invoiceNo: p.invoice?.invoiceNo,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        receiptNo: p.receiptNo,
      })),
      byMethod: Object.entries(byMethod).map(([method, values]) => ({
        method,
        ...values,
      })),
      invoicesIssued: {
        count: invoicesIssued._count,
        amount: Number(invoicesIssued._sum.totalAmount || 0),
      },
      totals,
      closingBalance: {
        openingBalance: 0, // يمكن جلبه من جلسة نقطة البيع
        receipts: totals.grandTotal,
        disbursements: 0,
        closingBalance: totals.grandTotal,
      },
    };
  }

  // تقرير أعمار الذمم المدينة التفصيلي
  async getDetailedAgingReport(params: { asOfDate?: string; categoryId?: string; minBalance?: number }) {
    const { asOfDate, categoryId, minBalance = 0 } = params;

    const referenceDate = asOfDate ? new Date(asOfDate) : new Date();

    const where: any = {
      status: { in: ['issued', 'partial', 'overdue'] },
      balance: { gt: minBalance },
    };

    if (categoryId) {
      where.customer = { categoryId };
    }

    const invoices = await this.prisma.billInvoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            phone: true,
            category: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ customer: { accountNo: 'asc' } }, { dueDate: 'asc' }],
    });

    // تجميع حسب العميل مع تفصيل أعمار الذمم
    const customerData: Record<string, {
      customer: any;
      current: number;
      days1to30: number;
      days31to60: number;
      days61to90: number;
      days90plus: number;
      total: number;
      invoices: any[];
    }> = {};

    for (const invoice of invoices) {
      const customerId = invoice.customerId;
      const daysOverdue = Math.max(
        0,
        Math.floor((referenceDate.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const balance = Number(invoice.balance);

      if (!customerData[customerId]) {
        customerData[customerId] = {
          customer: invoice.customer,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90plus: 0,
          total: 0,
          invoices: [],
        };
      }

      // تصنيف حسب العمر
      if (daysOverdue <= 0) {
        customerData[customerId].current += balance;
      } else if (daysOverdue <= 30) {
        customerData[customerId].days1to30 += balance;
      } else if (daysOverdue <= 60) {
        customerData[customerId].days31to60 += balance;
      } else if (daysOverdue <= 90) {
        customerData[customerId].days61to90 += balance;
      } else {
        customerData[customerId].days90plus += balance;
      }

      customerData[customerId].total += balance;
      customerData[customerId].invoices.push({
        invoiceNo: invoice.invoiceNo,
        billingPeriod: invoice.billingPeriod,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balance,
        dueDate: invoice.dueDate,
        daysOverdue,
      });
    }

    const data = Object.values(customerData);

    // حساب الإجماليات
    const totals = data.reduce(
      (acc, item) => ({
        current: acc.current + item.current,
        days1to30: acc.days1to30 + item.days1to30,
        days31to60: acc.days31to60 + item.days31to60,
        days61to90: acc.days61to90 + item.days61to90,
        days90plus: acc.days90plus + item.days90plus,
        total: acc.total + item.total,
        customerCount: acc.customerCount + 1,
        invoiceCount: acc.invoiceCount + item.invoices.length,
      }),
      { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 0, customerCount: 0, invoiceCount: 0 }
    );

    // حساب النسب المئوية
    const percentages = {
      current: totals.total > 0 ? Math.round((totals.current / totals.total) * 100) : 0,
      days1to30: totals.total > 0 ? Math.round((totals.days1to30 / totals.total) * 100) : 0,
      days31to60: totals.total > 0 ? Math.round((totals.days31to60 / totals.total) * 100) : 0,
      days61to90: totals.total > 0 ? Math.round((totals.days61to90 / totals.total) * 100) : 0,
      days90plus: totals.total > 0 ? Math.round((totals.days90plus / totals.total) * 100) : 0,
    };

    return {
      asOfDate: referenceDate.toISOString().split('T')[0],
      data,
      totals,
      percentages,
    };
  }

  // كشف حساب العميل التفصيلي
  async getCustomerStatement(params: {
    customerId: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const { customerId, fromDate, toDate } = params;

    // جلب بيانات العميل
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: customerId },
      include: {
        category: { select: { name: true } },
      },
    });

    if (!customer) {
      throw new Error('العميل غير موجود');
    }

    // تحديد نطاق التاريخ
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    // جلب الفواتير
    const invoiceWhere: any = { customerId };
    if (fromDate || toDate) {
      invoiceWhere.issuedAt = dateFilter;
    }

    const invoices = await this.prisma.billInvoice.findMany({
      where: invoiceWhere,
      orderBy: { issuedAt: 'asc' },
    });

    // جلب المدفوعات
    const paymentWhere: any = { customerId };
    if (fromDate || toDate) {
      paymentWhere.paymentDate = dateFilter;
    }

    const payments = await this.prisma.billPayment.findMany({
      where: paymentWhere,
      orderBy: { paymentDate: 'asc' },
    });

    // دمج وترتيب الحركات
    const transactions: any[] = [];

    for (const invoice of invoices) {
      transactions.push({
        date: invoice.issuedAt,
        type: 'invoice',
        referenceNo: invoice.invoiceNo,
        description: `فاتورة ${invoice.billingPeriod}`,
        debit: Number(invoice.totalAmount),
        credit: 0,
        consumption: Number(invoice.consumption),
      });
    }

    for (const payment of payments) {
      transactions.push({
        date: payment.paymentDate,
        type: 'payment',
        referenceNo: payment.paymentNo,
        description: `دفعة - ${payment.paymentMethod}`,
        debit: 0,
        credit: Number(payment.amount),
        receiptNo: payment.receiptNo,
      });
    }

    // ترتيب حسب التاريخ
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // حساب الرصيد المتراكم
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map((t) => {
      runningBalance += t.debit - t.credit;
      return {
        ...t,
        balance: runningBalance,
      };
    });

    // حساب الإجماليات
    const totals = {
      totalInvoiced: invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
      totalPaid: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      totalConsumption: invoices.reduce((sum, i) => sum + Number(i.consumption), 0),
      invoiceCount: invoices.length,
      paymentCount: payments.length,
      currentBalance: runningBalance,
    };

    // حساب متوسط الاستهلاك
    const avgConsumption = invoices.length > 0
      ? Math.round(totals.totalConsumption / invoices.length)
      : 0;

    return {
      customer: {
        id: customer.id,
        accountNo: customer.accountNo,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        category: customer.category?.name,
        status: customer.status,
      },
      period: {
        from: fromDate || 'البداية',
        to: toDate || 'الآن',
      },
      transactions: transactionsWithBalance,
      totals,
      statistics: {
        avgConsumption,
        avgMonthlyBill: invoices.length > 0 ? Math.round(totals.totalInvoiced / invoices.length) : 0,
        collectionRate: totals.totalInvoiced > 0
          ? Math.round((totals.totalPaid / totals.totalInvoiced) * 100)
          : 0,
      },
    };
  }
}
