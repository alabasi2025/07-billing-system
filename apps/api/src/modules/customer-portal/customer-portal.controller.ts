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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { CreateServiceRequestDto, UpdateServiceRequestDto } from './dto/customer-portal.dto';

@ApiTags('بوابة العملاء')
@Controller('api/v1/portal')
export class CustomerPortalController {
  constructor(private readonly service: CustomerPortalService) {}

  // ==================== بيانات العميل ====================

  @Get('customers/:customerId/profile')
  async getProfile(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const profile = await this.service.getCustomerProfile(customerId);
    return {
      success: true,
      data: profile,
    };
  }

  @Get('customers/:customerId/meters')
  async getMeters(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const meters = await this.service.getCustomerMeters(customerId);
    return {
      success: true,
      data: meters,
    };
  }

  @Get('customers/:customerId/balance')
  async getBalance(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const balance = await this.service.getCustomerBalance(customerId);
    return {
      success: true,
      data: balance,
    };
  }

  // ==================== الفواتير والمدفوعات ====================

  @Get('customers/:customerId/invoices')
  async getInvoices(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getCustomerInvoices(
      customerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('customers/:customerId/payments')
  async getPayments(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getCustomerPayments(
      customerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      success: true,
      ...result,
    };
  }

  // ==================== الاستهلاك ====================

  @Get('customers/:customerId/consumption')
  async getConsumption(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('meterId') meterId?: string,
    @Query('months') months?: string,
  ) {
    const data = await this.service.getConsumptionHistory(
      customerId,
      meterId,
      months ? parseInt(months, 10) : 12,
    );
    return {
      success: true,
      data,
    };
  }

  // ==================== طلبات الخدمة ====================

  @Post('service-requests')
  @HttpCode(HttpStatus.CREATED)
  async createServiceRequest(@Body() dto: CreateServiceRequestDto) {
    const request = await this.service.createServiceRequest(dto);
    return {
      success: true,
      message: 'Service request created successfully',
      data: request,
    };
  }

  @Get('customers/:customerId/service-requests')
  async getServiceRequests(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getCustomerServiceRequests(
      customerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('service-requests/statistics')
  async getServiceRequestsStatistics() {
    const result = await this.service.getServiceRequestsStatistics();
    return {
      success: true,
      data: result,
    };
  }

  @Get('service-requests/:id')
  async getServiceRequest(@Param('id', ParseUUIDPipe) id: string) {
    const request = await this.service.getServiceRequest(id);
    return {
      success: true,
      data: request,
    };
  }

  @Put('service-requests/:id')
  async updateServiceRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceRequestDto,
  ) {
    const request = await this.service.updateServiceRequest(id, dto);
    return {
      success: true,
      message: 'Service request updated successfully',
      data: request,
    };
  }

  @Post('service-requests/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelServiceRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const request = await this.service.cancelServiceRequest(id, reason);
    return {
      success: true,
      message: 'Service request cancelled successfully',
      data: request,
    };
  }

  // ==================== الشكاوى ====================

  @Get('customers/:customerId/complaints')
  async getComplaints(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getCustomerComplaints(
      customerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      success: true,
      ...result,
    };
  }
}
