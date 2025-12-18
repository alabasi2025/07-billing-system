import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  RECONCILED = 'reconciled',
}

export enum TransactionType {
  INVOICE_PAYMENT = 'invoice_payment',
  ADVANCE_PAYMENT = 'advance_payment',
  DEPOSIT = 'deposit',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  CHECK = 'check',
  MIXED = 'mixed',
}

export class OpenSessionDto {
  @ApiProperty({ description: 'معرف نقطة البيع' })
  @IsUUID()
  terminalId: string;

  @ApiProperty({ description: 'معرف الكاشير' })
  @IsUUID()
  cashierId: string;

  @ApiProperty({ description: 'الرصيد الافتتاحي النقدي' })
  @IsNumber()
  openingCash: number;

  @ApiPropertyOptional({ description: 'ملاحظات الفتح' })
  @IsOptional()
  @IsString()
  openingNotes?: string;
}

export class CloseSessionDto {
  @ApiProperty({ description: 'الرصيد النقدي الفعلي عند الإغلاق' })
  @IsNumber()
  closingCash: number;

  @ApiPropertyOptional({ description: 'ملاحظات الإغلاق' })
  @IsOptional()
  @IsString()
  closingNotes?: string;
}

export class CashCountDto {
  @ApiPropertyOptional({ description: 'عدد فئة 500' })
  @IsOptional()
  @IsNumber()
  count500?: number;

  @ApiPropertyOptional({ description: 'عدد فئة 200' })
  @IsOptional()
  @IsNumber()
  count200?: number;

  @ApiPropertyOptional({ description: 'عدد فئة 100' })
  @IsOptional()
  @IsNumber()
  count100?: number;

  @ApiPropertyOptional({ description: 'عدد فئة 50' })
  @IsOptional()
  @IsNumber()
  count50?: number;

  @ApiPropertyOptional({ description: 'عدد فئة 20' })
  @IsOptional()
  @IsNumber()
  count20?: number;

  @ApiPropertyOptional({ description: 'عدد فئة 10' })
  @IsOptional()
  @IsNumber()
  count10?: number;

  @ApiPropertyOptional({ description: 'عدد فئة 5' })
  @IsOptional()
  @IsNumber()
  count5?: number;

  @ApiPropertyOptional({ description: 'عدد فئة 1' })
  @IsOptional()
  @IsNumber()
  count1?: number;
}

export class CreatePosTransactionDto {
  @ApiProperty({ description: 'معرف الجلسة' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'معرف العميل' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'معرف الفاتورة' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiProperty({ description: 'نوع المعاملة', enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({ description: 'المبلغ' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'طريقة الدفع', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'المبلغ النقدي' })
  @IsOptional()
  @IsNumber()
  cashAmount?: number;

  @ApiPropertyOptional({ description: 'مبلغ البطاقة' })
  @IsOptional()
  @IsNumber()
  cardAmount?: number;

  @ApiPropertyOptional({ description: 'آخر 4 أرقام من البطاقة' })
  @IsOptional()
  @IsString()
  cardLastFour?: string;

  @ApiPropertyOptional({ description: 'رمز الموافقة' })
  @IsOptional()
  @IsString()
  cardApprovalCode?: string;

  @ApiPropertyOptional({ description: 'المبلغ المستلم' })
  @IsOptional()
  @IsNumber()
  amountTendered?: number;
}

export class VoidTransactionDto {
  @ApiProperty({ description: 'سبب الإلغاء' })
  @IsString()
  voidReason: string;

  @ApiProperty({ description: 'معرف المستخدم الذي قام بالإلغاء' })
  @IsUUID()
  voidedBy: string;
}
