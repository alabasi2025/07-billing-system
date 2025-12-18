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
import { CustomerCategoriesService } from './customer-categories.service';
import { CreateCustomerCategoryDto, UpdateCustomerCategoryDto } from './dto/customer-category.dto';

@Controller('api/v1/customer-categories')
export class CustomerCategoriesController {
  constructor(private readonly service: CustomerCategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCustomerCategoryDto) {
    const category = await this.service.create(dto);
    return {
      success: true,
      message: 'Customer category created successfully',
      data: category,
    };
  }

  @Get()
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
  async getActiveCategories() {
    const categories = await this.service.getActiveCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.service.findOne(id);
    return {
      success: true,
      data: category,
    };
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    const category = await this.service.findByCode(code);
    return {
      success: true,
      data: category,
    };
  }

  @Put(':id')
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
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Customer category deleted successfully',
    };
  }
}
