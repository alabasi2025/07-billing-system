import { Module, Global } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service';

/**
 * Events Module
 * 
 * Provides event publishing capabilities for cross-system integration.
 * Events are published to the Developer System (02) which routes them
 * to interested subscribers.
 */
@Global()
@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}
