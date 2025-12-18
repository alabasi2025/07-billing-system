import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class RevenueReportQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'month' | 'category';
}

export class CustomerReportQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ConsumptionReportQueryDto {
  @IsOptional()
  @IsString()
  billingPeriod?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class OutstandingReportQueryDto {
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
