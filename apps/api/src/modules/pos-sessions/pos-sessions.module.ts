import { Module } from '@nestjs/common';
import { PosSessionsController } from './pos-sessions.controller';
import { PosSessionsService } from './pos-sessions.service';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';

@Module({
  controllers: [PosSessionsController],
  providers: [PosSessionsService, PrismaService, SequenceService],
  exports: [PosSessionsService],
})
export class PosSessionsModule {}
