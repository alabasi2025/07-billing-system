import { Module } from '@nestjs/common';
import { DisconnectionsController } from './disconnections.controller';
import { DisconnectionsService } from './disconnections.service';
import { DatabaseModule } from '../../database/database.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DisconnectionsController],
  providers: [DisconnectionsService, SequenceService],
  exports: [DisconnectionsService],
})
export class DisconnectionsModule {}
