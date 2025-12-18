import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTariffDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @IsNumber()
  @Min(1)
  sliceOrder: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fromKwh: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  toKwh?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ratePerKwh: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedCharge?: number;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTariffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  sliceOrder?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fromKwh?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  toKwh?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ratePerKwh?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedCharge?: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TariffResponseDto {
  id: string;
  categoryId: string;
  name: string;
  nameEn?: string;
  sliceOrder: number;
  fromKwh: number;
  toKwh?: number;
  ratePerKwh: number;
  fixedCharge: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    code: string;
    name: string;
  };
}
