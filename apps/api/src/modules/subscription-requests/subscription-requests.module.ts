import { Module } from '@nestjs/common';
import { SubscriptionRequestsController } from './subscription-requests.controller';
import { SubscriptionRequestsService } from './subscription-requests.service';
import { DatabaseModule } from '../../database/database.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SubscriptionRequestsController],
  providers: [SubscriptionRequestsService, SequenceService],
  exports: [SubscriptionRequestsService],
})
export class SubscriptionRequestsModule {}
