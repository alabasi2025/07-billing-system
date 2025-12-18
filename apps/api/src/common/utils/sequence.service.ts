import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextNumber(sequenceName: string): Promise<string> {
    const sequence = await this.prisma.billSequence.findUnique({
      where: { name: sequenceName },
    });

    if (!sequence) {
      throw new Error(`Sequence ${sequenceName} not found`);
    }

    // Check if reset is needed
    const now = new Date();
    let shouldReset = false;

    if (sequence.resetPeriod && sequence.lastReset) {
      const lastReset = new Date(sequence.lastReset);
      
      if (sequence.resetPeriod === 'yearly') {
        shouldReset = now.getFullYear() !== lastReset.getFullYear();
      } else if (sequence.resetPeriod === 'monthly') {
        shouldReset = now.getMonth() !== lastReset.getMonth() || 
                      now.getFullYear() !== lastReset.getFullYear();
      }
    }

    // Update sequence
    const updated = await this.prisma.billSequence.update({
      where: { name: sequenceName },
      data: {
        currentNo: shouldReset ? 1 : { increment: 1 },
        lastReset: shouldReset ? now : undefined,
      },
    });

    const nextNo = shouldReset ? 1 : updated.currentNo;
    const paddedNo = String(nextNo).padStart(sequence.padLength, '0');
    
    // Add year/month prefix if needed
    let prefix = sequence.prefix;
    if (sequence.resetPeriod === 'yearly') {
      prefix += now.getFullYear().toString();
    } else if (sequence.resetPeriod === 'monthly') {
      prefix += now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
    }

    return `${prefix}${paddedNo}`;
  }

  async initializeSequence(
    name: string,
    prefix: string,
    padLength = 6,
    resetPeriod?: string
  ): Promise<void> {
    await this.prisma.billSequence.upsert({
      where: { name },
      create: {
        name,
        prefix,
        padLength,
        resetPeriod,
        currentNo: 0,
        lastReset: new Date(),
      },
      update: {},
    });
  }
}
