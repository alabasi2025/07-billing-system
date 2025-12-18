import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { CreateDisconnectionOrderDto, ExecuteOrderDto, CancelOrderDto, OrderType, OrderStatus, DisconnectionReason } from './dto/disconnection.dto';

@Injectable()
export class DisconnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  async create(dto: CreateDisconnectionOrderDto) {
    // Verify customer exists
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
      include: {
        invoices: {
          where: {
            status: { in: ['issued', 'partial', 'overdue'] },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // Check for pending orders
    const pendingOrder = await this.prisma.billDisconnectionOrder.findFirst({
      where: {
        customerId: dto.customerId,
        status: { in: [OrderStatus.PENDING, OrderStatus.SCHEDULED] },
      },
    });

    if (pendingOrder) {
      throw new ConflictException('Customer already has a pending disconnection/reconnection order');
    }

    // Calculate outstanding amount for non-payment disconnection
    let outstandingAmount: number | undefined;
    if (dto.reason === DisconnectionReason.NON_PAYMENT) {
      outstandingAmount = customer.invoices.reduce(
        (sum, inv) => sum + Number(inv.balance),
        0
      );
    }

    // Generate order number
    const orderNo = await this.sequenceService.getNextNumber('disconnection_order');

    // Create order
    const order = await this.prisma.billDisconnectionOrder.create({
      data: {
        orderNo,
        customerId: dto.customerId,
        meterId: dto.meterId,
        orderType: dto.orderType,
        reason: dto.reason,
        reasonDetails: dto.reasonDetails,
        outstandingAmount,
        scheduledDate: new Date(dto.scheduledDate),
        status: OrderStatus.SCHEDULED,
        reconnectionFee: dto.reconnectionFee,
        notes: dto.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        meter: {
          select: {
            id: true,
            meterNo: true,
          },
        },
      },
    });

    return order;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    orderType?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const { page = 1, limit = 10, customerId, orderType, status, fromDate, toDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) {
        where.scheduledDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.scheduledDate.lte = new Date(toDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.billDisconnectionOrder.findMany({
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
          meter: {
            select: {
              id: true,
              meterNo: true,
            },
          },
        },
      }),
      this.prisma.billDisconnectionOrder.count({ where }),
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
    const order = await this.prisma.billDisconnectionOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            phone: true,
            address: true,
            status: true,
          },
        },
        meter: {
          select: {
            id: true,
            meterNo: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Disconnection order with ID ${id} not found`);
    }

    return order;
  }

  async execute(id: string, dto: ExecuteOrderDto) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.EXECUTED) {
      throw new ConflictException('Order is already executed');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot execute a cancelled order');
    }

    // Update order status
    const updatedOrder = await this.prisma.billDisconnectionOrder.update({
      where: { id },
      data: {
        status: OrderStatus.EXECUTED,
        executedDate: new Date(),
        executedBy: dto.executedBy,
        notes: dto.notes ? `${order.notes || ''}\n${dto.notes}` : order.notes,
      },
    });

    // Update customer status based on order type
    const customerStatus = order.orderType === OrderType.DISCONNECTION ? 'disconnected' : 'active';
    const customerUpdate: any = {
      status: customerStatus,
    };

    if (order.orderType === OrderType.DISCONNECTION) {
      customerUpdate.disconnectionDate = new Date();
    } else {
      customerUpdate.connectionDate = new Date();
      customerUpdate.disconnectionDate = null;
    }

    await this.prisma.billCustomer.update({
      where: { id: order.customerId },
      data: customerUpdate,
    });

    return this.findOne(id);
  }

  async cancel(id: string, dto: CancelOrderDto) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.EXECUTED) {
      throw new BadRequestException('Cannot cancel an executed order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException('Order is already cancelled');
    }

    return this.prisma.billDisconnectionOrder.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelReason: dto.reason,
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
      },
    });
  }

  async getStatistics() {
    const [total, byType, byStatus] = await Promise.all([
      this.prisma.billDisconnectionOrder.count(),
      this.prisma.billDisconnectionOrder.groupBy({
        by: ['orderType'],
        _count: { id: true },
      }),
      this.prisma.billDisconnectionOrder.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const typeMap: Record<string, number> = {};
    byType.forEach((item) => {
      typeMap[item.orderType] = item._count.id;
    });

    const statusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    return {
      total,
      byType: typeMap,
      byStatus: statusMap,
    };
  }

  async getCustomersForDisconnection(minOverdueDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - minOverdueDays);

    const customers = await this.prisma.billCustomer.findMany({
      where: {
        status: 'active',
        invoices: {
          some: {
            status: 'overdue',
            dueDate: { lt: cutoffDate },
          },
        },
      },
      include: {
        invoices: {
          where: {
            status: { in: ['issued', 'partial', 'overdue'] },
          },
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            balance: true,
            dueDate: true,
            status: true,
          },
        },
      },
    });

    return customers.map((customer) => ({
      ...customer,
      totalOutstanding: customer.invoices.reduce(
        (sum, inv) => sum + Number(inv.balance),
        0
      ),
      oldestOverdueDate: customer.invoices
        .filter((inv) => inv.status === 'overdue')
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate,
    }));
  }
}
