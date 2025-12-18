import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PosSessionsService } from './pos-sessions.service';
import { OpenSessionDto, CloseSessionDto, CreatePosTransactionDto, VoidTransactionDto } from './dto';

@ApiTags('POS Sessions - جلسات نقاط البيع')
@Controller('api/v1/pos-sessions')
export class PosSessionsController {
  constructor(private readonly service: PosSessionsService) {}

  @Get()
  @ApiOperation({ summary: 'جلب جميع الجلسات' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'terminalId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('terminalId') terminalId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      terminalId,
      status,
    });
  }

  @Get('current/:terminalId')
  @ApiOperation({ summary: 'جلب الجلسة الحالية لنقطة بيع' })
  findCurrentSession(@Param('terminalId', ParseUUIDPipe) terminalId: string) {
    return this.service.findCurrentSession(terminalId);
  }

  @Get('daily-report')
  @ApiOperation({ summary: 'تقرير يومي' })
  @ApiQuery({ name: 'date', required: false, type: String })
  getDailyReport(@Query('date') date?: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.service.getDailyReport(reportDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب جلسة محددة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'تقرير الجلسة' })
  getSessionReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getSessionReport(id);
  }

  @Post('open')
  @ApiOperation({ summary: 'فتح جلسة جديدة' })
  openSession(@Body() dto: OpenSessionDto) {
    return this.service.openSession(dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'إغلاق الجلسة' })
  closeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseSessionDto,
  ) {
    return this.service.closeSession(id, dto);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'إنشاء معاملة جديدة' })
  createTransaction(@Body() dto: CreatePosTransactionDto) {
    return this.service.createTransaction(dto);
  }

  @Put('transactions/:id/void')
  @ApiOperation({ summary: 'إلغاء معاملة' })
  voidTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidTransactionDto,
  ) {
    return this.service.voidTransaction(id, dto);
  }
}
