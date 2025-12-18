import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { CreateServiceRequestDto, UpdateServiceRequestDto, ServiceRequestStatus } from './dto/customer-portal.dto';

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  // الحصول على بيانات العميل
  async getCustomerProfile(customerId: string) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: customerId },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  // الحصول على عدادات العميل
  async getCustomerMeters(customerId: string) {
    const meters = await this.prisma.billMeter.findMany({
      where: { customerId },
      include: {
        meterType: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return meters;
  }

  // الحصول على فواتير العميل
  async getCustomerInvoices(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.billInvoice.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.billInvoice.count({ where: { customerId } }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // الحصول على مدفوعات العميل
  async getCustomerPayments(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.billPayment.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            select: { id: true, invoiceNo: true },
          },
        },
      }),
      this.prisma.billPayment.count({ where: { customerId } }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // الحصول على رصيد العميل
  async getCustomerBalance(customerId: string) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // حساب إجمالي الفواتير غير المدفوعة
    const unpaidInvoices = await this.prisma.billInvoice.aggregate({
      where: {
        customerId,
        status: { in: ['issued', 'partially_paid', 'overdue'] },
      },
      _sum: { balance: true },
      _count: true,
    });

    // حساب الفواتير المتأخرة
    const overdueInvoices = await this.prisma.billInvoice.aggregate({
      where: {
        customerId,
        status: 'overdue',
      },
      _sum: { balance: true },
      _count: true,
    });

    return {
      currentBalance: 0,
      unpaidInvoicesCount: unpaidInvoices._count,
      unpaidAmount: Number(unpaidInvoices._sum.balance) || 0,
      overdueInvoicesCount: overdueInvoices._count,
      overdueAmount: Number(overdueInvoices._sum.balance) || 0,
    };
  }

  // الحصول على بيانات الاستهلاك
  async getConsumptionHistory(customerId: string, meterId?: string, months = 12) {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);

    const where: any = {
      meter: { customerId },
      readingDate: { gte: fromDate },
    };

    if (meterId) {
      where.meterId = meterId;
    }

    const readings = await this.prisma.billMeterReading.findMany({
      where,
      orderBy: { readingDate: 'asc' },
      include: {
        meter: {
          select: { id: true, meterNo: true },
        },
      },
    });

    // تجميع البيانات حسب الشهر
    const monthlyData: Record<string, { month: string; consumption: number; amount: number }> = {};

    readings.forEach((reading) => {
      const month = reading.readingDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { month, consumption: 0, amount: 0 };
      }
      monthlyData[month].consumption += Number(reading.consumption) || 0;
    });

    return Object.values(monthlyData);
  }

  // إنشاء طلب خدمة
  async createServiceRequest(dto: CreateServiceRequestDto) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const requestNo = await this.sequenceService.getNextNumber('service_request');

    const serviceRequest = await this.prisma.billServiceRequest.create({
      data: {
        requestNo,
        customerId: dto.customerId,
        requestType: dto.requestType,
        description: dto.description,
        attachments: dto.attachments,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        status: 'pending',
        notes: dto.notes,
      },
      include: {
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    return serviceRequest;
  }

  // الحصول على طلبات الخدمة للعميل
  async getCustomerServiceRequests(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.billServiceRequest.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billServiceRequest.count({ where: { customerId } }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // الحصول على طلب خدمة بالمعرف
  async getServiceRequest(id: string) {
    const request = await this.prisma.billServiceRequest.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    return request;
  }

  // تحديث طلب الخدمة
  async updateServiceRequest(id: string, dto: UpdateServiceRequestDto) {
    const request = await this.prisma.billServiceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    const updatedRequest = await this.prisma.billServiceRequest.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.assignedTo && { assignedTo: dto.assignedTo }),
        ...(dto.resolution && { resolution: dto.resolution }),
        ...(dto.notes && { notes: dto.notes }),
        ...(dto.status === 'completed' && { completedAt: new Date() }),
      },
      include: {
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    return updatedRequest;
  }

  // إلغاء طلب الخدمة
  async cancelServiceRequest(id: string, reason?: string) {
    const request = await this.prisma.billServiceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Can only cancel pending requests');
    }

    const updatedRequest = await this.prisma.billServiceRequest.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: reason ? `${request.notes || ''}\nCancelled: ${reason}` : request.notes,
      },
    });

    return updatedRequest;
  }

  // الحصول على شكاوى العميل
  async getCustomerComplaints(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      this.prisma.billComplaint.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billComplaint.count({ where: { customerId } }),
    ]);

    return {
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // إحصائيات طلبات الخدمة
  async getServiceRequestsStatistics() {
    const [total, byStatus, byType] = await Promise.all([
      this.prisma.billServiceRequest.count(),
      this.prisma.billServiceRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.billServiceRequest.groupBy({
        by: ['requestType'],
        _count: { requestType: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    const typeCounts: Record<string, number> = {};
    byType.forEach((t) => {
      typeCounts[t.requestType] = t._count.requestType;
    });

    return {
      total,
      byStatus: statusCounts,
      byType: typeCounts,
    };
  }
}
