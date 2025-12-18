import { Module } from '@nestjs/common';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { DatabaseModule } from '../../database/database.module';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService, SequenceService],
  exports: [CustomerPortalService],
})
export class CustomerPortalModule {}
