import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MetersService } from './meters.service';
import { CreateMeterDto, UpdateMeterDto, InstallMeterDto, ReplaceMeterDto } from './dto/meter.dto';

@Controller('api/v1/meters')
export class MetersController {
  constructor(private readonly service: MetersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMeterDto) {
    const meter = await this.service.create(dto);
    return {
      success: true,
      message: 'Meter created successfully',
      data: meter,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('meterTypeId') meterTypeId?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      customerId,
      meterTypeId,
      status,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('available')
  async getAvailableMeters() {
    const meters = await this.service.getAvailableMeters();
    return {
      success: true,
      data: meters,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const meter = await this.service.findOne(id);
    return {
      success: true,
      data: meter,
    };
  }

  @Get('number/:meterNo')
  async findByMeterNo(@Param('meterNo') meterNo: string) {
    const meter = await this.service.findByMeterNo(meterNo);
    return {
      success: true,
      data: meter,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterDto,
  ) {
    const meter = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Meter updated successfully',
      data: meter,
    };
  }

  @Post(':id/install')
  @HttpCode(HttpStatus.OK)
  async install(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InstallMeterDto,
  ) {
    const meter = await this.service.install(id, dto);
    return {
      success: true,
      message: 'Meter installed successfully',
      data: meter,
    };
  }

  @Post(':id/replace')
  @HttpCode(HttpStatus.OK)
  async replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceMeterDto,
  ) {
    const meter = await this.service.replace(id, dto);
    return {
      success: true,
      message: 'Meter replaced successfully',
      data: meter,
    };
  }

  @Get(':id/readings')
  async getMeterReadings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getMeterReadings(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });

    return {
      success: true,
      ...result,
    };
  }
}
