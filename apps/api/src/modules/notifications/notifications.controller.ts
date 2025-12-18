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
import { NotificationsService } from './notifications.service';
import { CreateNotificationTemplateDto, UpdateNotificationTemplateDto, SendNotificationDto } from './dto';

@ApiTags('Notifications - الإشعارات')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // ==================== قوالب الإشعارات ====================

  @Get('templates')
  @ApiOperation({ summary: 'جلب جميع قوالب الإشعارات' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'templateType', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  findAllTemplates(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('templateType') templateType?: string,
    @Query('eventType') eventType?: string,
  ) {
    return this.service.findAllTemplates({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      templateType,
      eventType,
    });
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'جلب قالب إشعار محدد' })
  findOneTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneTemplate(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'إنشاء قالب إشعار جديد' })
  createTemplate(@Body() dto: CreateNotificationTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'تحديث قالب إشعار' })
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.service.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'حذف قالب إشعار' })
  deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteTemplate(id);
  }

  // ==================== الإشعارات ====================

  @Get()
  @ApiOperation({ summary: 'جلب جميع الإشعارات' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAllNotifications(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAllNotifications({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      customerId,
      status,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'إحصائيات الإشعارات' })
  getStatistics() {
    return this.service.getStatistics();
  }

  @Post('send')
  @ApiOperation({ summary: 'إرسال إشعار' })
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.service.sendNotification(dto);
  }

  @Post('retry-failed')
  @ApiOperation({ summary: 'إعادة محاولة الإشعارات الفاشلة' })
  retryFailedNotifications() {
    return this.service.retryFailedNotifications();
  }
}
