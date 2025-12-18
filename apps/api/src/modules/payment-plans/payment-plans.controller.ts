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
import { PaymentPlansService } from './payment-plans.service';
import { CreatePaymentPlanDto, PayInstallmentDto, ApprovePaymentPlanDto } from './dto';

@ApiTags('Payment Plans - خطط السداد')
@Controller('api/v1/payment-plans')
export class PaymentPlansController {
  constructor(private readonly service: PaymentPlansService) {}

  @Get()
  @ApiOperation({ summary: 'جلب جميع خطط السداد' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      customerId,
      status,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات خطط السداد' })
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get('overdue')
  @ApiOperation({ summary: 'الأقساط المتأخرة' })
  checkOverdue() {
    return this.service.checkOverdue();
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'خطط سداد عميل محدد' })
  findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.service.findByCustomer(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب خطة سداد محددة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء خطة سداد جديدة' })
  create(@Body() dto: CreatePaymentPlanDto) {
    return this.service.create(dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'اعتماد خطة سداد' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePaymentPlanDto,
  ) {
    return this.service.approve(id, dto);
  }

  @Post(':id/installments/:installmentId/pay')
  @ApiOperation({ summary: 'سداد قسط' })
  payInstallment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('installmentId', ParseUUIDPipe) installmentId: string,
    @Body() dto: PayInstallmentDto,
  ) {
    return this.service.payInstallment(id, installmentId, dto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'إلغاء خطة سداد' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.service.cancel(id, reason);
  }
}
