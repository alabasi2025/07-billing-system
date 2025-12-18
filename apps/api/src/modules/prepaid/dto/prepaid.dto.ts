import {
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  IsPositive,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum TokenStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export class CreatePrepaidTokenDto {
  @IsUUID()
  meterId: string;

  @IsNumber()
  @IsPositive()
  @Min(10)
  @Max(100000)
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RechargeAccountDto {
  @IsUUID()
  customerId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class VerifyTokenDto {
  @IsString()
  token: string;

  @IsUUID()
  @IsOptional()
  meterId?: string;
}

export class PrepaidFilterDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsUUID()
  meterId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsEnum(TokenStatus)
  status?: TokenStatus;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;
}
