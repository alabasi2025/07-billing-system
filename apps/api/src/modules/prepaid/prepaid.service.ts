import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { CreatePrepaidTokenDto, RechargeAccountDto, VerifyTokenDto, PrepaidFilterDto, TokenStatus } from './dto/prepaid.dto';
import * as crypto from 'crypto';

@Injectable()
export class PrepaidService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  // توليد توكن STS (20 رقم)
  private generateSTSToken(): string {
    // توليد 20 رقم عشوائي (محاكاة لتوكن STS)
    const timestamp = Date.now().toString().slice(-10);
    const random = crypto.randomInt(1000000000, 9999999999).toString();
    return timestamp + random;
  }

  // حساب الوحدات بناءً على المبلغ والتعرفة
  private async calculateUnits(meterId: string, amount: number): Promise<number> {
    const meter = await this.prisma.billMeter.findUnique({
      where: { id: meterId },
      include: {
        meterType: true,
      },
    });

    if (!meter || !meter.customerId) {
      throw new NotFoundException('Meter or customer not found');
    }

    // الحصول على العميل والتصنيف
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: meter.customerId },
      include: {
        category: {
          include: {
            tariffs: {
              where: { isActive: true },
              orderBy: { sliceOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const tariffs = customer.category?.tariffs || [];
    if (tariffs.length === 0) {
      // إذا لم توجد شرائح، استخدم سعر افتراضي
      return Math.floor(amount / 0.05); // 0.05 ريال لكل وحدة افتراضياً
    }

    // حساب الوحدات باستخدام الشريحة الأولى (مبسط)
    const firstTariff = tariffs[0];
    const pricePerUnit = Number(firstTariff.ratePerKwh);
    return Math.floor(amount / pricePerUnit);
  }

  // إنشاء توكن دفع مسبق
  async createToken(dto: CreatePrepaidTokenDto) {
    // التحقق من وجود العداد وأنه من نوع prepaid
    const meter = await this.prisma.billMeter.findUnique({
      where: { id: dto.meterId },
      include: {
        customer: true,
        meterType: true,
      },
    });

    if (!meter) {
      throw new NotFoundException('Meter not found');
    }

    if (meter.meterType?.category !== 'prepaid') {
      throw new BadRequestException('This meter is not a prepaid meter');
    }

    // حساب الوحدات
    const units = await this.calculateUnits(dto.meterId, dto.amount);

    // توليد التوكن
    const token = this.generateSTSToken();
    const tokenNo = await this.sequenceService.getNextNumber('prepaid_token');

    // إنشاء سجل التوكن
    const prepaidToken = await this.prisma.billPrepaidToken.create({
      data: {
        tokenNo,
        token,
        meterId: dto.meterId,
        customerId: meter.customerId!,
        amount: dto.amount,
        units,
        paymentMethod: dto.paymentMethod || 'cash',
        paymentReference: dto.paymentReference,
        status: 'active',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // صالح لمدة 90 يوم
        notes: dto.notes,
      },
      include: {
        meter: {
          select: { id: true, meterNo: true, serialNumber: true },
        },
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    return prepaidToken;
  }

  // التحقق من صلاحية التوكن
  async verifyToken(dto: VerifyTokenDto) {
    const prepaidToken = await this.prisma.billPrepaidToken.findFirst({
      where: {
        token: dto.token,
        ...(dto.meterId && { meterId: dto.meterId }),
      },
      include: {
        meter: {
          select: { id: true, meterNo: true, serialNumber: true },
        },
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    if (!prepaidToken) {
      return { valid: false, message: 'Token not found' };
    }

    if (prepaidToken.status !== 'active') {
      return { valid: false, message: `Token is ${prepaidToken.status}`, token: prepaidToken };
    }

    if (prepaidToken.expiresAt && new Date(prepaidToken.expiresAt) < new Date()) {
      // تحديث حالة التوكن إلى منتهي
      await this.prisma.billPrepaidToken.update({
        where: { id: prepaidToken.id },
        data: { status: 'expired' },
      });
      return { valid: false, message: 'Token has expired', token: prepaidToken };
    }

    return { valid: true, message: 'Token is valid', token: prepaidToken };
  }

  // استخدام التوكن (عند إدخاله في العداد)
  async useToken(tokenId: string) {
    const prepaidToken = await this.prisma.billPrepaidToken.findUnique({
      where: { id: tokenId },
    });

    if (!prepaidToken) {
      throw new NotFoundException('Token not found');
    }

    if (prepaidToken.status !== 'active') {
      throw new BadRequestException(`Token is already ${prepaidToken.status}`);
    }

    // تحديث حالة التوكن
    const updatedToken = await this.prisma.billPrepaidToken.update({
      where: { id: tokenId },
      data: {
        status: 'used',
        usedAt: new Date(),
      },
      include: {
        meter: {
          select: { id: true, meterNo: true, serialNumber: true },
        },
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    return updatedToken;
  }

  // إلغاء التوكن
  async cancelToken(tokenId: string, reason?: string) {
    const prepaidToken = await this.prisma.billPrepaidToken.findUnique({
      where: { id: tokenId },
    });

    if (!prepaidToken) {
      throw new NotFoundException('Token not found');
    }

    if (prepaidToken.status !== 'active') {
      throw new BadRequestException(`Cannot cancel token with status ${prepaidToken.status}`);
    }

    const updatedToken = await this.prisma.billPrepaidToken.update({
      where: { id: tokenId },
      data: {
        status: 'cancelled',
        notes: reason ? `${prepaidToken.notes || ''}\nCancelled: ${reason}` : prepaidToken.notes,
      },
      include: {
        meter: {
          select: { id: true, meterNo: true, serialNumber: true },
        },
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    return updatedToken;
  }

  // الحصول على قائمة التوكنات
  async findAll(filter: PrepaidFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.meterId) where.meterId = filter.meterId;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.status) where.status = filter.status;
    if (filter.fromDate || filter.toDate) {
      where.createdAt = {};
      if (filter.fromDate) where.createdAt.gte = new Date(filter.fromDate);
      if (filter.toDate) where.createdAt.lte = new Date(filter.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.billPrepaidToken.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          meter: {
            select: { id: true, meterNo: true, serialNumber: true },
          },
          customer: {
            select: { id: true, accountNo: true, name: true },
          },
        },
      }),
      this.prisma.billPrepaidToken.count({ where }),
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

  // الحصول على توكن بالمعرف
  async findOne(id: string) {
    const token = await this.prisma.billPrepaidToken.findUnique({
      where: { id },
      include: {
        meter: {
          select: { id: true, meterNo: true, serialNumber: true },
        },
        customer: {
          select: { id: true, accountNo: true, name: true },
        },
      },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    return token;
  }

  // الحصول على رصيد العميل من التوكنات
  async getCustomerBalance(customerId: string) {
    const activeTokens = await this.prisma.billPrepaidToken.findMany({
      where: {
        customerId,
        status: 'active',
      },
    });

    const totalActiveAmount = activeTokens.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalActiveUnits = activeTokens.reduce((sum, t) => sum + t.units, 0);

    const usedTokens = await this.prisma.billPrepaidToken.findMany({
      where: {
        customerId,
        status: 'used',
      },
    });

    const totalUsedAmount = usedTokens.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalUsedUnits = usedTokens.reduce((sum, t) => sum + t.units, 0);

    return {
      activeTokens: activeTokens.length,
      activeAmount: totalActiveAmount,
      activeUnits: totalActiveUnits,
      usedTokens: usedTokens.length,
      usedAmount: totalUsedAmount,
      usedUnits: totalUsedUnits,
    };
  }

  // إحصائيات الدفع المسبق
  async getStatistics() {
    const [total, byStatus, totalAmount] = await Promise.all([
      this.prisma.billPrepaidToken.count(),
      this.prisma.billPrepaidToken.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.billPrepaidToken.aggregate({
        _sum: { amount: true },
        where: { status: 'used' },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    return {
      total,
      byStatus: statusCounts,
      totalRevenueFromPrepaid: totalAmount._sum.amount || 0,
    };
  }
}
