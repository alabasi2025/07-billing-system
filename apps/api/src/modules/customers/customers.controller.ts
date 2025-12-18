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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFilterDto,
  ChangeCustomerStatusDto,
  CustomerResponseDto,
  CustomerListResponseDto,
} from './dto/customer.dto';

@ApiTags('العملاء - Customers')
@Controller('api/v1/customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إنشاء عميل جديد', description: 'إنشاء حساب عميل جديد في النظام' })
  @ApiResponse({ status: 201, description: 'تم إنشاء العميل بنجاح', type: CustomerResponseDto })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  @ApiResponse({ status: 404, description: 'تصنيف العميل غير موجود' })
  @ApiResponse({ status: 409, description: 'يوجد عميل مسجل بنفس رقم الهوية' })
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.service.create(dto);
    return {
      success: true,
      message: 'تم إنشاء العميل بنجاح',
      data: customer,
    };
  }

  @Get()
  @ApiOperation({ summary: 'جلب قائمة العملاء', description: 'جلب قائمة العملاء مع إمكانية البحث والفلترة والترقيم' })
  @ApiResponse({ status: 200, description: 'قائمة العملاء', type: CustomerListResponseDto })
  async findAll(@Query() filterDto: CustomerFilterDto) {
    const result = await this.service.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات العملاء', description: 'جلب إحصائيات شاملة عن العملاء' })
  @ApiResponse({ status: 200, description: 'إحصائيات العملاء' })
  async getStatistics() {
    const statistics = await this.service.getStatistics();
    return {
      success: true,
      data: statistics,
    };
  }

  @Get('account/:accountNo')
  @ApiOperation({ summary: 'جلب عميل برقم الحساب', description: 'جلب بيانات عميل باستخدام رقم الحساب' })
  @ApiParam({ name: 'accountNo', description: 'رقم حساب العميل' })
  @ApiResponse({ status: 200, description: 'بيانات العميل', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  async findByAccountNo(@Param('accountNo') accountNo: string) {
    const customer = await this.service.findByAccountNo(accountNo);
    return {
      success: true,
      data: customer,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب عميل بالمعرف', description: 'جلب بيانات عميل باستخدام المعرف الفريد' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiResponse({ status: 200, description: 'بيانات العميل', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.service.findOne(id);
    return {
      success: true,
      data: customer,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات عميل', description: 'تحديث بيانات عميل موجود' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiResponse({ status: 200, description: 'تم تحديث العميل بنجاح', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  @ApiResponse({ status: 409, description: 'يوجد عميل آخر مسجل بنفس رقم الهوية' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.service.update(id, dto);
    return {
      success: true,
      message: 'تم تحديث العميل بنجاح',
      data: customer,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغيير حالة العميل', description: 'تغيير حالة العميل (تفعيل، إيقاف، فصل، إغلاق)' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiResponse({ status: 200, description: 'تم تغيير الحالة بنجاح', type: CustomerResponseDto })
  @ApiResponse({ status: 400, description: 'لا يمكن تغيير الحالة' })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeCustomerStatusDto,
  ) {
    const customer = await this.service.changeStatus(id, changeStatusDto);
    return {
      success: true,
      message: 'تم تغيير حالة العميل بنجاح',
      data: customer,
    };
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إيقاف عميل', description: 'إيقاف حساب عميل مع ذكر السبب' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiResponse({ status: 200, description: 'تم إيقاف العميل بنجاح', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  @ApiResponse({ status: 409, description: 'العميل موقوف بالفعل' })
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const customer = await this.service.suspend(id, reason);
    return {
      success: true,
      message: 'تم إيقاف العميل بنجاح',
      data: customer,
    };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تفعيل عميل', description: 'إعادة تفعيل حساب عميل موقوف' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiResponse({ status: 200, description: 'تم تفعيل العميل بنجاح', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  @ApiResponse({ status: 409, description: 'العميل نشط بالفعل' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.service.activate(id);
    return {
      success: true,
      message: 'تم تفعيل العميل بنجاح',
      data: customer,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف عميل', description: 'إغلاق حساب عميل (لا يتم الحذف الفعلي)' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiResponse({ status: 200, description: 'تم إغلاق حساب العميل بنجاح' })
  @ApiResponse({ status: 400, description: 'لا يمكن حذف العميل لوجود فواتير أو مدفوعات' })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'فواتير العميل', description: 'جلب قائمة فواتير العميل' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiQuery({ name: 'page', required: false, description: 'رقم الصفحة' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد العناصر في الصفحة' })
  @ApiResponse({ status: 200, description: 'قائمة الفواتير' })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
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
  @ApiOperation({ summary: 'مدفوعات العميل', description: 'جلب قائمة مدفوعات العميل' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiQuery({ name: 'page', required: false, description: 'رقم الصفحة' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد العناصر في الصفحة' })
  @ApiResponse({ status: 200, description: 'قائمة المدفوعات' })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
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
  @ApiOperation({ summary: 'رصيد العميل', description: 'جلب رصيد العميل الحالي' })
  @ApiParam({ name: 'id', description: 'معرف العميل (UUID)' })
  @ApiResponse({ status: 200, description: 'رصيد العميل' })
  @ApiResponse({ status: 404, description: 'العميل غير موجود' })
  async getCustomerBalance(@Param('id', ParseUUIDPipe) id: string) {
    const balance = await this.service.getCustomerBalance(id);
    return {
      success: true,
      data: balance,
    };
  }
}
