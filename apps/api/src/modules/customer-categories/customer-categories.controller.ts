import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CustomerCategoriesService } from './customer-categories.service';
import { CreateCustomerCategoryDto, UpdateCustomerCategoryDto } from './dto/customer-category.dto';

@ApiTags('فئات العملاء')
@Controller('api/v1/customer-categories')
export class CustomerCategoriesController {
  constructor(private readonly service: CustomerCategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إنشاء فئة عميل جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الفئة بنجاح' })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  async create(@Body() dto: CreateCustomerCategoryDto) {
    const category = await this.service.create(dto);
    return {
      success: true,
      message: 'Customer category created successfully',
      data: category,
    };
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع فئات العملاء' })
  @ApiQuery({ name: 'page', required: false, description: 'رقم الصفحة' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد العناصر في الصفحة' })
  @ApiQuery({ name: 'search', required: false, description: 'نص البحث' })
  @ApiQuery({ name: 'isActive', required: false, description: 'فلترة حسب الحالة' })
  @ApiResponse({ status: 200, description: 'قائمة فئات العملاء' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'جلب الفئات النشطة فقط' })
  @ApiResponse({ status: 200, description: 'قائمة الفئات النشطة' })
  async getActiveCategories() {
    const categories = await this.service.getActiveCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب فئة عميل بالمعرف' })
  @ApiParam({ name: 'id', description: 'معرف الفئة (UUID)' })
  @ApiResponse({ status: 200, description: 'بيانات الفئة' })
  @ApiResponse({ status: 404, description: 'الفئة غير موجودة' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.service.findOne(id);
    return {
      success: true,
      data: category,
    };
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'جلب فئة عميل بالكود' })
  @ApiParam({ name: 'code', description: 'كود الفئة' })
  @ApiResponse({ status: 200, description: 'بيانات الفئة' })
  @ApiResponse({ status: 404, description: 'الفئة غير موجودة' })
  async findByCode(@Param('code') code: string) {
    const category = await this.service.findByCode(code);
    return {
      success: true,
      data: category,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث فئة عميل' })
  @ApiParam({ name: 'id', description: 'معرف الفئة (UUID)' })
  @ApiResponse({ status: 200, description: 'تم تحديث الفئة بنجاح' })
  @ApiResponse({ status: 404, description: 'الفئة غير موجودة' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerCategoryDto,
  ) {
    const category = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Customer category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف فئة عميل' })
  @ApiParam({ name: 'id', description: 'معرف الفئة (UUID)' })
  @ApiResponse({ status: 200, description: 'تم حذف الفئة بنجاح' })
  @ApiResponse({ status: 404, description: 'الفئة غير موجودة' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Customer category deleted successfully',
    };
  }
}
