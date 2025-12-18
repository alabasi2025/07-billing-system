import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { EventsModule } from '../events/events.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [EventsModule],
  controllers: [CustomersController],
  providers: [CustomersService, SequenceService],
  exports: [CustomersService],
})
export class CustomersModule {}
