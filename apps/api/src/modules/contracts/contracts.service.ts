import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { CreateContractDto, UpdateContractDto, TerminateContractDto, ContractStatus } from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  async create(dto: CreateContractDto) {
    // Verify customer exists
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // Check for existing active contract
    const existingContract = await this.prisma.billContract.findFirst({
      where: {
        customerId: dto.customerId,
        status: { in: ['active', 'draft'] },
      },
    });

    if (existingContract) {
      throw new ConflictException('Customer already has an active contract');
    }

    // Generate contract number
    const contractNo = await this.sequenceService.getNextNumber('contract');

    return this.prisma.billContract.create({
      data: {
        contractNo,
        customerId: dto.customerId,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        depositAmount: dto.depositAmount ?? 0,
        guaranteeAmount: dto.guaranteeAmount ?? 0,
        status: ContractStatus.ACTIVE,
        terms: dto.terms,
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
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, customerId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.billContract.findMany({
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
        },
      }),
      this.prisma.billContract.count({ where }),
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
    const contract = await this.prisma.billContract.findUnique({
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
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async findByContractNo(contractNo: string) {
    const contract = await this.prisma.billContract.findUnique({
      where: { contractNo },
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

    if (!contract) {
      throw new NotFoundException(`Contract with number ${contractNo} not found`);
    }

    return contract;
  }

  async update(id: string, dto: UpdateContractDto) {
    await this.findOne(id);

    return this.prisma.billContract.update({
      where: { id },
      data: {
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        depositAmount: dto.depositAmount,
        guaranteeAmount: dto.guaranteeAmount,
        status: dto.status,
        terms: dto.terms,
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
      },
    });
  }

  async terminate(id: string, dto: TerminateContractDto) {
    const contract = await this.findOne(id);

    if (contract.status === ContractStatus.TERMINATED) {
      throw new ConflictException('Contract is already terminated');
    }

    return this.prisma.billContract.update({
      where: { id },
      data: {
        status: ContractStatus.TERMINATED,
        terminatedAt: new Date(dto.terminationDate),
        terminationReason: dto.reason,
      },
    });
  }

  async suspend(id: string, reason?: string) {
    const contract = await this.findOne(id);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be suspended');
    }

    return this.prisma.billContract.update({
      where: { id },
      data: {
        status: ContractStatus.SUSPENDED,
        notes: reason ? `${contract.notes ?? ''}\nSuspended: ${reason}`.trim() : contract.notes,
      },
    });
  }

  async activate(id: string) {
    const contract = await this.findOne(id);

    if (contract.status === ContractStatus.ACTIVE) {
      throw new ConflictException('Contract is already active');
    }

    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Cannot activate a terminated contract');
    }

    return this.prisma.billContract.update({
      where: { id },
      data: {
        status: ContractStatus.ACTIVE,
      },
    });
  }

  async getCustomerActiveContract(customerId: string) {
    const contract = await this.prisma.billContract.findFirst({
      where: {
        customerId,
        status: ContractStatus.ACTIVE,
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

    return contract;
  }
}
