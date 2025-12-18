import { Test, TestingModule } from '@nestjs/testing';
import { AccountingService } from '../modules/accounting/accounting.service';
import { JournalEntryType, BillingAccountCodes } from '../modules/accounting/accounting.types';

describe('AccountingService', () => {
  let service: AccountingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountingService],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    
    // Mock fetch for sync to core system
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvoiceEntry', () => {
    it('should create a balanced journal entry for invoice', async () => {
      const invoice = {
        invoiceId: 'inv-1',
        invoiceNo: 'INV-2024-001',
        customerId: 'cust-1',
        consumptionAmount: 400,
        fixedCharges: 50,
        otherCharges: 10,
        vatAmount: 69,
        totalAmount: 529,
      };

      const entry = await service.createInvoiceEntry(invoice);

      expect(entry).toBeDefined();
      expect(entry.entryType).toBe(JournalEntryType.INVOICE);
      expect(entry.referenceId).toBe(invoice.invoiceId);
      expect(entry.referenceNo).toBe(invoice.invoiceNo);
      expect(entry.totalDebit).toBe(entry.totalCredit);
      expect(entry.totalDebit).toBe(invoice.totalAmount);
      expect(entry.status).toBe('posted');
    });

    it('should create correct debit and credit lines', async () => {
      const invoice = {
        invoiceId: 'inv-1',
        invoiceNo: 'INV-2024-001',
        customerId: 'cust-1',
        consumptionAmount: 400,
        fixedCharges: 50,
        otherCharges: 10,
        vatAmount: 69,
        totalAmount: 529,
      };

      const entry = await service.createInvoiceEntry(invoice);

      // Check debit line (Accounts Receivable)
      const debitLine = entry.lines.find(l => l.debit > 0);
      expect(debitLine).toBeDefined();
      expect(debitLine?.accountCode).toBe(BillingAccountCodes.ACCOUNTS_RECEIVABLE);
      expect(debitLine?.debit).toBe(invoice.totalAmount);

      // Check credit lines
      const creditLines = entry.lines.filter(l => l.credit > 0);
      expect(creditLines.length).toBeGreaterThan(0);
      
      const totalCredit = creditLines.reduce((sum, l) => sum + l.credit, 0);
      expect(totalCredit).toBe(invoice.totalAmount);
    });

    it('should handle invoice without VAT', async () => {
      const invoice = {
        invoiceId: 'inv-1',
        invoiceNo: 'INV-2024-001',
        customerId: 'cust-1',
        consumptionAmount: 400,
        fixedCharges: 50,
        otherCharges: 0,
        vatAmount: 0,
        totalAmount: 450,
      };

      const entry = await service.createInvoiceEntry(invoice);

      expect(entry.totalDebit).toBe(450);
      expect(entry.totalCredit).toBe(450);
      
      const vatLine = entry.lines.find(l => l.accountCode === BillingAccountCodes.VAT_PAYABLE);
      expect(vatLine).toBeUndefined();
    });
  });

  describe('createPaymentEntry', () => {
    it('should create a balanced journal entry for cash payment', async () => {
      const payment = {
        paymentId: 'pay-1',
        paymentNo: 'PAY-2024-001',
        customerId: 'cust-1',
        invoiceNo: 'INV-2024-001',
        amount: 500,
        paymentMethod: 'cash' as const,
      };

      const entry = await service.createPaymentEntry(payment);

      expect(entry).toBeDefined();
      expect(entry.entryType).toBe(JournalEntryType.PAYMENT);
      expect(entry.referenceId).toBe(payment.paymentId);
      expect(entry.totalDebit).toBe(entry.totalCredit);
      expect(entry.totalDebit).toBe(payment.amount);
    });

    it('should use cash account for cash payments', async () => {
      const payment = {
        paymentId: 'pay-1',
        paymentNo: 'PAY-2024-001',
        customerId: 'cust-1',
        amount: 500,
        paymentMethod: 'cash' as const,
      };

      const entry = await service.createPaymentEntry(payment);

      const debitLine = entry.lines.find(l => l.debit > 0);
      expect(debitLine?.accountCode).toBe(BillingAccountCodes.CASH);
    });

    it('should use bank account for bank/card/online payments', async () => {
      const payment = {
        paymentId: 'pay-1',
        paymentNo: 'PAY-2024-001',
        customerId: 'cust-1',
        amount: 500,
        paymentMethod: 'bank' as const,
      };

      const entry = await service.createPaymentEntry(payment);

      const debitLine = entry.lines.find(l => l.debit > 0);
      expect(debitLine?.accountCode).toBe(BillingAccountCodes.BANK);
    });

    it('should credit accounts receivable', async () => {
      const payment = {
        paymentId: 'pay-1',
        paymentNo: 'PAY-2024-001',
        customerId: 'cust-1',
        amount: 500,
        paymentMethod: 'cash' as const,
      };

      const entry = await service.createPaymentEntry(payment);

      const creditLine = entry.lines.find(l => l.credit > 0);
      expect(creditLine?.accountCode).toBe(BillingAccountCodes.ACCOUNTS_RECEIVABLE);
      expect(creditLine?.credit).toBe(payment.amount);
    });
  });

  describe('createPrepaidRechargeEntry', () => {
    it('should create a balanced journal entry for prepaid recharge', async () => {
      const recharge = {
        rechargeId: 'rech-1',
        rechargeNo: 'RECH-2024-001',
        customerId: 'cust-1',
        meterId: 'meter-1',
        amount: 200,
        paymentMethod: 'cash' as const,
      };

      const entry = await service.createPrepaidRechargeEntry(recharge);

      expect(entry).toBeDefined();
      expect(entry.entryType).toBe(JournalEntryType.PREPAID_RECHARGE);
      expect(entry.totalDebit).toBe(entry.totalCredit);
      expect(entry.totalDebit).toBe(recharge.amount);
    });

    it('should credit prepaid revenue account', async () => {
      const recharge = {
        rechargeId: 'rech-1',
        rechargeNo: 'RECH-2024-001',
        customerId: 'cust-1',
        meterId: 'meter-1',
        amount: 200,
        paymentMethod: 'cash' as const,
      };

      const entry = await service.createPrepaidRechargeEntry(recharge);

      const creditLine = entry.lines.find(l => l.credit > 0);
      expect(creditLine?.accountCode).toBe(BillingAccountCodes.PREPAID_REVENUE);
    });
  });

  describe('Double-Entry Validation', () => {
    it('should always create balanced entries', async () => {
      const testCases = [
        {
          invoice: {
            invoiceId: 'inv-1',
            invoiceNo: 'INV-001',
            customerId: 'cust-1',
            consumptionAmount: 100,
            fixedCharges: 0,
            otherCharges: 0,
            vatAmount: 15,
            totalAmount: 115,
          },
        },
        {
          invoice: {
            invoiceId: 'inv-2',
            invoiceNo: 'INV-002',
            customerId: 'cust-2',
            consumptionAmount: 500,
            fixedCharges: 100,
            otherCharges: 50,
            vatAmount: 97.5,
            totalAmount: 747.5,
          },
        },
      ];

      for (const testCase of testCases) {
        const entry = await service.createInvoiceEntry(testCase.invoice);
        expect(Math.abs(entry.totalDebit - entry.totalCredit)).toBeLessThan(0.01);
      }
    });

    it('should generate unique entry numbers', async () => {
      const invoice = {
        invoiceId: 'inv-1',
        invoiceNo: 'INV-001',
        customerId: 'cust-1',
        consumptionAmount: 100,
        fixedCharges: 0,
        otherCharges: 0,
        vatAmount: 15,
        totalAmount: 115,
      };

      const entry1 = await service.createInvoiceEntry(invoice);
      const entry2 = await service.createInvoiceEntry(invoice);

      expect(entry1.entryNo).not.toBe(entry2.entryNo);
    });
  });

  describe('Core System Sync', () => {
    it('should attempt to sync entry to core system', async () => {
      const invoice = {
        invoiceId: 'inv-1',
        invoiceNo: 'INV-001',
        customerId: 'cust-1',
        consumptionAmount: 100,
        fixedCharges: 0,
        otherCharges: 0,
        vatAmount: 15,
        totalAmount: 115,
      };

      await service.createInvoiceEntry(invoice);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not fail if core system sync fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const invoice = {
        invoiceId: 'inv-1',
        invoiceNo: 'INV-001',
        customerId: 'cust-1',
        consumptionAmount: 100,
        fixedCharges: 0,
        otherCharges: 0,
        vatAmount: 15,
        totalAmount: 115,
      };

      // Should not throw
      const entry = await service.createInvoiceEntry(invoice);
      expect(entry).toBeDefined();
    });
  });
});
