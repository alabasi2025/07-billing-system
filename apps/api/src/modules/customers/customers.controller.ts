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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Controller('api/v1/customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.service.create(dto);
    return {
      success: true,
      message: 'Customer created successfully',
      data: customer,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      categoryId,
      status,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.service.findOne(id);
    return {
      success: true,
      data: customer,
    };
  }

  @Get('account/:accountNo')
  async findByAccountNo(@Param('accountNo') accountNo: string) {
    const customer = await this.service.findByAccountNo(accountNo);
    return {
      success: true,
      data: customer,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    };
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const customer = await this.service.suspend(id, reason);
    return {
      success: true,
      message: 'Customer suspended successfully',
      data: customer,
    };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.service.activate(id);
    return {
      success: true,
      message: 'Customer activated successfully',
      data: customer,
    };
  }

  @Get(':id/invoices')
  async getCustomerInvoices(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getCustomerInvoices(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id/payments')
  async getCustomerPayments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getCustomerPayments(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id/balance')
  async getCustomerBalance(@Param('id', ParseUUIDPipe) id: string) {
    const balance = await this.service.getCustomerBalance(id);
    return {
      success: true,
      data: balance,
    };
  }
}
