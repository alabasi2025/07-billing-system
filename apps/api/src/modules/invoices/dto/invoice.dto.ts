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

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export class GenerateInvoiceDto {
  @IsUUID()
  customerId: string;

  @IsString()
  @MaxLength(7)
  billingPeriod: string; // YYYY-MM

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  otherCharges?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateBulkInvoicesDto {
  @IsString()
  @MaxLength(7)
  billingPeriod: string; // YYYY-MM

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CancelInvoiceDto {
  @IsString()
  reason: string;
}

export class RebillInvoiceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  correctedReading?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  otherCharges?: number;

  @IsString()
  reason: string;
}

export class InvoiceResponseDto {
  id: string;
  invoiceNo: string;
  customerId: string;
  billingPeriod: string;
  fromDate: Date;
  toDate: Date;
  previousReading: number;
  currentReading: number;
  consumption: number;
  consumptionAmount: number;
  fixedCharges: number;
  otherCharges: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  dueDate: Date;
  status: string;
  paidAmount: number;
  balance: number;
  issuedAt: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    accountNo: string;
    name: string;
    category?: {
      id: string;
      code: string;
      name: string;
    };
  };
  items?: Array<{
    id: string;
    description: string;
    itemType: string;
    fromKwh?: number;
    toKwh?: number;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}
