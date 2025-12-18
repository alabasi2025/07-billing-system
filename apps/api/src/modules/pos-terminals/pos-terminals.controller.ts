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
import { PosTerminalsService } from './pos-terminals.service';
import { CreatePosTerminalDto, UpdatePosTerminalDto } from './dto';

@ApiTags('POS Terminals - نقاط البيع')
@Controller('api/v1/pos-terminals')
export class PosTerminalsController {
  constructor(private readonly service: PosTerminalsService) {}

  @Get()
  @ApiOperation({ summary: 'جلب جميع نقاط البيع' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      status,
      search,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات نقاط البيع' })
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب نقطة بيع محددة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء نقطة بيع جديدة' })
  create(@Body() dto: CreatePosTerminalDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث نقطة بيع' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosTerminalDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف نقطة بيع' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
