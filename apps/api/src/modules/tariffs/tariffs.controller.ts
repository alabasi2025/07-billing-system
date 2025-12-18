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
import { TariffsService } from './tariffs.service';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';

@Controller('api/v1/tariffs')
export class TariffsController {
  constructor(private readonly service: TariffsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTariffDto) {
    const tariff = await this.service.create(dto);
    return {
      success: true,
      message: 'Tariff created successfully',
      data: tariff,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      categoryId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('category/:categoryId')
  async findByCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    const tariffs = await this.service.findByCategory(categoryId);
    return {
      success: true,
      data: tariffs,
    };
  }

  @Get('calculate')
  async calculateConsumption(
    @Query('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('consumption') consumption: string,
  ) {
    const result = await this.service.calculateConsumption(
      categoryId,
      parseFloat(consumption),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const tariff = await this.service.findOne(id);
    return {
      success: true,
      data: tariff,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTariffDto,
  ) {
    const tariff = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Tariff updated successfully',
      data: tariff,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Tariff deleted successfully',
    };
  }
}
