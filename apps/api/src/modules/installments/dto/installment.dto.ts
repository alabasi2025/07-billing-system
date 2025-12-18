import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InstallmentPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFAULTED = 'defaulted',
}

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export class CreateInstallmentPlanDto {
  @IsUUID()
  customerId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  downPayment?: number;

  @IsNumber()
  @Min(2)
  @Max(24)
  @Type(() => Number)
  numberOfInstallments: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  invoiceIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayInstallmentDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelInstallmentPlanDto {
  @IsString()
  reason: string;
}

export class InstallmentPlanResponseDto {
  id: string;
  planNo: string;
  customerId: string;
  totalAmount: number;
  downPayment: number;
  remainingAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    accountNo: string;
    name: string;
  };
  installments?: InstallmentResponseDto[];
}

export class InstallmentResponseDto {
  id: string;
  planId: string;
  installmentNo: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  paidDate?: Date;
  status: string;
  paymentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
