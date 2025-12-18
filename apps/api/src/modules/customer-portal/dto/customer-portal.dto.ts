import {
  IsUUID,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum ServiceRequestType {
  NEW_CONNECTION = 'new_connection',
  METER_REPLACEMENT = 'meter_replacement',
  METER_RELOCATION = 'meter_relocation',
  LOAD_INCREASE = 'load_increase',
  LOAD_DECREASE = 'load_decrease',
  NAME_CHANGE = 'name_change',
  DISCONNECTION = 'disconnection',
  RECONNECTION = 'reconnection',
  OTHER = 'other',
}

export enum ServiceRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export class CustomerLoginDto {
  @IsString()
  accountNo: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CustomerRegisterDto {
  @IsString()
  accountNo: string;

  @IsString()
  nationalId: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateProfileDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class CreateServiceRequestDto {
  @IsUUID()
  customerId: string;

  @IsEnum(ServiceRequestType)
  requestType: ServiceRequestType;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsString()
  @IsOptional()
  attachments?: string;

  @IsString()
  @IsOptional()
  preferredDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateServiceRequestDto {
  @IsEnum(ServiceRequestStatus)
  @IsOptional()
  status?: ServiceRequestStatus;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
