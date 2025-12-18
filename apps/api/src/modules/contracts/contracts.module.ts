import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  controllers: [ContractsController],
  providers: [ContractsService, SequenceService],
  exports: [ContractsService],
})
export class ContractsModule {}
