import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'cash',
  BANK = 'bank',
  CARD = 'card',
  ONLINE = 'online',
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export class CreatePaymentDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNo?: string;

  @IsOptional()
  @IsUUID()
  bankId?: string;

  @IsOptional()
  @IsUUID()
  receivedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelPaymentDto {
  @IsString()
  reason: string;
}

export class PaymentResponseDto {
  id: string;
  paymentNo: string;
  customerId: string;
  invoiceId?: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  bankId?: string;
  status: string;
  receivedBy?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    accountNo: string;
    name: string;
  };
  invoice?: {
    id: string;
    invoiceNo: string;
    totalAmount: number;
    balance: number;
  };
}
