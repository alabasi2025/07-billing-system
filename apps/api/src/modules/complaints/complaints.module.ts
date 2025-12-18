import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  controllers: [ComplaintsController],
  providers: [ComplaintsService, SequenceService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
