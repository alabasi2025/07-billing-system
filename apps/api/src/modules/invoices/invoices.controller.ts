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
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto, CancelInvoiceDto, RebillInvoiceDto } from './dto/invoice.dto';

@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(@Body() dto: GenerateInvoiceDto) {
    const invoice = await this.service.generate(dto);
    return {
      success: true,
      message: 'Invoice generated successfully',
      data: invoice,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('billingPeriod') billingPeriod?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      customerId,
      billingPeriod,
      status,
      fromDate,
      toDate,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const invoice = await this.service.findOne(id);
    return {
      success: true,
      data: invoice,
    };
  }

  @Get('number/:invoiceNo')
  async findByInvoiceNo(@Param('invoiceNo') invoiceNo: string) {
    const invoice = await this.service.findByInvoiceNo(invoiceNo);
    return {
      success: true,
      data: invoice,
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    const invoice = await this.service.cancel(id, dto);
    return {
      success: true,
      message: 'Invoice cancelled successfully',
      data: invoice,
    };
  }

  @Post(':id/rebill')
  @HttpCode(HttpStatus.CREATED)
  async rebill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RebillInvoiceDto,
  ) {
    const invoice = await this.service.rebill(id, dto);
    return {
      success: true,
      message: 'Invoice rebilled successfully',
      data: invoice,
    };
  }

  @Post('check-overdue')
  @HttpCode(HttpStatus.OK)
  async checkOverdueInvoices() {
    const result = await this.service.checkOverdueInvoices();
    return {
      success: true,
      message: `Updated ${result.updated} overdue invoices`,
      data: result,
    };
  }
}
