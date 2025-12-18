import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerStatus } from './dto/customer.dto';
import { SequenceService } from '../../common/utils/sequence.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  async create(dto: CreateCustomerDto) {
    // Verify category exists
    const category = await this.prisma.billCustomerCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Customer category with ID ${dto.categoryId} not found`);
    }

    // Generate account number
    const accountNo = await this.sequenceService.getNextNumber('customer');

    return this.prisma.billCustomer.create({
      data: {
        accountNo,
        name: dto.name,
        nameEn: dto.nameEn,
        categoryId: dto.categoryId,
        idType: dto.idType,
        idNumber: dto.idNumber,
        phone: dto.phone,
        mobile: dto.mobile,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        district: dto.district,
        latitude: dto.latitude ? dto.latitude : null,
        longitude: dto.longitude ? dto.longitude : null,
        stationId: dto.stationId,
        transformerId: dto.transformerId,
        creditLimit: dto.creditLimit ?? 0,
        paymentTerms: dto.paymentTerms ?? 'postpaid',
        billingCycle: dto.billingCycle ?? 'monthly',
        connectionDate: dto.connectionDate ? new Date(dto.connectionDate) : null,
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
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, search, categoryId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

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

    const [data, total] = await Promise.all([
      this.prisma.billCustomer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  async findOne(id: string) {
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        meters: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            contracts: true,
            meters: true,
            invoices: true,
            payments: true,
            complaints: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

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
      throw new NotFoundException(`Customer with account number ${accountNo} not found`);
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.idType !== undefined) updateData.idType = dto.idType;
    if (dto.idNumber !== undefined) updateData.idNumber = dto.idNumber;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.mobile !== undefined) updateData.mobile = dto.mobile;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.district !== undefined) updateData.district = dto.district;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.stationId !== undefined) updateData.stationId = dto.stationId;
    if (dto.transformerId !== undefined) updateData.transformerId = dto.transformerId;
    if (dto.creditLimit !== undefined) updateData.creditLimit = dto.creditLimit;
    if (dto.paymentTerms !== undefined) updateData.paymentTerms = dto.paymentTerms;
    if (dto.billingCycle !== undefined) updateData.billingCycle = dto.billingCycle;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.connectionDate !== undefined) updateData.connectionDate = new Date(dto.connectionDate);

    return this.prisma.billCustomer.update({
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
  }

  async suspend(id: string, reason?: string) {
    const customer = await this.findOne(id);

    if (customer.status === CustomerStatus.SUSPENDED) {
      throw new ConflictException('Customer is already suspended');
    }

    return this.prisma.billCustomer.update({
      where: { id },
      data: {
        status: CustomerStatus.SUSPENDED,
      },
    });
  }

  async activate(id: string) {
    const customer = await this.findOne(id);

    if (customer.status === CustomerStatus.ACTIVE) {
      throw new ConflictException('Customer is already active');
    }

    return this.prisma.billCustomer.update({
      where: { id },
      data: {
        status: CustomerStatus.ACTIVE,
      },
    });
  }

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

  async getCustomerBalance(id: string) {
    const customer = await this.findOne(id);

    // Get total invoiced amount
    const invoicesResult = await this.prisma.billInvoice.aggregate({
      where: {
        customerId: id,
        status: { notIn: ['cancelled', 'draft'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get total paid amount
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
}
