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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, CancelPaymentDto } from './dto/payment.dto';

@ApiTags('المدفوعات')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePaymentDto) {
    const payment = await this.service.create(dto);
    return {
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      customerId,
      invoiceId,
      paymentMethod,
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
    const payment = await this.service.findOne(id);
    return {
      success: true,
      data: payment,
    };
  }

  @Get('number/:paymentNo')
  async findByPaymentNo(@Param('paymentNo') paymentNo: string) {
    const payment = await this.service.findByPaymentNo(paymentNo);
    return {
      success: true,
      data: payment,
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelPaymentDto,
  ) {
    const payment = await this.service.cancel(id, dto);
    return {
      success: true,
      message: 'Payment cancelled successfully',
      data: payment,
    };
  }

  @Get('receipt/:id')
  async getReceipt(@Param('id', ParseUUIDPipe) id: string) {
    const receipt = await this.service.getReceipt(id);
    return {
      success: true,
      data: receipt,
    };
  }
}
