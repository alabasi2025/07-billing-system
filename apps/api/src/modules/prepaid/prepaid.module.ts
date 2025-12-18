import { Module } from '@nestjs/common';
import { PrepaidController } from './prepaid.controller';
import { PrepaidService } from './prepaid.service';
import { DatabaseModule } from '../../database/database.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PrepaidController],
  providers: [PrepaidService, SequenceService],
  exports: [PrepaidService],
})
export class PrepaidModule {}
