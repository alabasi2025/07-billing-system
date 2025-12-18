import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { TariffsModule } from '../tariffs/tariffs.module';
import { EventsModule } from '../events/events.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [TariffsModule, EventsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, SequenceService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
