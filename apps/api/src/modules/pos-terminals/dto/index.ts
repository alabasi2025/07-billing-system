import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TerminalStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum PrinterType {
  THERMAL = 'thermal',
  LASER = 'laser',
  NONE = 'none',
}

export class CreatePosTerminalDto {
  @ApiProperty({ description: 'رمز نقطة البيع' })
  @IsString()
  terminalCode: string;

  @ApiProperty({ description: 'اسم نقطة البيع' })
  @IsString()
  terminalName: string;

  @ApiPropertyOptional({ description: 'معرف الموقع' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'اسم الموقع' })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ description: 'معرف المستخدم المسؤول' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({ description: 'نوع الطابعة', enum: PrinterType })
  @IsOptional()
  @IsEnum(PrinterType)
  printerType?: PrinterType;

  @ApiPropertyOptional({ description: 'عنوان IP للطابعة' })
  @IsOptional()
  @IsString()
  printerIp?: string;

  @ApiPropertyOptional({ description: 'الرصيد الافتتاحي' })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;
}

export class UpdatePosTerminalDto {
  @ApiPropertyOptional({ description: 'اسم نقطة البيع' })
  @IsOptional()
  @IsString()
  terminalName?: string;

  @ApiPropertyOptional({ description: 'اسم الموقع' })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ description: 'الحالة', enum: TerminalStatus })
  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;

  @ApiPropertyOptional({ description: 'معرف المستخدم المسؤول' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({ description: 'نوع الطابعة', enum: PrinterType })
  @IsOptional()
  @IsEnum(PrinterType)
  printerType?: PrinterType;

  @ApiPropertyOptional({ description: 'عنوان IP للطابعة' })
  @IsOptional()
  @IsString()
  printerIp?: string;
}
