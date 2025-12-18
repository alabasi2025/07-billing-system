import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsEnum,
  IsUUID,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum CustomerType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  AGRICULTURAL = 'agricultural',
  GOVERNMENTAL = 'governmental',
}

export enum IdType {
  NATIONAL_ID = 'national_id',
  IQAMA = 'iqama',
  CR = 'cr',
  PASSPORT = 'passport',
}

export enum RequestStatus {
  PENDING_REVIEW = 'pending_review',
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_RECEIVED = 'payment_received',
  APPROVED = 'approved',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export class CreateSubscriptionRequestDto {
  @ApiProperty({ description: 'اسم العميل', example: 'أحمد محمد العلي' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  customerName: string;

  @ApiProperty({ description: 'نوع العميل', enum: CustomerType })
  @IsEnum(CustomerType)
  customerType: CustomerType;

  @ApiPropertyOptional({ description: 'نوع الهوية', enum: IdType })
  @IsOptional()
  @IsEnum(IdType)
  idType?: IdType;

  @ApiPropertyOptional({ description: 'رقم الهوية', example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  idNumber?: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف الثابت', example: '0112345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'رقم الجوال', example: '0501234567' })
  @IsString()
  @MaxLength(20)
  mobile: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني', example: 'email@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'العنوان التفصيلي' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'المدينة', example: 'الرياض' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'الحي', example: 'العليا' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ description: 'خط العرض', example: 24.7136 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول', example: 46.6753 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSubscriptionRequestDto extends PartialType(CreateSubscriptionRequestDto) {
  @ApiPropertyOptional({ description: 'رسوم الاشتراك', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subscriptionFee?: number;

  @ApiPropertyOptional({ description: 'رسوم التوصيل', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  connectionFee?: number;

  @ApiPropertyOptional({ description: 'مبلغ التأمين', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}

export class ApproveRequestDto {
  @ApiProperty({ description: 'رسوم الاشتراك', example: 500 })
  @IsNumber()
  @Min(0)
  subscriptionFee: number;

  @ApiProperty({ description: 'رسوم التوصيل', example: 1000 })
  @IsNumber()
  @Min(0)
  connectionFee: number;

  @ApiPropertyOptional({ description: 'مبلغ التأمين', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ description: 'ملاحظات الموافقة' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectRequestDto {
  @ApiProperty({ description: 'سبب الرفض' })
  @IsString()
  @MinLength(10)
  rejectionReason: string;
}

export class AssignTechnicianDto {
  @ApiProperty({ description: 'معرف الفني' })
  @IsUUID()
  technicianId: string;

  @ApiPropertyOptional({ description: 'تاريخ التركيب المتوقع' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'الرقم التسلسلي للعداد' })
  @IsOptional()
  @IsString()
  meterSerialNumber?: string;
}

export class RecordPaymentDto {
  @ApiProperty({ description: 'المبلغ المدفوع', example: 2000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'مرجع الدفع', example: 'PAY-2024-001' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteInstallationDto {
  @ApiProperty({ description: 'الرقم التسلسلي للعداد' })
  @IsString()
  meterSerialNumber: string;

  @ApiProperty({ description: 'القراءة الأولية', example: 0 })
  @IsNumber()
  @Min(0)
  initialReading: number;

  @ApiPropertyOptional({ description: 'ملاحظات التركيب' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubscriptionRequestFilterDto {
  @ApiPropertyOptional({ description: 'حالة الطلب', enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ description: 'حالة الدفع', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'نوع العميل', enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional({ description: 'المدينة' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'من تاريخ' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'إلى تاريخ' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'رقم الصفحة', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
