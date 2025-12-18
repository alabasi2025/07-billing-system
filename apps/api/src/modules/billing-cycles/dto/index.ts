import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CycleType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export class CreateBillingCycleDto {
  @ApiProperty({ description: 'رمز الدورة' })
  @IsString()
  cycleCode: string;

  @ApiProperty({ description: 'اسم الدورة' })
  @IsString()
  cycleName: string;

  @ApiProperty({ description: 'نوع الدورة', enum: CycleType })
  @IsEnum(CycleType)
  cycleType: CycleType;

  @ApiProperty({ description: 'يوم بداية الدورة (1-28)' })
  @IsNumber()
  startDay: number;

  @ApiProperty({ description: 'يوم نهاية الدورة (1-28)' })
  @IsNumber()
  endDay: number;

  @ApiProperty({ description: 'يوم استحقاق الدفع (1-28)' })
  @IsNumber()
  dueDay: number;

  @ApiPropertyOptional({ description: 'فترة السماح بالأيام' })
  @IsOptional()
  @IsNumber()
  gracePeriod?: number;
}

export class UpdateBillingCycleDto {
  @ApiPropertyOptional({ description: 'اسم الدورة' })
  @IsOptional()
  @IsString()
  cycleName?: string;

  @ApiPropertyOptional({ description: 'يوم بداية الدورة' })
  @IsOptional()
  @IsNumber()
  startDay?: number;

  @ApiPropertyOptional({ description: 'يوم نهاية الدورة' })
  @IsOptional()
  @IsNumber()
  endDay?: number;

  @ApiPropertyOptional({ description: 'يوم استحقاق الدفع' })
  @IsOptional()
  @IsNumber()
  dueDay?: number;

  @ApiPropertyOptional({ description: 'فترة السماح بالأيام' })
  @IsOptional()
  @IsNumber()
  gracePeriod?: number;

  @ApiPropertyOptional({ description: 'نشط' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
