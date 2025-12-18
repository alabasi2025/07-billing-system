import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import {
  CreateSubscriptionRequestDto,
  UpdateSubscriptionRequestDto,
  ApproveRequestDto,
  RejectRequestDto,
  AssignTechnicianDto,
  RecordPaymentDto,
  CompleteInstallationDto,
  SubscriptionRequestFilterDto,
  RequestStatus,
  PaymentStatus,
} from './dto/subscription-request.dto';

@Injectable()
export class SubscriptionRequestsService {
  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
  ) {}

  async create(dto: CreateSubscriptionRequestDto) {
    const requestNo = await this.sequenceService.getNextNumber('subscription_request');

    const request = await this.prisma.billSubscriptionRequest.create({
      data: {
        requestNo,
        customerName: dto.customerName,
        customerType: dto.customerType,
        idType: dto.idType,
        idNumber: dto.idNumber,
        phone: dto.phone,
        mobile: dto.mobile,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        district: dto.district,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
        status: RequestStatus.PENDING_REVIEW,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    return request;
  }

  async findAll(filter: SubscriptionRequestFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.paymentStatus) {
      where.paymentStatus = filter.paymentStatus;
    }

    if (filter.customerType) {
      where.customerType = filter.customerType;
    }

    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    if (filter.fromDate || filter.toDate) {
      where.requestDate = {};
      if (filter.fromDate) {
        where.requestDate.gte = new Date(filter.fromDate);
      }
      if (filter.toDate) {
        where.requestDate.lte = new Date(filter.toDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.billSubscriptionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billSubscriptionRequest.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.billSubscriptionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('طلب الاشتراك غير موجود');
    }

    return request;
  }

  async update(id: string, dto: UpdateSubscriptionRequestDto) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING_REVIEW) {
      throw new BadRequestException('لا يمكن تعديل الطلب في هذه الحالة');
    }

    return this.prisma.billSubscriptionRequest.update({
      where: { id },
      data: dto as any,
    });
  }

  async approve(id: string, dto: ApproveRequestDto, approvedBy: string) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING_REVIEW) {
      throw new BadRequestException('الطلب ليس في حالة انتظار المراجعة');
    }

    const totalAmount = (dto.subscriptionFee || 0) + (dto.connectionFee || 0) + (dto.depositAmount || 0);

    return this.prisma.billSubscriptionRequest.update({
      where: { id },
      data: {
        subscriptionFee: dto.subscriptionFee,
        connectionFee: dto.connectionFee,
        depositAmount: dto.depositAmount || 0,
        totalAmount,
        status: RequestStatus.PENDING_PAYMENT,
        approvalDate: new Date(),
        approvedBy,
        notes: dto.notes ? `${request.notes || ''}\n[موافقة]: ${dto.notes}` : request.notes,
      },
    });
  }

  async reject(id: string, dto: RejectRequestDto) {
    const request = await this.findOne(id);

    if (request.status === RequestStatus.COMPLETED || request.status === RequestStatus.CANCELLED) {
      throw new BadRequestException('لا يمكن رفض هذا الطلب');
    }

    return this.prisma.billSubscriptionRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
      },
    });
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING_PAYMENT && request.status !== RequestStatus.APPROVED) {
      throw new BadRequestException('الطلب ليس في حالة انتظار الدفع');
    }

    const totalAmount = Number(request.totalAmount) || 0;
    const currentPaid = Number(request.paidAmount) || 0;
    const newPaidAmount = currentPaid + dto.amount;

    let paymentStatus: PaymentStatus;
    let newStatus = request.status;

    if (newPaidAmount >= totalAmount) {
      paymentStatus = PaymentStatus.PAID;
      newStatus = RequestStatus.PAYMENT_RECEIVED;
    } else if (newPaidAmount > 0) {
      paymentStatus = PaymentStatus.PARTIAL;
    } else {
      paymentStatus = PaymentStatus.PENDING;
    }

    return this.prisma.billSubscriptionRequest.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
        paymentDate: new Date(),
        paymentReference: dto.paymentReference,
        status: newStatus,
        notes: dto.notes ? `${request.notes || ''}\n[دفعة]: ${dto.notes}` : request.notes,
      },
    });
  }

  async assignTechnician(id: string, dto: AssignTechnicianDto) {
    const request = await this.findOne(id);

    if (request.paymentStatus !== 'paid') {
      throw new BadRequestException('يجب دفع الرسوم كاملة قبل تعيين فني');
    }

    return this.prisma.billSubscriptionRequest.update({
      where: { id },
      data: {
        assignedTechnician: dto.technicianId,
        installationDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        meterSerialNumber: dto.meterSerialNumber,
        status: RequestStatus.ASSIGNED,
      },
    });
  }

  async startInstallation(id: string) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.ASSIGNED) {
      throw new BadRequestException('الطلب ليس في حالة تم التعيين');
    }

    return this.prisma.billSubscriptionRequest.update({
      where: { id },
      data: {
        status: RequestStatus.IN_PROGRESS,
      },
    });
  }

  async completeInstallation(id: string, dto: CompleteInstallationDto) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.IN_PROGRESS && request.status !== RequestStatus.ASSIGNED) {
      throw new BadRequestException('الطلب ليس في حالة قيد التنفيذ');
    }

    // إنشاء العميل والعداد في معاملة واحدة
    const result = await this.prisma.$transaction(async (tx) => {
      // الحصول على تصنيف العميل
      const categoryMap: Record<string, string> = {
        residential: 'RES',
        commercial: 'COM',
        industrial: 'IND',
        agricultural: 'AGR',
        governmental: 'GOV',
      };

      const categoryCode = categoryMap[request.customerType] || 'RES';
      const category = await tx.billCustomerCategory.findFirst({
        where: { code: categoryCode },
      });

      if (!category) {
        throw new BadRequestException('تصنيف العميل غير موجود');
      }

      // إنشاء رقم حساب العميل
      const accountNo = await this.sequenceService.getNextNumber('customer');

      // إنشاء العميل
      const customer = await tx.billCustomer.create({
        data: {
          accountNo,
          name: request.customerName,
          categoryId: category.id,
          idType: request.idType || 'national_id',
          idNumber: request.idNumber || '',
          phone: request.phone || request.mobile,
          mobile: request.mobile,
          email: request.email,
          address: request.address || '',
          city: request.city,
          district: request.district,
          latitude: request.latitude,
          longitude: request.longitude,
          status: 'active',
          connectionDate: new Date(),
        },
      });

      // الحصول على نوع العداد الافتراضي
      const meterType = await tx.billMeterType.findFirst({
        where: { isActive: true },
      });

      if (!meterType) {
        throw new BadRequestException('لا يوجد نوع عداد متاح');
      }

      // إنشاء العداد
      const meter = await tx.billMeter.create({
        data: {
          meterNo: dto.meterSerialNumber,
          customerId: customer.id,
          meterTypeId: meterType.id,
          serialNumber: dto.meterSerialNumber,
          installDate: new Date(),
          lastReading: dto.initialReading,
          lastReadDate: new Date(),
          status: 'active',
          notes: dto.notes,
        },
      });

      // تسجيل القراءة الأولية
      const billingPeriod = new Date().toISOString().slice(0, 7);
      await tx.billMeterReading.create({
        data: {
          meterId: meter.id,
          readingDate: new Date(),
          reading: dto.initialReading,
          previousReading: 0,
          consumption: 0,
          readingType: 'initial',
          billingPeriod,
          isProcessed: false,
        },
      });

      // تحديث طلب الاشتراك
      const updatedRequest = await tx.billSubscriptionRequest.update({
        where: { id },
        data: {
          status: RequestStatus.COMPLETED,
          customerId: customer.id,
          meterSerialNumber: dto.meterSerialNumber,
          completionDate: new Date(),
        },
      });

      return {
        request: updatedRequest,
        customer,
        meter,
      };
    });

    return result;
  }

  async cancel(id: string, reason: string) {
    const request = await this.findOne(id);

    if (request.status === RequestStatus.COMPLETED) {
      throw new BadRequestException('لا يمكن إلغاء طلب مكتمل');
    }

    return this.prisma.billSubscriptionRequest.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
        notes: `${request.notes || ''}\n[إلغاء]: ${reason}`,
      },
    });
  }

  async getStatistics() {
    const [total, byStatus, byPaymentStatus, byCustomerType] = await Promise.all([
      this.prisma.billSubscriptionRequest.count(),
      this.prisma.billSubscriptionRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.billSubscriptionRequest.groupBy({
        by: ['paymentStatus'],
        _count: { paymentStatus: true },
      }),
      this.prisma.billSubscriptionRequest.groupBy({
        by: ['customerType'],
        _count: { customerType: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    const paymentStatusCounts: Record<string, number> = {};
    byPaymentStatus.forEach((s) => {
      paymentStatusCounts[s.paymentStatus] = s._count.paymentStatus;
    });

    return {
      total,
      byStatus: statusCounts,
      byPaymentStatus: paymentStatusCounts,
      byCustomerType: byCustomerType.map((c) => ({
        type: c.customerType,
        count: c._count.customerType,
      })),
    };
  }
}
