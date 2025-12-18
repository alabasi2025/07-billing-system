import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
  CANCELLED = 'cancelled',
}

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
}

export class CreatePaymentPlanDto {
  @ApiProperty({ description: 'معرف العميل' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'المبلغ الإجمالي' })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ description: 'الدفعة المقدمة' })
  @IsOptional()
  @IsNumber()
  downPayment?: number;

  @ApiProperty({ description: 'عدد الأقساط' })
  @IsNumber()
  numberOfInstallments: number;

  @ApiProperty({ description: 'تاريخ البداية' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'نسبة الفائدة' })
  @IsOptional()
  @IsNumber()
  interestRate?: number;

  @ApiPropertyOptional({ description: 'غرامة التأخير' })
  @IsOptional()
  @IsNumber()
  penaltyOnLate?: number;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'معرفات الديون المرتبطة' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  debtIds?: string[];
}

export class PayInstallmentDto {
  @ApiProperty({ description: 'المبلغ المدفوع' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'معرف الدفعة' })
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApprovePaymentPlanDto {
  @ApiProperty({ description: 'معرف المستخدم الموافق' })
  @IsUUID()
  approvedBy: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}
