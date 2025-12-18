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
import { DisconnectionsService } from './disconnections.service';
import { CreateDisconnectionOrderDto, ExecuteOrderDto, CancelOrderDto } from './dto/disconnection.dto';

@ApiTags('الفصل والتوصيل')
@Controller('api/v1/disconnections')
export class DisconnectionsController {
  constructor(private readonly service: DisconnectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDisconnectionOrderDto) {
    const order = await this.service.create(dto);
    return {
      success: true,
      message: 'Disconnection order created successfully',
      data: order,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('orderType') orderType?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      customerId,
      orderType,
      status,
      fromDate,
      toDate,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('statistics')
  async getStatistics() {
    const result = await this.service.getStatistics();
    return {
      success: true,
      data: result,
    };
  }

  @Get('candidates')
  async getCustomersForDisconnection(
    @Query('minOverdueDays') minOverdueDays?: string,
  ) {
    const result = await this.service.getCustomersForDisconnection(
      minOverdueDays ? parseInt(minOverdueDays, 10) : 30
    );
    return {
      success: true,
      data: result,
      total: result.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.service.findOne(id);
    return {
      success: true,
      data: order,
    };
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteOrderDto,
  ) {
    const order = await this.service.execute(id, dto);
    return {
      success: true,
      message: 'Order executed successfully',
      data: order,
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    const order = await this.service.cancel(id, dto);
    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }
}
