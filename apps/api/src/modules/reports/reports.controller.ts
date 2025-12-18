import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    const stats = await this.service.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('revenue')
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
}
