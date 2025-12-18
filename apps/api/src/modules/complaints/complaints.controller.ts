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
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto, ResolveComplaintDto } from './dto/complaint.dto';

@ApiTags('الشكاوى')
@Controller('api/v1/complaints')
export class ComplaintsController {
  constructor(private readonly service: ComplaintsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateComplaintDto) {
    const complaint = await this.service.create(dto);
    return {
      success: true,
      message: 'Complaint created successfully',
      data: complaint,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const result = await this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      customerId,
      type,
      status,
      priority,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('open')
  async getOpenComplaints() {
    const complaints = await this.service.getOpenComplaints();
    return {
      success: true,
      data: complaints,
      total: complaints.length,
    };
  }

  @Get('stats')
  async getComplaintStats() {
    const stats = await this.service.getComplaintStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const complaint = await this.service.findOne(id);
    return {
      success: true,
      data: complaint,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    const complaint = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Complaint updated successfully',
      data: complaint,
    };
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveComplaintDto,
  ) {
    const complaint = await this.service.resolve(id, dto);
    return {
      success: true,
      message: 'Complaint resolved successfully',
      data: complaint,
    };
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  async close(@Param('id', ParseUUIDPipe) id: string) {
    const complaint = await this.service.close(id);
    return {
      success: true,
      message: 'Complaint closed successfully',
      data: complaint,
    };
  }
}
