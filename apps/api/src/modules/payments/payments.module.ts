import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { EventsModule } from '../events/events.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [InvoicesModule, EventsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SequenceService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
