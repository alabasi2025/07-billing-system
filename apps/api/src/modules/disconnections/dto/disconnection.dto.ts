import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderType {
  DISCONNECTION = 'disconnection',
  RECONNECTION = 'reconnection',
}

export enum DisconnectionReason {
  NON_PAYMENT = 'non_payment',
  CUSTOMER_REQUEST = 'customer_request',
  VIOLATION = 'violation',
  MAINTENANCE = 'maintenance',
}

export enum OrderStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
}

export class CreateDisconnectionOrderDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  meterId?: string;

  @IsEnum(OrderType)
  orderType: OrderType;

  @IsEnum(DisconnectionReason)
  reason: DisconnectionReason;

  @IsOptional()
  @IsString()
  reasonDetails?: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reconnectionFee?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ExecuteOrderDto {
  @IsOptional()
  @IsUUID()
  executedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelOrderDto {
  @IsString()
  reason: string;
}

export class DisconnectionOrderResponseDto {
  id: string;
  orderNo: string;
  customerId: string;
  meterId?: string;
  orderType: string;
  reason: string;
  reasonDetails?: string;
  outstandingAmount?: number;
  scheduledDate: Date;
  executedDate?: Date;
  executedBy?: string;
  status: string;
  cancelReason?: string;
  reconnectionFee?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    accountNo: string;
    name: string;
  };
  meter?: {
    id: string;
    meterNo: string;
  };
}
