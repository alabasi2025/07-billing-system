import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { CreatePaymentDto, CancelPaymentDto, PaymentStatus } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
    private readonly sequenceService: SequenceService,
  ) {}

  async create(dto: CreatePaymentDto) {
    // Verify customer exists
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // Verify invoice if provided
    if (dto.invoiceId) {
      const invoice = await this.prisma.billInvoice.findUnique({
        where: { id: dto.invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
      }

      if (invoice.customerId !== dto.customerId) {
        throw new BadRequestException('Invoice does not belong to this customer');
      }

      if (invoice.status === 'cancelled') {
        throw new BadRequestException('Cannot pay a cancelled invoice');
      }

      if (invoice.status === 'paid') {
        throw new BadRequestException('Invoice is already fully paid');
      }

      // Check if payment exceeds balance
      const balance = Number(invoice.balance);
      if (dto.amount > balance) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds invoice balance (${balance})`
        );
      }
    }

    // Generate payment number
    const paymentNo = await this.sequenceService.getNextNumber('payment');

    // Create payment
    const payment = await this.prisma.billPayment.create({
      data: {
        paymentNo,
        customerId: dto.customerId,
        invoiceId: dto.invoiceId,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        referenceNo: dto.referenceNo,
        bankId: dto.bankId,
        status: PaymentStatus.CONFIRMED,
        receivedBy: dto.receivedBy,
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
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            balance: true,
          },
        },
      },
    });

    // Update invoice payment status if linked to invoice
    if (dto.invoiceId) {
      await this.invoicesService.updatePaymentStatus(dto.invoiceId, dto.amount);
    }

    return payment;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    invoiceId?: string;
    paymentMethod?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const { page = 1, limit = 10, customerId, invoiceId, paymentMethod, status, fromDate, toDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) {
        where.paymentDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.paymentDate.lte = new Date(toDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.billPayment.findMany({
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
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              totalAmount: true,
              balance: true,
            },
          },
        },
      }),
      this.prisma.billPayment.count({ where }),
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
    const payment = await this.prisma.billPayment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            billingPeriod: true,
            totalAmount: true,
            paidAmount: true,
            balance: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByPaymentNo(paymentNo: string) {
    const payment = await this.prisma.billPayment.findUnique({
      where: { paymentNo },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            balance: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with number ${paymentNo} not found`);
    }

    return payment;
  }

  async cancel(id: string, dto: CancelPaymentDto) {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new ConflictException('Payment is already cancelled');
    }

    // Update payment status
    const cancelledPayment = await this.prisma.billPayment.update({
      where: { id },
      data: {
        status: PaymentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: dto.reason,
      },
    });

    // Reverse invoice payment if linked
    if (payment.invoiceId) {
      const invoice = await this.prisma.billInvoice.findUnique({
        where: { id: payment.invoiceId },
      });

      if (invoice) {
        const newPaidAmount = Math.max(0, Number(invoice.paidAmount) - Number(payment.amount));
        const newBalance = Number(invoice.totalAmount) - newPaidAmount;

        let status = invoice.status;
        if (newPaidAmount === 0) {
          status = 'issued';
        } else if (newBalance > 0) {
          status = 'partial';
        }

        await this.prisma.billInvoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status,
            paidAt: null,
          },
        });
      }
    }

    return cancelledPayment;
  }

  async getReceipt(id: string) {
    const payment = await this.findOne(id);

    return {
      receiptNo: payment.paymentNo,
      date: payment.paymentDate,
      customer: payment.customer,
      invoice: payment.invoice,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      referenceNo: payment.referenceNo,
      status: payment.status,
    };
  }
}
