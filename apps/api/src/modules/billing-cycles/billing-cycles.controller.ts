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
import { BillingCyclesService } from './billing-cycles.service';
import { CreateBillingCycleDto, UpdateBillingCycleDto } from './dto';

@ApiTags('Billing Cycles - دورات الفوترة')
@Controller('api/v1/billing-cycles')
export class BillingCyclesController {
  constructor(private readonly service: BillingCyclesService) {}

  @Get()
  @ApiOperation({ summary: 'جلب جميع دورات الفوترة' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'جلب دورات الفوترة النشطة' })
  getActiveCycles() {
    return this.service.getActiveCycles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب دورة فوترة محددة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء دورة فوترة جديدة' })
  create(@Body() dto: CreateBillingCycleDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث دورة فوترة' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBillingCycleDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف دورة فوترة' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
