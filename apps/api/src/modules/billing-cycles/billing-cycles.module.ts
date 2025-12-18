import { Module } from '@nestjs/common';
import { BillingCyclesController } from './billing-cycles.controller';
import { BillingCyclesService } from './billing-cycles.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [BillingCyclesController],
  providers: [BillingCyclesService, PrismaService],
  exports: [BillingCyclesService],
})
export class BillingCyclesModule {}
