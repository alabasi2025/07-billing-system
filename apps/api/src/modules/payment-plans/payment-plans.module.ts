import { Module } from '@nestjs/common';
import { PaymentPlansController } from './payment-plans.controller';
import { PaymentPlansService } from './payment-plans.service';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  controllers: [PaymentPlansController],
  providers: [PaymentPlansService, PrismaService, SequenceService],
  exports: [PaymentPlansService],
})
export class PaymentPlansModule {}
