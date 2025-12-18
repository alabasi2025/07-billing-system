import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MeterStatus {
  ACTIVE = 'active',
  FAULTY = 'faulty',
  REPLACED = 'replaced',
  REMOVED = 'removed',
  IN_STOCK = 'in_stock',
}

export class CreateMeterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  meterNo: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsUUID()
  meterTypeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  installDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastReading?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  multiplier?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMeterDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  meterTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  installDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastReading?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  multiplier?: number;

  @IsOptional()
  @IsEnum(MeterStatus)
  status?: MeterStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InstallMeterDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsDateString()
  installDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  initialReading?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReplaceMeterDto {
  @IsUUID()
  newMeterId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  finalReading?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  initialReading?: number;

  @IsOptional()
  @IsDateString()
  replaceDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class MeterResponseDto {
  id: string;
  meterNo: string;
  customerId?: string;
  meterTypeId: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: Date;
  lastReadDate?: Date;
  lastReading: number;
  multiplier: number;
  status: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    accountNo: string;
    name: string;
  };
  meterType?: {
    id: string;
    code: string;
    name: string;
    isSmartMeter: boolean;
  };
}
