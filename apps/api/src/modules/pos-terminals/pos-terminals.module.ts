import { Module } from '@nestjs/common';
import { PosTerminalsController } from './pos-terminals.controller';
import { PosTerminalsService } from './pos-terminals.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PosTerminalsController],
  providers: [PosTerminalsService, PrismaService],
  exports: [PosTerminalsService],
})
export class PosTerminalsModule {}
