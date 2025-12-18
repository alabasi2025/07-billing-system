import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePosTerminalDto, UpdatePosTerminalDto } from './dto';

@Injectable()
export class PosTerminalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: string;
    search?: string;
  }) {
    const { skip = 0, take = 10, status, search } = params;

    const where: any = {
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { terminalCode: { contains: search, mode: 'insensitive' } },
        { terminalName: { contains: search, mode: 'insensitive' } },
        { locationName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.billPosTerminal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          sessions: {
            where: { status: 'open' },
            take: 1,
          },
        },
      }),
      this.prisma.billPosTerminal.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async findOne(id: string) {
    const terminal = await this.prisma.billPosTerminal.findFirst({
      where: { id, isDeleted: false },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!terminal) {
      throw new NotFoundException('نقطة البيع غير موجودة');
    }

    return terminal;
  }

  async create(dto: CreatePosTerminalDto) {
    // التحقق من عدم تكرار رمز نقطة البيع
    const existing = await this.prisma.billPosTerminal.findUnique({
      where: { terminalCode: dto.terminalCode },
    });

    if (existing) {
      throw new ConflictException('رمز نقطة البيع موجود مسبقاً');
    }

    return this.prisma.billPosTerminal.create({
      data: {
        terminalCode: dto.terminalCode,
        terminalName: dto.terminalName,
        locationId: dto.locationId,
        locationName: dto.locationName,
        assignedUserId: dto.assignedUserId,
        printerType: dto.printerType || 'thermal',
        printerIp: dto.printerIp,
        openingBalance: dto.openingBalance || 0,
        currentBalance: dto.openingBalance || 0,
      },
    });
  }

  async update(id: string, dto: UpdatePosTerminalDto) {
    await this.findOne(id);

    return this.prisma.billPosTerminal.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete
    return this.prisma.billPosTerminal.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getStatistics() {
    const [total, active, inactive, maintenance] = await Promise.all([
      this.prisma.billPosTerminal.count({ where: { isDeleted: false } }),
      this.prisma.billPosTerminal.count({ where: { isDeleted: false, status: 'active' } }),
      this.prisma.billPosTerminal.count({ where: { isDeleted: false, status: 'inactive' } }),
      this.prisma.billPosTerminal.count({ where: { isDeleted: false, status: 'maintenance' } }),
    ]);

    const openSessions = await this.prisma.billPosSession.count({
      where: { status: 'open', isDeleted: false },
    });

    return {
      total,
      active,
      inactive,
      maintenance,
      openSessions,
    };
  }
}
