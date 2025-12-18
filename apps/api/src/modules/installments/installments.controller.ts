import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InstallmentsService } from './installments.service';
import { CreateInstallmentPlanDto, PayInstallmentDto, CancelInstallmentPlanDto } from './dto/installment.dto';

@Controller('api/v1/installments')
export class InstallmentsController {
  constructor(private readonly service: InstallmentsService) {}

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() dto: CreateInstallmentPlanDto) {
    const plan = await this.service.createPlan(dto);
    return {
      success: true,
      message: 'Installment plan created successfully',
      data: plan,
    };
  }

  @Get('plans')
  async findAllPlans(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAllPlans({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      customerId,
      status,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('plans/statistics')
  async getStatistics() {
    const result = await this.service.getStatistics();
    return {
      success: true,
      data: result,
    };
  }

  @Get('plans/:id')
  async findOnePlan(@Param('id', ParseUUIDPipe) id: string) {
    const plan = await this.service.findOnePlan(id);
    return {
      success: true,
      data: plan,
    };
  }

  @Post('plans/:id/installments/:installmentNo/pay')
  @HttpCode(HttpStatus.OK)
  async payInstallment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('installmentNo', ParseIntPipe) installmentNo: number,
    @Body() dto: PayInstallmentDto,
  ) {
    const plan = await this.service.payInstallment(id, installmentNo, dto);
    return {
      success: true,
      message: `Installment ${installmentNo} paid successfully`,
      data: plan,
    };
  }

  @Post('plans/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInstallmentPlanDto,
  ) {
    const plan = await this.service.cancelPlan(id, dto);
    return {
      success: true,
      message: 'Installment plan cancelled successfully',
      data: plan,
    };
  }

  @Post('check-overdue')
  @HttpCode(HttpStatus.OK)
  async checkOverdueInstallments() {
    const result = await this.service.checkOverdueInstallments();
    return {
      success: true,
      message: `Updated ${result.updated} overdue installments`,
      data: result,
    };
  }
}
