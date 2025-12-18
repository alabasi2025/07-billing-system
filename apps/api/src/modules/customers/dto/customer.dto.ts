import {
  IsString,
  IsOptional,
  IsUUID,
  IsEmail,
  IsNumber,
  IsDateString,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CustomerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DISCONNECTED = 'disconnected',
  CLOSED = 'closed',
}

export enum IdType {
  NATIONAL_ID = 'national_id',
  IQAMA = 'iqama',
  CR = 'cr',
}

export enum PaymentTerms {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(IdType)
  idType: IdType;

  @IsString()
  @MaxLength(50)
  idNumber: string;

  @IsString()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsUUID()
  transformerId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  creditLimit?: number;

  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsDateString()
  connectionDate?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(IdType)
  idType?: IdType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  idNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsUUID()
  transformerId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  creditLimit?: number;

  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsDateString()
  connectionDate?: string;
}

export class CustomerResponseDto {
  id: string;
  accountNo: string;
  name: string;
  nameEn?: string;
  categoryId: string;
  idType: string;
  idNumber: string;
  phone: string;
  mobile?: string;
  email?: string;
  address: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  stationId?: string;
  transformerId?: string;
  creditLimit: number;
  paymentTerms: string;
  billingCycle: string;
  status: string;
  connectionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    code: string;
    name: string;
  };
  _count?: {
    contracts: number;
    meters: number;
    invoices: number;
    payments: number;
  };
}
