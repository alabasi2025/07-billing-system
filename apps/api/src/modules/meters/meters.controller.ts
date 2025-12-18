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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MetersService } from './meters.service';
import { CreateMeterDto, UpdateMeterDto, InstallMeterDto, ReplaceMeterDto } from './dto/meter.dto';

@ApiTags('العدادات')
@Controller('api/v1/meters')
export class MetersController {
  constructor(private readonly service: MetersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إنشاء عداد جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء العداد بنجاح' })
  async create(@Body() dto: CreateMeterDto) {
    const meter = await this.service.create(dto);
    return {
      success: true,
      message: 'تم إنشاء العداد بنجاح',
      data: meter,
    };
  }

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة العدادات' })
  @ApiResponse({ status: 200, description: 'قائمة العدادات' })
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

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات العدادات' })
  @ApiResponse({ status: 200, description: 'الإحصائيات' })
  async getStatistics() {
    const data = await this.service.getStatistics();
    return {
      success: true,
      data,
    };
  }

  @Get('available')
  @ApiOperation({ summary: 'العدادات المتاحة للتركيب' })
  @ApiResponse({ status: 200, description: 'قائمة العدادات المتاحة' })
  async getAvailableMeters() {
    const meters = await this.service.getAvailableMeters();
    return {
      success: true,
      data: meters,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على تفاصيل عداد' })
  @ApiParam({ name: 'id', description: 'معرف العداد' })
  @ApiResponse({ status: 200, description: 'تفاصيل العداد' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const meter = await this.service.findOne(id);
    return {
      success: true,
      data: meter,
    };
  }

  @Get('number/:meterNo')
  @ApiOperation({ summary: 'البحث عن عداد برقمه' })
  @ApiParam({ name: 'meterNo', description: 'رقم العداد' })
  @ApiResponse({ status: 200, description: 'تفاصيل العداد' })
  async findByMeterNo(@Param('meterNo') meterNo: string) {
    const meter = await this.service.findByMeterNo(meterNo);
    return {
      success: true,
      data: meter,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات عداد' })
  @ApiParam({ name: 'id', description: 'معرف العداد' })
  @ApiResponse({ status: 200, description: 'تم التحديث بنجاح' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterDto,
  ) {
    const meter = await this.service.update(id, dto);
    return {
      success: true,
      message: 'تم تحديث العداد بنجاح',
      data: meter,
    };
  }

  @Post(':id/install')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تركيب عداد لعميل' })
  @ApiParam({ name: 'id', description: 'معرف العداد' })
  @ApiResponse({ status: 200, description: 'تم التركيب بنجاح' })
  async install(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InstallMeterDto,
  ) {
    const meter = await this.service.install(id, dto);
    return {
      success: true,
      message: 'تم تركيب العداد بنجاح',
      data: meter,
    };
  }

  @Post(':id/replace')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'استبدال عداد' })
  @ApiParam({ name: 'id', description: 'معرف العداد القديم' })
  @ApiResponse({ status: 200, description: 'تم الاستبدال بنجاح' })
  async replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceMeterDto,
  ) {
    const meter = await this.service.replace(id, dto);
    return {
      success: true,
      message: 'تم استبدال العداد بنجاح',
      data: meter,
    };
  }

  @Post(':id/uninstall')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إزالة عداد من عميل' })
  @ApiParam({ name: 'id', description: 'معرف العداد' })
  @ApiResponse({ status: 200, description: 'تم الإزالة بنجاح' })
  async uninstall(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    const meter = await this.service.uninstall(id, reason);
    return {
      success: true,
      message: 'تم إزالة العداد بنجاح',
      data: meter,
    };
  }

  @Post(':id/faulty')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحديد عداد كعاطل' })
  @ApiParam({ name: 'id', description: 'معرف العداد' })
  @ApiResponse({ status: 200, description: 'تم التحديث بنجاح' })
  async markAsFaulty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    const meter = await this.service.markAsFaulty(id, reason);
    return {
      success: true,
      message: 'تم تحديد العداد كعاطل',
      data: meter,
    };
  }

  @Get(':id/readings')
  @ApiOperation({ summary: 'الحصول على قراءات عداد' })
  @ApiParam({ name: 'id', description: 'معرف العداد' })
  @ApiResponse({ status: 200, description: 'قائمة القراءات' })
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
