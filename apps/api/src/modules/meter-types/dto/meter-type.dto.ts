import { IsString, IsOptional, IsBoolean, IsInt, MaxLength, MinLength, Min, Max } from 'class-validator';

export class CreateMeterTypeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  phases?: number;

  @IsOptional()
  @IsBoolean()
  isSmartMeter?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMeterTypeDto {
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
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  phases?: number;

  @IsOptional()
  @IsBoolean()
  isSmartMeter?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MeterTypeResponseDto {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  phases: number;
  isSmartMeter: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    meters: number;
  };
}
