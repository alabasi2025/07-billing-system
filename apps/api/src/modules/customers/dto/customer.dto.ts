import {
  IsString,
  IsOptional,
  IsUUID,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// أنواع الهوية
export enum IdType {
  NATIONAL_ID = 'national_id',
  IQAMA = 'iqama',
  CR = 'cr',
  PASSPORT = 'passport',
}

// حالة العميل
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DISCONNECTED = 'disconnected',
  CLOSED = 'closed',
}

// نوع الدفع
export enum PaymentTerms {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

// دورة الفوترة
export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

// DTO إنشاء عميل جديد
export class CreateCustomerDto {
  @ApiProperty({ description: 'اسم العميل بالعربية', example: 'محمد أحمد علي' })
  @IsString()
  @IsNotEmpty({ message: 'اسم العميل مطلوب' })
  @MinLength(3, { message: 'اسم العميل يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(200, { message: 'اسم العميل يجب ألا يتجاوز 200 حرف' })
  name: string;

  @ApiPropertyOptional({ description: 'اسم العميل بالإنجليزية', example: 'Mohammed Ahmed Ali' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiProperty({ description: 'معرف تصنيف العميل' })
  @IsUUID('4', { message: 'معرف التصنيف غير صالح' })
  @IsNotEmpty({ message: 'تصنيف العميل مطلوب' })
  categoryId: string;

  @ApiProperty({ description: 'نوع الهوية', enum: IdType, example: IdType.NATIONAL_ID })
  @IsEnum(IdType, { message: 'نوع الهوية غير صالح' })
  @IsNotEmpty({ message: 'نوع الهوية مطلوب' })
  idType: IdType;

  @ApiProperty({ description: 'رقم الهوية', example: '1234567890' })
  @IsString()
  @IsNotEmpty({ message: 'رقم الهوية مطلوب' })
  @MinLength(5, { message: 'رقم الهوية يجب أن يكون 5 أرقام على الأقل' })
  @MaxLength(50)
  idNumber: string;

  @ApiPropertyOptional({ description: 'رابط صورة الهوية' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  idCardImage?: string;

  @ApiPropertyOptional({ description: 'الرقم الضريبي', example: '300000000000003' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxNumber?: string;

  @ApiProperty({ description: 'رقم الهاتف الثابت', example: '0112345678' })
  @IsString()
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ description: 'رقم الجوال', example: '0501234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني', example: 'customer@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @MaxLength(100)
  email?: string;

  @ApiProperty({ description: 'العنوان التفصيلي', example: 'شارع الملك فهد، حي العليا' })
  @IsString()
  @IsNotEmpty({ message: 'العنوان مطلوب' })
  address: string;

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

  @ApiPropertyOptional({ description: 'المبنى', example: 'برج المملكة' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string;

  @ApiPropertyOptional({ description: 'الطابق', example: '5' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;

  @ApiPropertyOptional({ description: 'خط العرض', example: 24.7136 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول', example: 46.6753 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID('4')
  stationId?: string;

  @ApiPropertyOptional({ description: 'معرف المحول' })
  @IsOptional()
  @IsUUID('4')
  transformerId?: string;

  @ApiPropertyOptional({ description: 'الحد الائتماني', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'نوع الدفع', enum: PaymentTerms, default: PaymentTerms.POSTPAID })
  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @ApiPropertyOptional({ description: 'دورة الفوترة', enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'معرف الحساب المحاسبي' })
  @IsOptional()
  @IsUUID('4')
  accountId?: string;

  @ApiPropertyOptional({ description: 'تاريخ التوصيل' })
  @IsOptional()
  @IsDateString()
  connectionDate?: string;

  // بيانات الدعم الحكومي
  @ApiPropertyOptional({ description: 'هل يستفيد من الدعم؟', default: false })
  @IsOptional()
  @IsBoolean()
  isSubsidized?: boolean;

  @ApiPropertyOptional({ description: 'معرف برنامج الدعم' })
  @IsOptional()
  @IsUUID('4')
  subsidyProgramId?: string;

  @ApiPropertyOptional({ description: 'رقم مرجع الدعم' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subsidyReferenceNo?: string;

  @ApiPropertyOptional({ description: 'تاريخ بداية الدعم' })
  @IsOptional()
  @IsDateString()
  subsidyStartDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ نهاية الدعم' })
  @IsOptional()
  @IsDateString()
  subsidyEndDate?: string;

  // جهة الاتصال الرئيسية
  @ApiPropertyOptional({ description: 'اسم جهة الاتصال' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'هاتف جهة الاتصال' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO تحديث عميل
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiPropertyOptional({ description: 'حالة العميل', enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'سبب الإيقاف' })
  @IsOptional()
  @IsString()
  suspensionReason?: string;

  @ApiPropertyOptional({ description: 'تاريخ الفصل' })
  @IsOptional()
  @IsDateString()
  disconnectionDate?: string;
}

// DTO البحث والفلترة
export class CustomerFilterDto {
  @ApiPropertyOptional({ description: 'البحث بالاسم أو رقم الحساب' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'تصنيف العميل' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ description: 'حالة العميل', enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'نوع الدفع', enum: PaymentTerms })
  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @ApiPropertyOptional({ description: 'المدينة' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'الحي' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'يستفيد من الدعم' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSubsidized?: boolean;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'حقل الترتيب', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'اتجاه الترتيب', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

// DTO تغيير حالة العميل
export class ChangeCustomerStatusDto {
  @ApiProperty({ description: 'الحالة الجديدة', enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsNotEmpty()
  status: CustomerStatus;

  @ApiPropertyOptional({ description: 'سبب التغيير' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO الاستجابة
export class CustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  accountNo: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  nameEn?: string;

  @ApiProperty()
  categoryId: string;

  @ApiPropertyOptional()
  category?: {
    id: string;
    code: string;
    name: string;
  };

  @ApiProperty()
  idType: string;

  @ApiProperty()
  idNumber: string;

  @ApiPropertyOptional()
  idCardImage?: string;

  @ApiPropertyOptional()
  taxNumber?: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  mobile?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  district?: string;

  @ApiPropertyOptional()
  building?: string;

  @ApiPropertyOptional()
  floor?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  stationId?: string;

  @ApiPropertyOptional()
  transformerId?: string;

  @ApiProperty()
  creditLimit: number;

  @ApiProperty()
  paymentTerms: string;

  @ApiProperty()
  billingCycle: string;

  @ApiPropertyOptional()
  accountId?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  suspensionReason?: string;

  @ApiPropertyOptional()
  disconnectionDate?: Date;

  @ApiPropertyOptional()
  connectionDate?: Date;

  @ApiProperty()
  isSubsidized: boolean;

  @ApiPropertyOptional()
  subsidyProgramId?: string;

  @ApiPropertyOptional()
  subsidyReferenceNo?: string;

  @ApiPropertyOptional()
  subsidyStartDate?: Date;

  @ApiPropertyOptional()
  subsidyEndDate?: Date;

  @ApiPropertyOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  contactPhone?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  _count?: {
    contracts: number;
    meters: number;
    invoices: number;
    payments: number;
    addresses: number;
    contacts: number;
    components: number;
  };
}

// DTO قائمة العملاء مع الترقيم
export class CustomerListResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  data: CustomerResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
