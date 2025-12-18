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

// تصنيف العميل
export interface CustomerCategory {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  isActive: boolean;
}

// نموذج العميل
export interface Customer {
  id: string;
  accountNo: string;
  name: string;
  nameEn?: string;
  categoryId: string;
  category?: CustomerCategory;
  idType: IdType | string;
  idNumber: string;
  idCardImage?: string;
  taxNumber?: string;
  phone: string;
  mobile?: string;
  email?: string;
  address: string;
  city?: string;
  district?: string;
  building?: string;
  floor?: string;
  latitude?: number;
  longitude?: number;
  stationId?: string;
  transformerId?: string;
  creditLimit: number;
  paymentTerms: PaymentTerms | string;
  billingCycle: BillingCycle | string;
  accountId?: string;
  status: CustomerStatus | string;
  suspensionReason?: string;
  disconnectionDate?: Date;
  connectionDate?: Date;
  isSubsidized: boolean;
  subsidyProgramId?: string;
  subsidyReferenceNo?: string;
  subsidyStartDate?: Date;
  subsidyEndDate?: Date;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
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

// نموذج إنشاء عميل
export interface CreateCustomerDto {
  name: string;
  nameEn?: string;
  categoryId: string;
  idType: IdType | string;
  idNumber: string;
  idCardImage?: string;
  taxNumber?: string;
  phone: string;
  mobile?: string;
  email?: string;
  address: string;
  city?: string;
  district?: string;
  building?: string;
  floor?: string;
  latitude?: number;
  longitude?: number;
  stationId?: string;
  transformerId?: string;
  creditLimit?: number;
  paymentTerms?: PaymentTerms | string;
  billingCycle?: BillingCycle | string;
  accountId?: string;
  connectionDate?: string;
  isSubsidized?: boolean;
  subsidyProgramId?: string;
  subsidyReferenceNo?: string;
  subsidyStartDate?: string;
  subsidyEndDate?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}

// نموذج تحديث عميل
export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  status?: CustomerStatus | string;
  suspensionReason?: string;
  disconnectionDate?: string;
}

// نموذج فلترة العملاء
export interface CustomerFilterDto {
  search?: string;
  categoryId?: string;
  status?: CustomerStatus | string;
  paymentTerms?: PaymentTerms | string;
  city?: string;
  district?: string;
  isSubsidized?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// نموذج تغيير حالة العميل
export interface ChangeCustomerStatusDto {
  status: CustomerStatus | string;
  reason?: string;
}

// نموذج رصيد العميل
export interface CustomerBalance {
  customerId: string;
  accountNo: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  creditLimit: number;
  availableCredit: number;
  overdueAmount?: number;
}

// نموذج إحصائيات العملاء
export interface CustomerStatistics {
  total: number;
  byStatus: {
    active: number;
    suspended: number;
    disconnected: number;
    closed: number;
  };
  subsidized: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    count: number;
  }[];
  byCity: {
    city: string;
    count: number;
  }[];
  recentCustomers: {
    id: string;
    accountNo: string;
    name: string;
    status: string;
    createdAt: Date;
  }[];
}

// نموذج الاستجابة مع الترقيم
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// خيارات أنواع الهوية
export const ID_TYPE_OPTIONS = [
  { value: IdType.NATIONAL_ID, label: 'هوية وطنية' },
  { value: IdType.IQAMA, label: 'إقامة' },
  { value: IdType.CR, label: 'سجل تجاري' },
  { value: IdType.PASSPORT, label: 'جواز سفر' },
];

// خيارات حالة العميل
export const CUSTOMER_STATUS_OPTIONS = [
  { value: CustomerStatus.ACTIVE, label: 'نشط', severity: 'success' },
  { value: CustomerStatus.INACTIVE, label: 'غير نشط', severity: 'secondary' },
  { value: CustomerStatus.SUSPENDED, label: 'موقوف', severity: 'warning' },
  { value: CustomerStatus.DISCONNECTED, label: 'مفصول', severity: 'danger' },
  { value: CustomerStatus.CLOSED, label: 'مغلق', severity: 'contrast' },
];

// خيارات نوع الدفع
export const PAYMENT_TERMS_OPTIONS = [
  { value: PaymentTerms.PREPAID, label: 'مسبق الدفع' },
  { value: PaymentTerms.POSTPAID, label: 'لاحق الدفع' },
];

// خيارات دورة الفوترة
export const BILLING_CYCLE_OPTIONS = [
  { value: BillingCycle.MONTHLY, label: 'شهري' },
  { value: BillingCycle.QUARTERLY, label: 'ربع سنوي' },
];
