import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { TariffsModule } from '../tariffs/tariffs.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [TariffsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, SequenceService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
