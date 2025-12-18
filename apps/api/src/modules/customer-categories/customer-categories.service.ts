import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerCategoryDto, UpdateCustomerCategoryDto } from './dto/customer-category.dto';

@Injectable()
export class CustomerCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerCategoryDto) {
    // Check if code already exists
    const existing = await this.prisma.billCustomerCategory.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Customer category with code ${dto.code} already exists`);
    }

    return this.prisma.billCustomerCategory.create({
      data: {
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 10, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.billCustomerCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              customers: true,
              tariffs: true,
            },
          },
        },
      }),
      this.prisma.billCustomerCategory.count({ where }),
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
    const category = await this.prisma.billCustomerCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customers: true,
            tariffs: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Customer category with ID ${id} not found`);
    }

    return category;
  }

  async findByCode(code: string) {
    const category = await this.prisma.billCustomerCategory.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            customers: true,
            tariffs: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Customer category with code ${code} not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCustomerCategoryDto) {
    await this.findOne(id);

    return this.prisma.billCustomerCategory.update({
      where: { id },
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        description: dto.description,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.billCustomerCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customers: true,
            tariffs: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Customer category with ID ${id} not found`);
    }

    if (category._count.customers > 0 || category._count.tariffs > 0) {
      throw new ConflictException(
        'Cannot delete category with associated customers or tariffs'
      );
    }

    return this.prisma.billCustomerCategory.delete({
      where: { id },
    });
  }

  async getActiveCategories() {
    return this.prisma.billCustomerCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
