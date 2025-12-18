import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeterReadingsService } from './meter-readings.service';
import { CreateMeterReadingDto, BulkUploadReadingsDto } from './dto/meter-reading.dto';

@Controller('api/v1/readings')
export class MeterReadingsController {
  constructor(private readonly service: MeterReadingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMeterReadingDto) {
    const reading = await this.service.create(dto);
    return {
      success: true,
      message: 'Meter reading created successfully',
      data: reading,
    };
  }

  @Post('bulk-upload')
  @HttpCode(HttpStatus.OK)
  async bulkUpload(@Body() dto: BulkUploadReadingsDto) {
    const result = await this.service.bulkUpload(dto);
    return {
      success: true,
      message: `Processed ${result.success + result.failed} readings`,
      data: result,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('meterId') meterId?: string,
    @Query('billingPeriod') billingPeriod?: string,
    @Query('readingType') readingType?: string,
    @Query('isProcessed') isProcessed?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      meterId,
      billingPeriod,
      readingType,
      isProcessed: isProcessed !== undefined ? isProcessed === 'true' : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('pending')
  async getPendingReadings(@Query('billingPeriod') billingPeriod?: string) {
    const readings = await this.service.getPendingReadings(billingPeriod);
    return {
      success: true,
      data: readings,
      total: readings.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const reading = await this.service.findOne(id);
    return {
      success: true,
      data: reading,
    };
  }

  @Post('mark-processed')
  @HttpCode(HttpStatus.OK)
  async markAsProcessed(@Body('ids') ids: string[]) {
    const result = await this.service.markAsProcessed(ids);
    return {
      success: true,
      message: `Marked ${result.count} readings as processed`,
      data: { count: result.count },
    };
  }
}
