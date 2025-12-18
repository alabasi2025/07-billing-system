import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum ComplaintType {
  BILLING = 'billing',
  METER = 'meter',
  SERVICE = 'service',
  TECHNICAL = 'technical',
  OTHER = 'other',
}

export enum ComplaintStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateComplaintDto {
  @IsUUID()
  customerId: string;

  @IsEnum(ComplaintType)
  type: ComplaintType;

  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsUUID()
  relatedInvoiceId?: string;

  @IsOptional()
  @IsUUID()
  relatedMeterId?: string;
}

export class UpdateComplaintDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  response?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class ResolveComplaintDto {
  @IsString()
  resolution: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class ComplaintResponseDto {
  id: string;
  complaintNo: string;
  customerId: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  relatedInvoiceId?: string;
  relatedMeterId?: string;
  assignedTo?: string;
  response?: string;
  resolution?: string;
  internalNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    accountNo: string;
    name: string;
  };
}
