import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ReadingType {
  NORMAL = 'normal',
  ESTIMATED = 'estimated',
  FINAL = 'final',
  INITIAL = 'initial',
}

export class CreateMeterReadingDto {
  @IsUUID()
  meterId: string;

  @IsDateString()
  readingDate: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reading: number;

  @IsOptional()
  @IsEnum(ReadingType)
  readingType?: ReadingType;

  @IsOptional()
  @IsUUID()
  readerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkMeterReadingDto {
  @IsUUID()
  meterId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reading: number;
}

export class BulkUploadReadingsDto {
  @IsDateString()
  readingDate: string;

  @IsString()
  @MaxLength(7)
  billingPeriod: string; // YYYY-MM

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMeterReadingDto)
  readings: BulkMeterReadingDto[];

  @IsOptional()
  @IsUUID()
  readerId?: string;
}

export class MeterReadingResponseDto {
  id: string;
  meterId: string;
  readingDate: Date;
  reading: number;
  previousReading: number;
  consumption: number;
  readingType: string;
  readerId?: string;
  imageUrl?: string;
  notes?: string;
  billingPeriod: string;
  isProcessed: boolean;
  createdAt: Date;
  meter?: {
    id: string;
    meterNo: string;
    customer?: {
      id: string;
      accountNo: string;
      name: string;
    };
  };
}
