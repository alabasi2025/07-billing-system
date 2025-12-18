// Customer Models
export interface CustomerCategory {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  accountNo: string;
  name: string;
  nameEn?: string;
  categoryId: string;
  category?: CustomerCategory;
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
  creditLimit: number;
  paymentTerms: string;
  billingCycle: string;
  status: string;
  connectionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Contract Models
export interface Contract {
  id: string;
  contractNo: string;
  customerId: string;
  customer?: Customer;
  startDate: Date;
  endDate?: Date;
  contractType: string;
  loadKw: number;
  depositAmount: number;
  guaranteeAmount: number;
  status: string;
  terms?: string;
  notes?: string;
  terminatedAt?: Date;
  terminationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Meter Models
export interface MeterType {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  phases: number;
  maxReading: number;
  digits: number;
  isSmartMeter: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meter {
  id: string;
  meterNo: string;
  customerId?: string;
  customer?: Customer;
  meterTypeId: string;
  meterType?: MeterType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: Date;
  lastReadDate?: Date;
  lastReading: number;
  multiplier: number;
  status: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeterReading {
  id: string;
  meterId: string;
  meter?: Meter;
  readingDate: Date;
  reading: number;
  previousReading: number;
  consumption: number;
  readingType: string;
  readerId?: string;
  imageUrl?: string;
  notes?: string;
  billingPeriod: string;
  isProcessed: boolean;
  createdAt: Date;
}

// Tariff Models
export interface Tariff {
  id: string;
  categoryId: string;
  category?: CustomerCategory;
  name: string;
  nameEn?: string;
  sliceOrder: number;
  fromUnit: number;
  toUnit?: number;
  fromKwh: number;
  toKwh?: number;
  rate: number;
  ratePerKwh: number;
  fixedCharge: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Models
export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customer?: Customer;
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
  items?: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  itemType: string;
  fromKwh?: number;
  toKwh?: number;
  quantity: number;
  rate: number;
  amount: number;
  createdAt: Date;
}

// Payment Models
export interface Payment {
  id: string;
  paymentNo: string;
  customerId: string;
  customer?: Customer;
  invoiceId?: string;
  invoice?: Invoice;
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
}

// Complaint Models
export interface Complaint {
  id: string;
  complaintNo: string;
  customerId: string;
  customer?: Customer;
  type: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  relatedInvoiceId?: string;
  relatedInvoice?: Invoice;
  relatedMeterId?: string;
  relatedMeter?: Meter;
  assignedTo?: string;
  response?: string;
  resolution?: string;
  internalNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Models
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Models
export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalMeters: number;
  activeMeters: number;
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  openComplaints: number;
}
