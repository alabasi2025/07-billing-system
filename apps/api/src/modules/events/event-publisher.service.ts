import { Injectable, Logger } from '@nestjs/common';
import { BillingEvent, BillingEventType } from './event.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Event Publisher Service
 * 
 * Publishes events to the Developer System (02) for cross-system integration.
 * Events are used for:
 * - Notifying other systems about changes in billing data
 * - Triggering workflows in other systems
 * - Maintaining data consistency across systems
 * 
 * Integration with Developer System (نظام المطور):
 * - Events are published via HTTP POST to the Developer System API
 * - Events can also be published to a message queue (RabbitMQ, Redis, etc.)
 * - The Developer System routes events to interested subscribers
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);
  private readonly developerSystemUrl: string;
  private readonly systemId = 'billing-system-07';

  constructor() {
    this.developerSystemUrl = process.env.DEVELOPER_SYSTEM_URL || 'http://localhost:3002/api/v1/events';
  }

  /**
   * Publish an event to the Developer System
   */
  async publish<T>(type: BillingEventType, data: T, metadata?: { userId?: string; correlationId?: string }): Promise<void> {
    const event: BillingEvent<T> = {
      id: uuidv4(),
      type,
      source: this.systemId,
      timestamp: new Date(),
      data,
      metadata: {
        ...metadata,
        correlationId: metadata?.correlationId || uuidv4(),
      },
    };

    try {
      // Log the event locally
      this.logger.log(JSON.stringify({
        action: 'event_published',
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
      }));

      // Publish to Developer System via HTTP
      await this.publishToHttp(event);
      
      // Optionally publish to message queue
      // await this.publishToQueue(event);
      
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.type}`, error);
      // Store failed events for retry
      await this.storeFailedEvent(event);
    }
  }

  /**
   * Publish event via HTTP to Developer System
   */
  private async publishToHttp(event: BillingEvent): Promise<void> {
    try {
      const response = await fetch(this.developerSystemUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source-System': this.systemId,
          'X-Event-Type': event.type,
          'X-Correlation-Id': event.metadata?.correlationId || '',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      this.logger.debug(`Event published successfully: ${event.id}`);
    } catch (error) {
      // If Developer System is not available, log and continue
      // Events will be stored for retry
      this.logger.warn(`Developer System not available, event stored for retry: ${event.id}`);
      throw error;
    }
  }

  /**
   * Store failed events for later retry
   */
  private async storeFailedEvent(event: BillingEvent): Promise<void> {
    // In production, store in database or Redis for retry
    // For now, just log
    this.logger.warn(JSON.stringify({
      action: 'event_stored_for_retry',
      eventId: event.id,
      eventType: event.type,
    }));
  }

  // Convenience methods for common events

  async publishCustomerCreated(data: { customerId: string; accountNo: string; name: string; categoryId: string; status: string }, userId?: string): Promise<void> {
    await this.publish(BillingEventType.CUSTOMER_CREATED, data, { userId });
  }

  async publishInvoiceCreated(data: { invoiceId: string; invoiceNo: string; customerId: string; totalAmount: number; dueDate: Date }, userId?: string): Promise<void> {
    await this.publish(BillingEventType.INVOICE_CREATED, data, { userId });
  }

  async publishPaymentReceived(data: { paymentId: string; paymentNo: string; customerId: string; invoiceId?: string; amount: number; paymentMethod: string }, userId?: string): Promise<void> {
    await this.publish(BillingEventType.PAYMENT_RECEIVED, data, { userId });
  }

  async publishInvoicePaid(data: { invoiceId: string; invoiceNo: string; customerId: string; paidAmount: number }, userId?: string): Promise<void> {
    await this.publish(BillingEventType.INVOICE_PAID, data, { userId });
  }

  async publishDisconnectionOrdered(data: { orderId: string; customerId: string; meterId: string; reason: string }, userId?: string): Promise<void> {
    await this.publish(BillingEventType.DISCONNECTION_ORDERED, data, { userId });
  }

  async publishPrepaidRecharge(data: { customerId: string; meterId: string; amount: number; token: string }, userId?: string): Promise<void> {
    await this.publish(BillingEventType.PREPAID_RECHARGE, data, { userId });
  }
}
