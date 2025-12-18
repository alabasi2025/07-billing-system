import { Module } from '@nestjs/common';
import { POSController } from './pos.controller';
import { POSService } from './pos.service';
import { DatabaseModule } from '../../database/database.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [POSController],
  providers: [POSService, SequenceService],
  exports: [POSService],
})
export class POSModule {}
