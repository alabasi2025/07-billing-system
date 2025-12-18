/**
 * Accounting Types for Double-Entry Bookkeeping
 * These types are used for integration with the Core Accounting System (01)
 */

export enum AccountType {
  ASSET = 'asset',           // أصول
  LIABILITY = 'liability',   // خصوم
  EQUITY = 'equity',         // حقوق الملكية
  REVENUE = 'revenue',       // إيرادات
  EXPENSE = 'expense',       // مصروفات
}

export enum JournalEntryType {
  INVOICE = 'invoice',                 // فاتورة
  PAYMENT = 'payment',                 // دفعة
  ADJUSTMENT = 'adjustment',           // تسوية
  REFUND = 'refund',                   // استرداد
  PREPAID_RECHARGE = 'prepaid_recharge', // شحن مسبق الدفع
}

export interface JournalEntryLine {
  accountCode: string;      // رمز الحساب
  accountName: string;      // اسم الحساب
  debit: number;           // مدين
  credit: number;          // دائن
  description?: string;    // وصف
}

export interface JournalEntry {
  id?: string;
  entryNo: string;          // رقم القيد
  entryDate: Date;          // تاريخ القيد
  entryType: JournalEntryType;
  referenceType: string;    // نوع المرجع (invoice, payment, etc.)
  referenceId: string;      // معرف المرجع
  referenceNo: string;      // رقم المرجع
  description: string;      // وصف القيد
  lines: JournalEntryLine[];
  totalDebit: number;       // إجمالي المدين
  totalCredit: number;      // إجمالي الدائن
  status: 'draft' | 'posted' | 'reversed';
  createdBy?: string;
  createdAt?: Date;
}

/**
 * Standard Account Codes for Billing System
 * These should match the Chart of Accounts in the Core System
 */
export const BillingAccountCodes = {
  // Assets - أصول
  ACCOUNTS_RECEIVABLE: '1200',      // ذمم مدينة - عملاء
  CASH: '1100',                     // نقدية
  BANK: '1110',                     // بنك
  PREPAID_BALANCE: '1300',          // أرصدة مسبقة الدفع
  
  // Liabilities - خصوم
  CUSTOMER_DEPOSITS: '2100',        // ودائع العملاء
  VAT_PAYABLE: '2200',              // ضريبة القيمة المضافة المستحقة
  DEFERRED_REVENUE: '2300',         // إيرادات مؤجلة
  
  // Revenue - إيرادات
  ELECTRICITY_REVENUE: '4100',      // إيرادات الكهرباء
  FIXED_CHARGES_REVENUE: '4200',    // إيرادات الرسوم الثابتة
  OTHER_REVENUE: '4300',            // إيرادات أخرى
  PREPAID_REVENUE: '4400',          // إيرادات مسبقة الدفع
  
  // Expenses - مصروفات
  BAD_DEBT_EXPENSE: '5100',         // مصروف الديون المعدومة
};
