import { Module } from '@nestjs/common';
import { InstallmentsController } from './installments.controller';
import { InstallmentsService } from './installments.service';
import { DatabaseModule } from '../../database/database.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InstallmentsController],
  providers: [InstallmentsService, SequenceService],
  exports: [InstallmentsService],
})
export class InstallmentsModule {}
