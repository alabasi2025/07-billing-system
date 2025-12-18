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
import { MeterTypesService } from './meter-types.service';
import { CreateMeterTypeDto, UpdateMeterTypeDto } from './dto/meter-type.dto';

@Controller('api/v1/meter-types')
export class MeterTypesController {
  constructor(private readonly service: MeterTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMeterTypeDto) {
    const meterType = await this.service.create(dto);
    return {
      success: true,
      message: 'Meter type created successfully',
      data: meterType,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('isSmartMeter') isSmartMeter?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isSmartMeter: isSmartMeter !== undefined ? isSmartMeter === 'true' : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('active')
  async getActiveMeterTypes() {
    const meterTypes = await this.service.getActiveMeterTypes();
    return {
      success: true,
      data: meterTypes,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const meterType = await this.service.findOne(id);
    return {
      success: true,
      data: meterType,
    };
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    const meterType = await this.service.findByCode(code);
    return {
      success: true,
      data: meterType,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterTypeDto,
  ) {
    const meterType = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Meter type updated successfully',
      data: meterType,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Meter type deleted successfully',
    };
  }
}
