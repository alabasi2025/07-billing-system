import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum EventType {
  INVOICE_CREATED = 'invoice_created',
  PAYMENT_RECEIVED = 'payment_received',
  DUE_REMINDER = 'due_reminder',
  OVERDUE_NOTICE = 'overdue_notice',
  DISCONNECTION_WARNING = 'disconnection_warning',
  RECONNECTION_NOTICE = 'reconnection_notice',
  PREPAID_LOW_BALANCE = 'prepaid_low_balance',
  PREPAID_RECHARGE = 'prepaid_recharge',
}

export class CreateNotificationTemplateDto {
  @ApiProperty({ description: 'رمز القالب' })
  @IsString()
  templateCode: string;

  @ApiProperty({ description: 'اسم القالب' })
  @IsString()
  templateName: string;

  @ApiProperty({ description: 'نوع الإشعار', enum: NotificationType })
  @IsEnum(NotificationType)
  templateType: NotificationType;

  @ApiProperty({ description: 'نوع الحدث', enum: EventType })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiPropertyOptional({ description: 'عنوان الإشعار (للبريد الإلكتروني)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'نص القالب' })
  @IsString()
  bodyTemplate: string;

  @ApiPropertyOptional({ description: 'المتغيرات المتاحة (JSON)' })
  @IsOptional()
  @IsString()
  variables?: string;
}

export class UpdateNotificationTemplateDto {
  @ApiPropertyOptional({ description: 'اسم القالب' })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiPropertyOptional({ description: 'عنوان الإشعار' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'نص القالب' })
  @IsOptional()
  @IsString()
  bodyTemplate?: string;

  @ApiPropertyOptional({ description: 'المتغيرات المتاحة' })
  @IsOptional()
  @IsString()
  variables?: string;

  @ApiPropertyOptional({ description: 'نشط' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SendNotificationDto {
  @ApiProperty({ description: 'معرف القالب' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'معرف العميل' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'المستلم (رقم الهاتف أو البريد)' })
  @IsString()
  recipient: string;

  @ApiPropertyOptional({ description: 'البيانات لاستبدال المتغيرات (JSON)' })
  @IsOptional()
  @IsString()
  data?: string;
}

export class BulkSendNotificationDto {
  @ApiProperty({ description: 'معرف القالب' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'معرفات العملاء' })
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];
}
