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
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto, TerminateContractDto } from './dto/contract.dto';

@Controller('api/v1/contracts')
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContractDto) {
    const contract = await this.service.create(dto);
    return {
      success: true,
      message: 'Contract created successfully',
      data: contract,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAll({
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

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const contract = await this.service.findOne(id);
    return {
      success: true,
      data: contract,
    };
  }

  @Get('number/:contractNo')
  async findByContractNo(@Param('contractNo') contractNo: string) {
    const contract = await this.service.findByContractNo(contractNo);
    return {
      success: true,
      data: contract,
    };
  }

  @Get('customer/:customerId/active')
  async getCustomerActiveContract(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const contract = await this.service.getCustomerActiveContract(customerId);
    return {
      success: true,
      data: contract,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractDto,
  ) {
    const contract = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Contract updated successfully',
      data: contract,
    };
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  async terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateContractDto,
  ) {
    const contract = await this.service.terminate(id, dto);
    return {
      success: true,
      message: 'Contract terminated successfully',
      data: contract,
    };
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const contract = await this.service.suspend(id, reason);
    return {
      success: true,
      message: 'Contract suspended successfully',
      data: contract,
    };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    const contract = await this.service.activate(id);
    return {
      success: true,
      message: 'Contract activated successfully',
      data: contract,
    };
  }
}
