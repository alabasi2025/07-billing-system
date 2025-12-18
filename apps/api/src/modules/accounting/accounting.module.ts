import { Module, Global } from '@nestjs/common';
import { AccountingService } from './accounting.service';

/**
 * Accounting Module
 * 
 * Implements Double-Entry Bookkeeping (القيد المزدوج) for all financial transactions.
 * This module ensures that every financial operation creates a balanced journal entry
 * that is synced to the Core Accounting System (01).
 */
@Global()
@Module({
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
