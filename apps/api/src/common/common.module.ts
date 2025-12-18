import { Module, Global } from '@nestjs/common';
import { SequenceService } from './utils/sequence.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [SequenceService],
  exports: [SequenceService],
})
export class CommonModule {}
