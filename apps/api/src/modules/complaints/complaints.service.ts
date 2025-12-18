import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
  ResolveComplaintDto,
  ComplaintStatus,
  ComplaintPriority,
} from './dto/complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  async create(dto: CreateComplaintDto) {
    // Verify customer exists
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // Generate complaint number
    const complaintNo = await this.sequenceService.getNextNumber('complaint');

    return this.prisma.billComplaint.create({
      data: {
        complaintNo,
        customerId: dto.customerId,
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority ?? ComplaintPriority.MEDIUM,
        status: ComplaintStatus.OPEN,
        relatedInvoiceId: dto.relatedInvoiceId,
        relatedMeterId: dto.relatedMeterId,
      },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    type?: string;
    status?: string;
    priority?: string;
  }) {
    const { page = 1, limit = 10, customerId, type, status, priority } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerId) where.customerId = customerId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      this.prisma.billComplaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          customer: {
            select: {
              id: true,
              accountNo: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.billComplaint.count({ where }),
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
    const complaint = await this.prisma.billComplaint.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            accountNo: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        relatedInvoice: {
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            status: true,
          },
        },
        relatedMeter: {
          select: {
            id: true,
            meterNo: true,
            status: true,
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return complaint;
  }

  async update(id: string, dto: UpdateComplaintDto) {
    await this.findOne(id);

    return this.prisma.billComplaint.update({
      where: { id },
      data: {
        status: dto.status,
        priority: dto.priority,
        assignedTo: dto.assignedTo,
        response: dto.response,
        internalNotes: dto.internalNotes,
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

  async resolve(id: string, dto: ResolveComplaintDto) {
    const complaint = await this.findOne(id);

    if (complaint.status === ComplaintStatus.RESOLVED || complaint.status === ComplaintStatus.CLOSED) {
      throw new ConflictException('Complaint is already resolved or closed');
    }

    return this.prisma.billComplaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.RESOLVED,
        resolution: dto.resolution,
        internalNotes: dto.internalNotes,
        resolvedAt: new Date(),
      },
    });
  }

  async close(id: string) {
    const complaint = await this.findOne(id);

    if (complaint.status === ComplaintStatus.CLOSED) {
      throw new ConflictException('Complaint is already closed');
    }

    return this.prisma.billComplaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.CLOSED,
        closedAt: new Date(),
      },
    });
  }

  async getOpenComplaints() {
    return this.prisma.billComplaint.findMany({
      where: {
        status: { in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
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

  async getComplaintStats() {
    const [open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.billComplaint.count({ where: { status: ComplaintStatus.OPEN } }),
      this.prisma.billComplaint.count({ where: { status: ComplaintStatus.IN_PROGRESS } }),
      this.prisma.billComplaint.count({ where: { status: ComplaintStatus.RESOLVED } }),
      this.prisma.billComplaint.count({ where: { status: ComplaintStatus.CLOSED } }),
    ]);

    return {
      open,
      inProgress,
      resolved,
      closed,
      total: open + inProgress + resolved + closed,
    };
  }
}
