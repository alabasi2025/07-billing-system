import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DebtsService } from './debts.service';
import { CreateDebtDto, UpdateDebtDto, PayDebtDto } from './dto';

@ApiTags('Debts - الديون')
@Controller('api/v1/debts')
export class DebtsController {
  constructor(private readonly service: DebtsService) {}

  @Get()
  @ApiOperation({ summary: 'جلب جميع الديون' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'debtType', required: false, type: String })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('debtType') debtType?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      customerId,
      status,
      debtType,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات الديون' })
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get('aging-report')
  @ApiOperation({ summary: 'تقرير أعمار الذمم المدينة' })
  getAgingReport() {
    return this.service.getAgingReport();
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'ديون عميل محدد' })
  findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.service.findByCustomer(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب دين محدد' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء دين جديد' })
  create(@Body() dto: CreateDebtDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث دين' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDebtDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'سداد دين' })
  payDebt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayDebtDto,
  ) {
    return this.service.payDebt(id, dto);
  }

  @Post(':id/write-off')
  @ApiOperation({ summary: 'شطب دين' })
  writeOff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.service.writeOff(id, reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف دين' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
