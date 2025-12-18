import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('التقارير')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'إحصائيات لوحة التحكم' })
  async getDashboardStats() {
    const stats = await this.service.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'تقرير الإيرادات' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'month', 'category'] })
  async getRevenueReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('categoryId') categoryId?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    const report = await this.service.getRevenueReport({
      fromDate,
      toDate,
      categoryId,
      groupBy,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('customers')
  @ApiOperation({ summary: 'تقرير العملاء' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getCustomerReport(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
  ) {
    const report = await this.service.getCustomerReport({
      categoryId,
      status,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('consumption')
  @ApiOperation({ summary: 'تقرير الاستهلاك' })
  @ApiQuery({ name: 'billingPeriod', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async getConsumptionReport(
    @Query('billingPeriod') billingPeriod?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const report = await this.service.getConsumptionReport({
      billingPeriod,
      categoryId,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('outstanding')
  @ApiOperation({ summary: 'تقرير المستحقات' })
  @ApiQuery({ name: 'asOfDate', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async getOutstandingReport(
    @Query('asOfDate') asOfDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const report = await this.service.getOutstandingReport({
      asOfDate,
      categoryId,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('subsidy')
  @ApiOperation({ summary: 'تقرير الدعم الحكومي' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async getSubsidyReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const report = await this.service.getSubsidyReport({
      fromDate,
      toDate,
      categoryId,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('meters')
  @ApiOperation({ summary: 'تقرير العدادات' })
  @ApiQuery({ name: 'meterTypeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getMeterReport(
    @Query('meterTypeId') meterTypeId?: string,
    @Query('status') status?: string,
  ) {
    const report = await this.service.getMeterReport({
      meterTypeId,
      status,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('collection')
  @ApiOperation({ summary: 'تقرير التحصيل' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  async getCollectionReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    const report = await this.service.getCollectionReport({
      fromDate,
      toDate,
      paymentMethod,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('installments')
  @ApiOperation({ summary: 'تقرير خطط التقسيط' })
  @ApiQuery({ name: 'status', required: false })
  async getInstallmentReport(@Query('status') status?: string) {
    const report = await this.service.getInstallmentReport({ status });

    return {
      success: true,
      data: report,
    };
  }

  @Get('disconnections')
  @ApiOperation({ summary: 'تقرير الفصل والتوصيل' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'reason', required: false })
  async getDisconnectionReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('reason') reason?: string,
  ) {
    const report = await this.service.getDisconnectionReport({
      fromDate,
      toDate,
      reason,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('complaints')
  @ApiOperation({ summary: 'تقرير الشكاوى' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getComplaintReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    const report = await this.service.getComplaintReport({
      fromDate,
      toDate,
      status,
    });

    return {
      success: true,
      data: report,
    };
  }
}
