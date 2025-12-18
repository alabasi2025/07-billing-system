import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { AccountingService } from '../accounting/accounting.service';
import { GenerateInvoiceDto, CancelInvoiceDto, RebillInvoiceDto, InvoiceStatus } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  private readonly VAT_RATE = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tariffsService: TariffsService,
    private readonly sequenceService: SequenceService,
    private readonly eventPublisher: EventPublisherService,
    private readonly accountingService: AccountingService,
  ) {}

  async generate(dto: GenerateInvoiceDto) {
    // Get customer with category
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
      include: {
        category: true,
        meters: {
          where: { status: 'active' },
          take: 1,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    if (customer.status !== 'active') {
      throw new BadRequestException('Cannot generate invoice for inactive customer');
    }

    if (customer.meters.length === 0) {
      throw new BadRequestException('Customer has no active meter');
    }

    const meter = customer.meters[0];

    // Check if invoice already exists for this period
    const existingInvoice = await this.prisma.billInvoice.findFirst({
      where: {
        customerId: dto.customerId,
        billingPeriod: dto.billingPeriod,
        status: { notIn: ['cancelled'] },
      },
    });

    if (existingInvoice) {
      throw new ConflictException(
        `Invoice already exists for customer ${customer.accountNo} in period ${dto.billingPeriod}`
      );
    }

    // Get reading for billing period
    const reading = await this.prisma.billMeterReading.findFirst({
      where: {
        meterId: meter.id,
        billingPeriod: dto.billingPeriod,
        readingType: { in: ['normal', 'estimated'] },
      },
      orderBy: { readingDate: 'desc' },
    });

    if (!reading) {
      throw new BadRequestException(
        `No reading found for meter ${meter.meterNo} in period ${dto.billingPeriod}`
      );
    }

    // Calculate consumption using tariff slices
    const consumption = Number(reading.consumption);
    const tariffCalculation = await this.tariffsService.calculateConsumption(
      customer.categoryId,
      consumption
    );

    // Calculate totals
    const consumptionAmount = tariffCalculation.totalAmount;
    const fixedCharges = tariffCalculation.fixedCharge;
    const otherCharges = dto.otherCharges ?? 0;
    const subtotal = consumptionAmount + fixedCharges + otherCharges;
    const vatAmount = subtotal * (this.VAT_RATE / 100);
    const totalAmount = subtotal + vatAmount;

    // Generate invoice number
    const invoiceNo = await this.sequenceService.getNextNumber('invoice');

    // Calculate dates
    const [year, month] = dto.billingPeriod.split('-').map(Number);
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0);
    const dueDate = new Date(year, month, 15); // Due on 15th of next month

    // Create invoice with items
    const invoice = await this.prisma.billInvoice.create({
      data: {
        invoiceNo,
        customerId: dto.customerId,
        billingPeriod: dto.billingPeriod,
        fromDate,
        toDate,
        previousReading: reading.previousReading,
        currentReading: reading.reading,
        consumption: consumption,
        consumptionAmount: consumptionAmount,
        fixedCharges: fixedCharges,
        otherCharges: otherCharges,
        subtotal: subtotal,
        vatRate: this.VAT_RATE,
        vatAmount: vatAmount,
        totalAmount: totalAmount,
        dueDate,
        status: 'issued',
        balance: totalAmount,
        notes: dto.notes,
        items: {
          create: [
            // Consumption items
            ...tariffCalculation.items.map((item) => ({
              description: item.description,
              itemType: 'consumption',
              fromKwh: item.fromKwh,
              toKwh: item.toKwh,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            })),
            // Fixed charge
            ...(fixedCharges > 0
              ? [
                  {
                    description: 'رسوم ثابتة',
                    itemType: 'fixed_charge',
                    quantity: 1,
                    rate: fixedCharges,
                    amount: fixedCharges,
                  },
                ]
              : []),
            // Other charges
            ...(otherCharges > 0
              ? [
                  {
                    description: 'رسوم أخرى',
                    itemType: 'other',
                    quantity: 1,
                    rate: otherCharges,
                    amount: otherCharges,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            category: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        items: true,
      },
    });

    // Mark reading as processed
    await this.prisma.billMeterReading.update({
      where: { id: reading.id },
      data: { isProcessed: true },
    });

    // Publish invoice created event for integration with other systems
    await this.eventPublisher.publishInvoiceCreated({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerId: invoice.customerId,
      totalAmount: Number(invoice.totalAmount),
      dueDate: invoice.dueDate,
    });

    // Create double-entry journal entry for the invoice (القيد المزدوج)
    await this.accountingService.createInvoiceEntry({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerId: invoice.customerId,
      consumptionAmount: Number(invoice.consumptionAmount),
      fixedCharges: Number(invoice.fixedCharges),
      otherCharges: Number(invoice.otherCharges),
      vatAmount: Number(invoice.vatAmount),
      totalAmount: Number(invoice.totalAmount),
    });

    return invoice;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    billingPeriod?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const { page = 1, limit = 10, customerId, billingPeriod, status, fromDate, toDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (billingPeriod) {
      where.billingPeriod = billingPeriod;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.issuedAt = {};
      if (fromDate) {
        where.issuedAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.issuedAt.lte = new Date(toDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.billInvoice.findMany({
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
              category: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.billInvoice.count({ where }),
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
    const invoice = await this.prisma.billInvoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            address: true,
            phone: true,
            category: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          where: { status: 'confirmed' },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByInvoiceNo(invoiceNo: string) {
    const invoice = await this.prisma.billInvoice.findUnique({
      where: { invoiceNo },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            category: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with number ${invoiceNo} not found`);
    }

    return invoice;
  }

  async cancel(id: string, dto: CancelInvoiceDto) {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new ConflictException('Invoice is already cancelled');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    if (Number(invoice.paidAmount) > 0) {
      throw new BadRequestException('Cannot cancel invoice with payments. Refund payments first.');
    }

    return this.prisma.billInvoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: dto.reason,
      },
    });
  }

  async rebill(id: string, dto: RebillInvoiceDto) {
    const originalInvoice = await this.findOne(id);

    if (originalInvoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot rebill a cancelled invoice');
    }

    // Cancel original invoice
    await this.prisma.billInvoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: `إعادة فوترة: ${dto.reason}`,
      },
    });

    // Generate new invoice
    return this.generate({
      customerId: originalInvoice.customerId,
      billingPeriod: originalInvoice.billingPeriod,
      otherCharges: dto.otherCharges,
      notes: `إعادة فوترة للفاتورة ${originalInvoice.invoiceNo}: ${dto.reason}`,
    });
  }

  async updatePaymentStatus(id: string, paidAmount: number) {
    const invoice = await this.findOne(id);
    const totalPaid = Number(invoice.paidAmount) + paidAmount;
    const totalAmount = Number(invoice.totalAmount);
    const balance = totalAmount - totalPaid;

    let status = invoice.status;
    let paidAt = invoice.paidAt;

    if (balance <= 0) {
      status = InvoiceStatus.PAID;
      paidAt = new Date();
    } else if (totalPaid > 0) {
      status = InvoiceStatus.PARTIAL;
    }

    return this.prisma.billInvoice.update({
      where: { id },
      data: {
        paidAmount: totalPaid,
        balance: Math.max(0, balance),
        status,
        paidAt,
      },
    });
  }

  async checkOverdueInvoices() {
    const today = new Date();

    const overdueInvoices = await this.prisma.billInvoice.updateMany({
      where: {
        status: { in: ['issued', 'partial'] },
        dueDate: { lt: today },
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    return { updated: overdueInvoices.count };
  }

  async getStatistics(params: { fromDate?: string; toDate?: string }) {
    const where: any = {};

    if (params.fromDate || params.toDate) {
      where.issuedAt = {};
      if (params.fromDate) {
        where.issuedAt.gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        where.issuedAt.lte = new Date(params.toDate);
      }
    }

    const [total, byStatus, totals] = await Promise.all([
      this.prisma.billInvoice.count({ where }),
      this.prisma.billInvoice.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.billInvoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balance: true,
          consumption: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    return {
      total,
      byStatus: statusMap,
      totalAmount: Number(totals._sum.totalAmount) || 0,
      paidAmount: Number(totals._sum.paidAmount) || 0,
      balance: Number(totals._sum.balance) || 0,
      totalConsumption: Number(totals._sum.consumption) || 0,
    };
  }

  async batchBilling(dto: { billingPeriod: string; categoryId?: string; city?: string }) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ customerId: string; error: string }>,
      invoices: [] as string[],
    };

    // Get all active customers with pending readings
    const customerWhere: any = {
      status: 'active',
    };

    if (dto.categoryId) {
      customerWhere.categoryId = dto.categoryId;
    }

    if (dto.city) {
      customerWhere.city = dto.city;
    }

    const customers = await this.prisma.billCustomer.findMany({
      where: customerWhere,
      include: {
        meters: {
          where: { status: 'active' },
          include: {
            readings: {
              where: {
                billingPeriod: dto.billingPeriod,
                isProcessed: false,
              },
              take: 1,
            },
          },
        },
      },
    });

    for (const customer of customers) {
      // Check if customer has a meter with pending reading
      const meterWithReading = customer.meters.find((m) => m.readings.length > 0);
      if (!meterWithReading) continue;

      try {
        const invoice = await this.generate({
          customerId: customer.id,
          billingPeriod: dto.billingPeriod,
        });
        results.success++;
        results.invoices.push(invoice.invoiceNo);
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId: customer.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}
