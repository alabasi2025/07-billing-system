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
}
