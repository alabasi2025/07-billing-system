import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { POSService } from './pos.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreatePOSTransactionDto, SearchCustomerDto } from './dto/pos.dto';

@ApiTags('نقاط البيع')
@Controller('api/v1/pos')
export class POSController {
  constructor(private readonly service: POSService) {}

  @Get('search')
  @ApiOperation({ summary: 'البحث عن عميل' })
  @ApiQuery({ name: 'accountNo', required: false })
  @ApiQuery({ name: 'meterNo', required: false })
  @ApiQuery({ name: 'idNumber', required: false })
  @ApiQuery({ name: 'phone', required: false })
  async searchCustomer(
    @Query('accountNo') accountNo?: string,
    @Query('meterNo') meterNo?: string,
    @Query('idNumber') idNumber?: string,
    @Query('phone') phone?: string,
  ) {
    const customers = await this.service.searchCustomer({
      accountNo,
      meterNo,
      idNumber,
      phone,
    });

    return {
      success: true,
      data: customers,
    };
  }

  @Get('customer/:id/summary')
  @ApiOperation({ summary: 'ملخص حساب العميل' })
  async getCustomerSummary(@Param('id') id: string) {
    const summary = await this.service.getCustomerSummary(id);

    return {
      success: true,
      data: summary,
    };
  }

  @Post('transaction')
  @ApiOperation({ summary: 'إنشاء معاملة' })
  async createTransaction(@Body() dto: CreatePOSTransactionDto) {
    const result = await this.service.createTransaction(dto);

    return {
      success: true,
      data: result,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات نقطة البيع' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const stats = await this.service.getStatistics(fromDate, toDate);

    return {
      success: true,
      data: stats,
    };
  }
}
