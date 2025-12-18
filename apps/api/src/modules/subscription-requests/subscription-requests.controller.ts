import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SubscriptionRequestsService } from './subscription-requests.service';
import {
  CreateSubscriptionRequestDto,
  UpdateSubscriptionRequestDto,
  ApproveRequestDto,
  RejectRequestDto,
  AssignTechnicianDto,
  RecordPaymentDto,
  CompleteInstallationDto,
  SubscriptionRequestFilterDto,
} from './dto/subscription-request.dto';

@ApiTags('طلبات الاشتراك')
@Controller('api/v1/subscription-requests')
export class SubscriptionRequestsController {
  constructor(private readonly service: SubscriptionRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء طلب اشتراك جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الطلب بنجاح' })
  async create(@Body() dto: CreateSubscriptionRequestDto) {
    const data = await this.service.create(dto);
    return {
      success: true,
      message: 'تم إنشاء طلب الاشتراك بنجاح',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة طلبات الاشتراك' })
  @ApiResponse({ status: 200, description: 'قائمة الطلبات' })
  async findAll(@Query() filter: SubscriptionRequestFilterDto) {
    const result = await this.service.findAll(filter);
    return {
      success: true,
      ...result,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات طلبات الاشتراك' })
  @ApiResponse({ status: 200, description: 'الإحصائيات' })
  async getStatistics() {
    const data = await this.service.getStatistics();
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على تفاصيل طلب اشتراك' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تفاصيل الطلب' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.findOne(id);
    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث طلب اشتراك' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تم التحديث بنجاح' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionRequestDto,
  ) {
    const data = await this.service.update(id, dto);
    return {
      success: true,
      message: 'تم تحديث الطلب بنجاح',
      data,
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'الموافقة على طلب اشتراك' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تمت الموافقة بنجاح' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveRequestDto,
  ) {
    // TODO: الحصول على معرف المستخدم من الجلسة
    const approvedBy = '00000000-0000-0000-0000-000000000000';
    const data = await this.service.approve(id, dto, approvedBy);
    return {
      success: true,
      message: 'تمت الموافقة على الطلب بنجاح',
      data,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'رفض طلب اشتراك' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تم الرفض بنجاح' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectRequestDto,
  ) {
    const data = await this.service.reject(id, dto);
    return {
      success: true,
      message: 'تم رفض الطلب',
      data,
    };
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'تسجيل دفعة لطلب اشتراك' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدفعة بنجاح' })
  async recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    const data = await this.service.recordPayment(id, dto);
    return {
      success: true,
      message: 'تم تسجيل الدفعة بنجاح',
      data,
    };
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'تعيين فني للتركيب' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تم التعيين بنجاح' })
  async assignTechnician(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTechnicianDto,
  ) {
    const data = await this.service.assignTechnician(id, dto);
    return {
      success: true,
      message: 'تم تعيين الفني بنجاح',
      data,
    };
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'بدء التركيب' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تم بدء التركيب' })
  async startInstallation(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.startInstallation(id);
    return {
      success: true,
      message: 'تم بدء التركيب',
      data,
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'إكمال التركيب وإنشاء العميل' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تم إكمال التركيب بنجاح' })
  async completeInstallation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteInstallationDto,
  ) {
    const data = await this.service.completeInstallation(id, dto);
    return {
      success: true,
      message: 'تم إكمال التركيب وإنشاء العميل بنجاح',
      data,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'إلغاء طلب اشتراك' })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  @ApiResponse({ status: 200, description: 'تم الإلغاء بنجاح' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    const data = await this.service.cancel(id, reason);
    return {
      success: true,
      message: 'تم إلغاء الطلب',
      data,
    };
  }
}
