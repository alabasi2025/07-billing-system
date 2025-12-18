import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStatus,
  CustomerFilterDto,
  ChangeCustomerStatusDto,
} from './dto/customer.dto';
import { SequenceService } from '../../common/utils/sequence.service';
import { Prisma } from '../../../../../generated/prisma';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  // إنشاء عميل جديد
  async create(dto: CreateCustomerDto) {
    // التحقق من وجود التصنيف
    const category = await this.prisma.billCustomerCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('تصنيف العميل غير موجود');
    }

    // التحقق من عدم تكرار رقم الهوية
    const existingCustomer = await this.prisma.billCustomer.findFirst({
      where: {
        idNumber: dto.idNumber,
        idType: dto.idType,
      },
    });

    if (existingCustomer) {
      throw new ConflictException('يوجد عميل مسجل بنفس رقم الهوية');
    }

    // توليد رقم الحساب
    const accountNo = await this.sequenceService.getNextNumber('customer');

    // إنشاء العميل
    const customer = await this.prisma.billCustomer.create({
      data: {
        accountNo,
        name: dto.name,
        nameEn: dto.nameEn,
        categoryId: dto.categoryId,
        idType: dto.idType,
        idNumber: dto.idNumber,
        idCardImage: dto.idCardImage,
        taxNumber: dto.taxNumber,
        phone: dto.phone,
        mobile: dto.mobile,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        district: dto.district,
        building: dto.building,
        floor: dto.floor,
        latitude: dto.latitude ? dto.latitude : null,
        longitude: dto.longitude ? dto.longitude : null,
        stationId: dto.stationId,
        transformerId: dto.transformerId,
        creditLimit: dto.creditLimit ?? 0,
        paymentTerms: dto.paymentTerms ?? 'postpaid',
        billingCycle: dto.billingCycle ?? 'monthly',
        accountId: dto.accountId,
        connectionDate: dto.connectionDate ? new Date(dto.connectionDate) : null,
        isSubsidized: dto.isSubsidized ?? false,
        subsidyProgramId: dto.subsidyProgramId,
        subsidyReferenceNo: dto.subsidyReferenceNo,
        subsidyStartDate: dto.subsidyStartDate ? new Date(dto.subsidyStartDate) : null,
        subsidyEndDate: dto.subsidyEndDate ? new Date(dto.subsidyEndDate) : null,
        contactPerson: dto.contactPerson,
        contactPhone: dto.contactPhone,
        notes: dto.notes,
        status: 'active',
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

    // تسجيل في سجل التدقيق
    await this.createAuditLog('bill_customers', customer.id, 'create', null, customer);

    return customer;
  }

  // جلب جميع العملاء مع الفلترة والترقيم
  async findAll(params: CustomerFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      status,
      paymentTerms,
      city,
      district,
      isSubsidized,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BillCustomerWhereInput = {};

    if (search) {
      where.OR = [
        { accountNo: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentTerms) {
      where.paymentTerms = paymentTerms;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (district) {
      where.district = { contains: district, mode: 'insensitive' };
    }

    if (isSubsidized !== undefined) {
      where.isSubsidized = isSubsidized;
    }

    const [data, total] = await Promise.all([
      this.prisma.billCustomer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              meters: true,
              invoices: true,
              payments: true,
              addresses: true,
              contacts: true,
              components: true,
            },
          },
        },
      }),
      this.prisma.billCustomer.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // جلب عميل واحد بالمعرف
  async findOne(id: string) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            nameEn: true,
          },
        },
        addresses: true,
        contacts: true,
        components: true,
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        meters: {
          include: {
            meterType: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            contracts: true,
            meters: true,
            invoices: true,
            payments: true,
            complaints: true,
            addresses: true,
            contacts: true,
            components: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    return customer;
  }

  // جلب عميل برقم الحساب
  async findByAccountNo(accountNo: string) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { accountNo },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        meters: {
          include: {
            meterType: true,
          },
        },
        _count: {
          select: {
            contracts: true,
            meters: true,
            invoices: true,
            payments: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    return customer;
  }

  // تحديث عميل
  async update(id: string, dto: UpdateCustomerDto) {
    const existingCustomer = await this.findOne(id);

    // التحقق من التصنيف إذا تم تغييره
    if (dto.categoryId && dto.categoryId !== existingCustomer.categoryId) {
      const category = await this.prisma.billCustomerCategory.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('تصنيف العميل غير موجود');
      }
    }

    // التحقق من عدم تكرار رقم الهوية
    if (dto.idNumber && dto.idNumber !== existingCustomer.idNumber) {
      const duplicateCustomer = await this.prisma.billCustomer.findFirst({
        where: {
          idNumber: dto.idNumber,
          idType: dto.idType || existingCustomer.idType,
          id: { not: id },
        },
      });

      if (duplicateCustomer) {
        throw new ConflictException('يوجد عميل آخر مسجل بنفس رقم الهوية');
      }
    }

    const updateData: any = {};

    // الحقول الأساسية
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.idType !== undefined) updateData.idType = dto.idType;
    if (dto.idNumber !== undefined) updateData.idNumber = dto.idNumber;
    if (dto.idCardImage !== undefined) updateData.idCardImage = dto.idCardImage;
    if (dto.taxNumber !== undefined) updateData.taxNumber = dto.taxNumber;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.mobile !== undefined) updateData.mobile = dto.mobile;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.district !== undefined) updateData.district = dto.district;
    if (dto.building !== undefined) updateData.building = dto.building;
    if (dto.floor !== undefined) updateData.floor = dto.floor;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.stationId !== undefined) updateData.stationId = dto.stationId;
    if (dto.transformerId !== undefined) updateData.transformerId = dto.transformerId;
    if (dto.creditLimit !== undefined) updateData.creditLimit = dto.creditLimit;
    if (dto.paymentTerms !== undefined) updateData.paymentTerms = dto.paymentTerms;
    if (dto.billingCycle !== undefined) updateData.billingCycle = dto.billingCycle;
    if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.suspensionReason !== undefined) updateData.suspensionReason = dto.suspensionReason;
    if (dto.disconnectionDate !== undefined) updateData.disconnectionDate = new Date(dto.disconnectionDate);
    if (dto.connectionDate !== undefined) updateData.connectionDate = new Date(dto.connectionDate);

    // حقول الدعم الحكومي
    if (dto.isSubsidized !== undefined) updateData.isSubsidized = dto.isSubsidized;
    if (dto.subsidyProgramId !== undefined) updateData.subsidyProgramId = dto.subsidyProgramId;
    if (dto.subsidyReferenceNo !== undefined) updateData.subsidyReferenceNo = dto.subsidyReferenceNo;
    if (dto.subsidyStartDate !== undefined) updateData.subsidyStartDate = new Date(dto.subsidyStartDate);
    if (dto.subsidyEndDate !== undefined) updateData.subsidyEndDate = new Date(dto.subsidyEndDate);

    // جهة الاتصال
    if (dto.contactPerson !== undefined) updateData.contactPerson = dto.contactPerson;
    if (dto.contactPhone !== undefined) updateData.contactPhone = dto.contactPhone;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updatedCustomer = await this.prisma.billCustomer.update({
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

    // تسجيل في سجل التدقيق
    await this.createAuditLog('bill_customers', id, 'update', existingCustomer, updatedCustomer);

    return updatedCustomer;
  }

  // تغيير حالة العميل
  async changeStatus(id: string, changeStatusDto: ChangeCustomerStatusDto) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    // التحقق من صحة تغيير الحالة
    const validTransitions: Record<string, string[]> = {
      active: ['inactive', 'suspended', 'disconnected', 'closed'],
      inactive: ['active', 'closed'],
      suspended: ['active', 'disconnected', 'closed'],
      disconnected: ['active', 'suspended', 'closed'],
      closed: [], // لا يمكن تغيير حالة العميل المغلق
    };

    if (!validTransitions[customer.status]?.includes(changeStatusDto.status)) {
      throw new BadRequestException(
        `لا يمكن تغيير حالة العميل من "${customer.status}" إلى "${changeStatusDto.status}"`,
      );
    }

    const updateData: any = {
      status: changeStatusDto.status,
    };

    if (changeStatusDto.status === CustomerStatus.SUSPENDED) {
      updateData.suspensionReason = changeStatusDto.reason;
    }

    if (changeStatusDto.status === CustomerStatus.DISCONNECTED) {
      updateData.disconnectionDate = new Date();
      updateData.suspensionReason = changeStatusDto.reason;
    }

    const updatedCustomer = await this.prisma.billCustomer.update({
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

    // تسجيل في سجل التدقيق
    await this.createAuditLog('bill_customers', id, 'update', customer, updatedCustomer);

    return updatedCustomer;
  }

  // إيقاف عميل
  async suspend(id: string, reason?: string) {
    return this.changeStatus(id, {
      status: CustomerStatus.SUSPENDED,
      reason,
    });
  }

  // تفعيل عميل
  async activate(id: string) {
    return this.changeStatus(id, {
      status: CustomerStatus.ACTIVE,
    });
  }

  // حذف عميل (Soft Delete)
  async remove(id: string) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoices: true,
            payments: true,
            contracts: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    // التحقق من عدم وجود فواتير أو مدفوعات
    if (customer._count.invoices > 0 || customer._count.payments > 0) {
      throw new BadRequestException(
        'لا يمكن حذف العميل لوجود فواتير أو مدفوعات مرتبطة به. يمكنك إغلاق الحساب بدلاً من ذلك.',
      );
    }

    // تغيير الحالة إلى مغلق بدلاً من الحذف الفعلي
    const closedCustomer = await this.prisma.billCustomer.update({
      where: { id },
      data: {
        status: 'closed',
        suspensionReason: 'تم إغلاق الحساب',
      },
    });

    // تسجيل في سجل التدقيق
    await this.createAuditLog('bill_customers', id, 'delete', customer, closedCustomer);

    return { message: 'تم إغلاق حساب العميل بنجاح' };
  }

  // جلب فواتير العميل
  async getCustomerInvoices(id: string, params: { page?: number; limit?: number }) {
    await this.findOne(id);

    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.billInvoice.findMany({
        where: { customerId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billInvoice.count({ where: { customerId: id } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // جلب مدفوعات العميل
  async getCustomerPayments(id: string, params: { page?: number; limit?: number }) {
    await this.findOne(id);

    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.billPayment.findMany({
        where: { customerId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billPayment.count({ where: { customerId: id } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // جلب رصيد العميل
  async getCustomerBalance(id: string) {
    const customer = await this.findOne(id);

    // إجمالي الفواتير
    const invoicesResult = await this.prisma.billInvoice.aggregate({
      where: {
        customerId: id,
        status: { notIn: ['cancelled', 'draft'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // إجمالي المدفوعات
    const paymentsResult = await this.prisma.billPayment.aggregate({
      where: {
        customerId: id,
        status: 'confirmed',
      },
      _sum: {
        amount: true,
      },
    });

    const totalInvoiced = Number(invoicesResult._sum.totalAmount ?? 0);
    const totalPaid = Number(paymentsResult._sum.amount ?? 0);
    const balance = totalInvoiced - totalPaid;

    return {
      customerId: id,
      accountNo: customer.accountNo,
      totalInvoiced,
      totalPaid,
      balance,
      creditLimit: Number(customer.creditLimit),
      availableCredit: Number(customer.creditLimit) - balance,
    };
  }

  // جلب إحصائيات العملاء
  async getStatistics() {
    const [
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      disconnectedCustomers,
      closedCustomers,
      subsidizedCustomers,
      customersByCategory,
      customersByCity,
      recentCustomers,
    ] = await Promise.all([
      this.prisma.billCustomer.count(),
      this.prisma.billCustomer.count({ where: { status: 'active' } }),
      this.prisma.billCustomer.count({ where: { status: 'suspended' } }),
      this.prisma.billCustomer.count({ where: { status: 'disconnected' } }),
      this.prisma.billCustomer.count({ where: { status: 'closed' } }),
      this.prisma.billCustomer.count({ where: { isSubsidized: true } }),
      this.prisma.billCustomer.groupBy({
        by: ['categoryId'],
        _count: { id: true },
      }),
      this.prisma.billCustomer.groupBy({
        by: ['city'],
        _count: { id: true },
        where: { city: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.billCustomer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          accountNo: true,
          name: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // جلب أسماء التصنيفات
    const categories = await this.prisma.billCustomerCategory.findMany({
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      total: totalCustomers,
      byStatus: {
        active: activeCustomers,
        suspended: suspendedCustomers,
        disconnected: disconnectedCustomers,
        closed: closedCustomers,
      },
      subsidized: subsidizedCustomers,
      byCategory: customersByCategory.map((c) => ({
        categoryId: c.categoryId,
        categoryName: categoryMap.get(c.categoryId) || 'غير معروف',
        count: c._count.id,
      })),
      byCity: customersByCity.map((c) => ({
        city: c.city || 'غير محدد',
        count: c._count.id,
      })),
      recentCustomers,
    };
  }

  // تسجيل في سجل التدقيق
  private async createAuditLog(
    tableName: string,
    recordId: string,
    action: string,
    oldData: any,
    newData: any,
  ) {
    try {
      await this.prisma.billAuditLog.create({
        data: {
          tableName,
          recordId,
          action,
          oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
          newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        },
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}
