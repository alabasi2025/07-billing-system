import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DebtType {
  INVOICE = 'invoice',
  PENALTY = 'penalty',
  RECONNECTION = 'reconnection',
  OTHER = 'other',
}

export enum DebtStatus {
  OUTSTANDING = 'outstanding',
  PARTIAL = 'partial',
  PAID = 'paid',
  WRITTEN_OFF = 'written_off',
  DISPUTED = 'disputed',
}

export class CreateDebtDto {
  @ApiProperty({ description: 'معرف العميل' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'نوع الدين', enum: DebtType })
  @IsEnum(DebtType)
  debtType: DebtType;

  @ApiPropertyOptional({ description: 'معرف المرجع (الفاتورة مثلاً)' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ description: 'المبلغ الأصلي' })
  @IsNumber()
  originalAmount: number;

  @ApiPropertyOptional({ description: 'تاريخ الاستحقاق' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'مبلغ الغرامة' })
  @IsOptional()
  @IsNumber()
  penaltyAmount?: number;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDebtDto {
  @ApiPropertyOptional({ description: 'الحالة', enum: DebtStatus })
  @IsOptional()
  @IsEnum(DebtStatus)
  status?: DebtStatus;

  @ApiPropertyOptional({ description: 'المبلغ المدفوع' })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'مبلغ الغرامة' })
  @IsOptional()
  @IsNumber()
  penaltyAmount?: number;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayDebtDto {
  @ApiProperty({ description: 'المبلغ المدفوع' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'رقم المرجع' })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}
