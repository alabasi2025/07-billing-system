import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum POSTransactionType {
  INVOICE_PAYMENT = 'invoice_payment',
  STS_RECHARGE = 'sts_recharge',
  SERVICE_FEE = 'service_fee',
}

export enum POSPaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
}

export class CreatePOSTransactionDto {
  @ApiProperty({ description: 'نوع المعاملة' })
  @IsEnum(POSTransactionType)
  transactionType: POSTransactionType;

  @ApiProperty({ description: 'معرف العميل' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'معرف الفاتورة (لدفع الفواتير)' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'معرف العداد (لشحن STS)' })
  @IsOptional()
  @IsUUID()
  meterId?: string;

  @ApiProperty({ description: 'المبلغ' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'طريقة الدفع' })
  @IsEnum(POSPaymentMethod)
  paymentMethod: POSPaymentMethod;

  @ApiPropertyOptional({ description: 'رقم المرجع' })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchCustomerDto {
  @ApiPropertyOptional({ description: 'رقم الحساب' })
  @IsOptional()
  @IsString()
  accountNo?: string;

  @ApiPropertyOptional({ description: 'رقم العداد' })
  @IsOptional()
  @IsString()
  meterNo?: string;

  @ApiPropertyOptional({ description: 'رقم الهوية' })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class POSSessionDto {
  @ApiProperty({ description: 'معرف الكاشير' })
  @IsString()
  cashierId: string;

  @ApiPropertyOptional({ description: 'رصيد الافتتاح' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;
}

export class CloseSessionDto {
  @ApiProperty({ description: 'رصيد الإغلاق' })
  @IsNumber()
  @Min(0)
  closingBalance: number;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}
