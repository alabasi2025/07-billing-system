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
import { PrepaidService } from './prepaid.service';
import { CreatePrepaidTokenDto, VerifyTokenDto } from './dto/prepaid.dto';

@ApiTags('الدفع المسبق')
@Controller('api/v1/prepaid')
export class PrepaidController {
  constructor(private readonly service: PrepaidService) {}

  @Post('tokens')
  @HttpCode(HttpStatus.CREATED)
  async createToken(@Body() dto: CreatePrepaidTokenDto) {
    const token = await this.service.createToken(dto);
    return {
      success: true,
      message: 'Prepaid token created successfully',
      data: token,
    };
  }

  @Post('tokens/verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() dto: VerifyTokenDto) {
    const result = await this.service.verifyToken(dto);
    return {
      success: true,
      ...result,
    };
  }

  @Post('tokens/:id/use')
  @HttpCode(HttpStatus.OK)
  async useToken(@Param('id', ParseUUIDPipe) id: string) {
    const token = await this.service.useToken(id);
    return {
      success: true,
      message: 'Token used successfully',
      data: token,
    };
  }

  @Post('tokens/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelToken(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const token = await this.service.cancelToken(id, reason);
    return {
      success: true,
      message: 'Token cancelled successfully',
      data: token,
    };
  }

  @Get('tokens')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('meterId') meterId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      meterId,
      customerId,
      status: status as any,
      fromDate,
      toDate,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('tokens/statistics')
  async getStatistics() {
    const result = await this.service.getStatistics();
    return {
      success: true,
      data: result,
    };
  }

  @Get('tokens/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const token = await this.service.findOne(id);
    return {
      success: true,
      data: token,
    };
  }

  @Get('customers/:customerId/balance')
  async getCustomerBalance(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const balance = await this.service.getCustomerBalance(customerId);
    return {
      success: true,
      data: balance,
    };
  }
}
