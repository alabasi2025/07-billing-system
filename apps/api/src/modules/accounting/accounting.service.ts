import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  JournalEntry,
  JournalEntryLine,
  JournalEntryType,
  BillingAccountCodes,
} from './accounting.types';

/**
 * Accounting Service
 * 
 * Implements Double-Entry Bookkeeping (القيد المزدوج) for all financial transactions.
 * Journal entries are created locally and synced to the Core Accounting System (01).
 * 
 * Key Principles:
 * - Every transaction creates a balanced journal entry (Debit = Credit)
 * - No financial records are physically deleted (Soft Delete)
 * - All entries are auditable with timestamps and user IDs
 */
@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  private readonly coreSystemUrl: string;

  constructor() {
    this.coreSystemUrl = process.env.CORE_SYSTEM_URL || 'http://localhost:3001/api/v1/accounting';
  }

  /**
   * Create journal entry for invoice issuance
   * Debit: Accounts Receivable (ذمم مدينة)
   * Credit: Revenue (إيرادات) + VAT Payable (ضريبة مستحقة)
   */
  async createInvoiceEntry(invoice: {
    invoiceId: string;
    invoiceNo: string;
    customerId: string;
    consumptionAmount: number;
    fixedCharges: number;
    otherCharges: number;
    vatAmount: number;
    totalAmount: number;
  }, userId?: string): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [];

    // Debit: Accounts Receivable (total amount)
    lines.push({
      accountCode: BillingAccountCodes.ACCOUNTS_RECEIVABLE,
      accountName: 'ذمم مدينة - عملاء',
      debit: invoice.totalAmount,
      credit: 0,
      description: `فاتورة رقم ${invoice.invoiceNo}`,
    });

    // Credit: Electricity Revenue (consumption)
    if (invoice.consumptionAmount > 0) {
      lines.push({
        accountCode: BillingAccountCodes.ELECTRICITY_REVENUE,
        accountName: 'إيرادات الكهرباء',
        debit: 0,
        credit: invoice.consumptionAmount,
        description: 'إيرادات استهلاك الكهرباء',
      });
    }

    // Credit: Fixed Charges Revenue
    if (invoice.fixedCharges > 0) {
      lines.push({
        accountCode: BillingAccountCodes.FIXED_CHARGES_REVENUE,
        accountName: 'إيرادات الرسوم الثابتة',
        debit: 0,
        credit: invoice.fixedCharges,
        description: 'رسوم ثابتة',
      });
    }

    // Credit: Other Revenue
    if (invoice.otherCharges > 0) {
      lines.push({
        accountCode: BillingAccountCodes.OTHER_REVENUE,
        accountName: 'إيرادات أخرى',
        debit: 0,
        credit: invoice.otherCharges,
        description: 'رسوم أخرى',
      });
    }

    // Credit: VAT Payable
    if (invoice.vatAmount > 0) {
      lines.push({
        accountCode: BillingAccountCodes.VAT_PAYABLE,
        accountName: 'ضريبة القيمة المضافة المستحقة',
        debit: 0,
        credit: invoice.vatAmount,
        description: 'ضريبة القيمة المضافة',
      });
    }

    const entry = await this.createJournalEntry({
      entryType: JournalEntryType.INVOICE,
      referenceType: 'invoice',
      referenceId: invoice.invoiceId,
      referenceNo: invoice.invoiceNo,
      description: `قيد فاتورة رقم ${invoice.invoiceNo}`,
      lines,
    }, userId);

    return entry;
  }

  /**
   * Create journal entry for payment receipt
   * Debit: Cash/Bank (نقدية/بنك)
   * Credit: Accounts Receivable (ذمم مدينة)
   */
  async createPaymentEntry(payment: {
    paymentId: string;
    paymentNo: string;
    customerId: string;
    invoiceNo?: string;
    amount: number;
    paymentMethod: 'cash' | 'bank' | 'card' | 'online';
  }, userId?: string): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [];

    // Determine debit account based on payment method
    let debitAccount = BillingAccountCodes.CASH;
    let debitAccountName = 'نقدية';
    
    if (payment.paymentMethod === 'bank' || payment.paymentMethod === 'card' || payment.paymentMethod === 'online') {
      debitAccount = BillingAccountCodes.BANK;
      debitAccountName = 'بنك';
    }

    // Debit: Cash/Bank
    lines.push({
      accountCode: debitAccount,
      accountName: debitAccountName,
      debit: payment.amount,
      credit: 0,
      description: `سند قبض رقم ${payment.paymentNo}`,
    });

    // Credit: Accounts Receivable
    lines.push({
      accountCode: BillingAccountCodes.ACCOUNTS_RECEIVABLE,
      accountName: 'ذمم مدينة - عملاء',
      debit: 0,
      credit: payment.amount,
      description: payment.invoiceNo ? `سداد فاتورة ${payment.invoiceNo}` : 'سداد على الحساب',
    });

    const entry = await this.createJournalEntry({
      entryType: JournalEntryType.PAYMENT,
      referenceType: 'payment',
      referenceId: payment.paymentId,
      referenceNo: payment.paymentNo,
      description: `قيد سداد رقم ${payment.paymentNo}`,
      lines,
    }, userId);

    return entry;
  }

  /**
   * Create journal entry for prepaid recharge
   * Debit: Cash/Bank (نقدية/بنك)
   * Credit: Prepaid Revenue (إيرادات مسبقة الدفع)
   */
  async createPrepaidRechargeEntry(recharge: {
    rechargeId: string;
    rechargeNo: string;
    customerId: string;
    meterId: string;
    amount: number;
    paymentMethod: 'cash' | 'bank' | 'card' | 'online';
  }, userId?: string): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [];

    // Determine debit account
    let debitAccount = BillingAccountCodes.CASH;
    let debitAccountName = 'نقدية';
    
    if (recharge.paymentMethod !== 'cash') {
      debitAccount = BillingAccountCodes.BANK;
      debitAccountName = 'بنك';
    }

    // Debit: Cash/Bank
    lines.push({
      accountCode: debitAccount,
      accountName: debitAccountName,
      debit: recharge.amount,
      credit: 0,
      description: `شحن مسبق الدفع رقم ${recharge.rechargeNo}`,
    });

    // Credit: Prepaid Revenue
    lines.push({
      accountCode: BillingAccountCodes.PREPAID_REVENUE,
      accountName: 'إيرادات مسبقة الدفع',
      debit: 0,
      credit: recharge.amount,
      description: `شحن عداد ${recharge.meterId}`,
    });

    const entry = await this.createJournalEntry({
      entryType: JournalEntryType.PREPAID_RECHARGE,
      referenceType: 'prepaid_token',
      referenceId: recharge.rechargeId,
      referenceNo: recharge.rechargeNo,
      description: `قيد شحن مسبق الدفع رقم ${recharge.rechargeNo}`,
      lines,
    }, userId);

    return entry;
  }

  /**
   * Create a journal entry and sync to Core System
   */
  private async createJournalEntry(params: {
    entryType: JournalEntryType;
    referenceType: string;
    referenceId: string;
    referenceNo: string;
    description: string;
    lines: JournalEntryLine[];
  }, userId?: string): Promise<JournalEntry> {
    // Calculate totals
    const totalDebit = params.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = params.lines.reduce((sum, line) => sum + line.credit, 0);

    // Validate double-entry balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal entry is not balanced: Debit=${totalDebit}, Credit=${totalCredit}`);
    }

    const entry: JournalEntry = {
      id: uuidv4(),
      entryNo: await this.generateEntryNo(),
      entryDate: new Date(),
      entryType: params.entryType,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      referenceNo: params.referenceNo,
      description: params.description,
      lines: params.lines,
      totalDebit,
      totalCredit,
      status: 'posted',
      createdBy: userId,
      createdAt: new Date(),
    };

    // Log the journal entry
    this.logger.log(JSON.stringify({
      action: 'journal_entry_created',
      entryNo: entry.entryNo,
      entryType: entry.entryType,
      totalDebit,
      totalCredit,
      referenceNo: entry.referenceNo,
    }));

    // Sync to Core Accounting System
    await this.syncToCoreSystem(entry);

    return entry;
  }

  /**
   * Sync journal entry to Core Accounting System
   */
  private async syncToCoreSystem(entry: JournalEntry): Promise<void> {
    try {
      const response = await fetch(`${this.coreSystemUrl}/journal-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source-System': 'billing-system-07',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync: ${response.status}`);
      }

      this.logger.debug(`Journal entry synced to Core System: ${entry.entryNo}`);
    } catch (error) {
      // Log error but don't fail the transaction
      // Entry will be synced later via reconciliation
      this.logger.warn(`Failed to sync journal entry to Core System: ${entry.entryNo}`);
    }
  }

  /**
   * Generate unique entry number
   */
  private async generateEntryNo(): Promise<string> {
    const date = new Date();
    const prefix = 'JE';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}-${random}`;
  }
}
