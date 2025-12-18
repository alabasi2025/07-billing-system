/**
 * Event Types for Billing System
 * These events are published to the Developer System (02) for cross-system integration
 */

export enum BillingEventType {
  // Customer Events
  CUSTOMER_CREATED = 'billing.customer.created',
  CUSTOMER_UPDATED = 'billing.customer.updated',
  CUSTOMER_SUSPENDED = 'billing.customer.suspended',
  CUSTOMER_ACTIVATED = 'billing.customer.activated',
  
  // Invoice Events
  INVOICE_CREATED = 'billing.invoice.created',
  INVOICE_ISSUED = 'billing.invoice.issued',
  INVOICE_PAID = 'billing.invoice.paid',
  INVOICE_OVERDUE = 'billing.invoice.overdue',
  INVOICE_CANCELLED = 'billing.invoice.cancelled',
  
  // Payment Events
  PAYMENT_RECEIVED = 'billing.payment.received',
  PAYMENT_CANCELLED = 'billing.payment.cancelled',
  
  // Meter Events
  METER_READING_RECORDED = 'billing.meter.reading_recorded',
  METER_INSTALLED = 'billing.meter.installed',
  METER_REPLACED = 'billing.meter.replaced',
  
  // Disconnection Events
  DISCONNECTION_ORDERED = 'billing.disconnection.ordered',
  DISCONNECTION_EXECUTED = 'billing.disconnection.executed',
  RECONNECTION_EXECUTED = 'billing.reconnection.executed',
  
  // Prepaid Events
  PREPAID_RECHARGE = 'billing.prepaid.recharge',
  PREPAID_TOKEN_GENERATED = 'billing.prepaid.token_generated',
}

export interface BillingEvent<T = any> {
  id: string;
  type: BillingEventType;
  source: string;
  timestamp: Date;
  data: T;
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

export interface CustomerCreatedEvent {
  customerId: string;
  accountNo: string;
  name: string;
  categoryId: string;
  status: string;
}

export interface InvoiceCreatedEvent {
  invoiceId: string;
  invoiceNo: string;
  customerId: string;
  totalAmount: number;
  dueDate: Date;
}

export interface PaymentReceivedEvent {
  paymentId: string;
  paymentNo: string;
  customerId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: string;
}
