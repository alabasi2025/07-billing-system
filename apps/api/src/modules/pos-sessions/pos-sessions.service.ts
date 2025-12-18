import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SequenceService } from '../../common/utils/sequence.service';
import { OpenSessionDto, CloseSessionDto, CreatePosTransactionDto, VoidTransactionDto } from './dto';

@Injectable()
export class PosSessionsService {
  constructor(
    private prisma: PrismaService,
    private sequenceService: SequenceService,
  ) {}

  // ==================== جلسات نقاط البيع ====================

  async openSession(dto: OpenSessionDto) {
    // التحقق من وجود نقطة البيع
    const terminal = await this.prisma.billPosTerminal.findFirst({
      where: { id: dto.terminalId, isDeleted: false, status: 'active' },
    });

    if (!terminal) {
      throw new NotFoundException('نقطة البيع غير موجودة أو غير نشطة');
    }

    // التحقق من عدم وجود جلسة مفتوحة
    const openSession = await this.prisma.billPosSession.findFirst({
      where: { terminalId: dto.terminalId, status: 'open', isDeleted: false },
    });

    if (openSession) {
      throw new ConflictException('يوجد جلسة مفتوحة بالفعل لنقطة البيع هذه');
    }

    // إنشاء رقم الجلسة
    const sessionNumber = await this.sequenceService.getNextNumber('POS-SESSION');

    return this.prisma.billPosSession.create({
      data: {
        terminalId: dto.terminalId,
        sessionNumber,
        cashierId: dto.cashierId,
        openingCash: dto.openingCash,
        openingNotes: dto.openingNotes,
        status: 'open',
      },
      include: {
        terminal: true,
      },
    });
  }

  async closeSession(id: string, dto: CloseSessionDto) {
    const session = await this.prisma.billPosSession.findFirst({
      where: { id, isDeleted: false },
      include: {
        transactions: {
          where: { isDeleted: false, status: 'completed' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('الجلسة غير موجودة');
    }

    if (session.status !== 'open') {
      throw new BadRequestException('الجلسة مغلقة بالفعل');
    }

    // حساب الرصيد المتوقع
    const totalCashReceived = session.transactions
      .filter(t => ['invoice_payment', 'advance_payment', 'deposit'].includes(t.transactionType))
      .reduce((sum, t) => sum + Number(t.cashAmount), 0);

    const totalRefunds = session.transactions
      .filter(t => t.transactionType === 'refund')
      .reduce((sum, t) => sum + Number(t.cashAmount), 0);

    const expectedCash = Number(session.openingCash) + totalCashReceived - totalRefunds;
    const cashDifference = dto.closingCash - expectedCash;

    return this.prisma.billPosSession.update({
      where: { id },
      data: {
        closingCash: dto.closingCash,
        expectedCash,
        cashDifference,
        closingNotes: dto.closingNotes,
        closedAt: new Date(),
        status: 'closed',
      },
      include: {
        terminal: true,
        transactions: {
          where: { isDeleted: false },
        },
      },
    });
  }

  async findCurrentSession(terminalId: string) {
    const session = await this.prisma.billPosSession.findFirst({
      where: { terminalId, status: 'open', isDeleted: false },
      include: {
        terminal: true,
        transactions: {
          where: { isDeleted: false },
          orderBy: { transactionTime: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('لا توجد جلسة مفتوحة لنقطة البيع هذه');
    }

    return session;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    terminalId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const { skip = 0, take = 10, terminalId, status, fromDate, toDate } = params;

    const where: any = { isDeleted: false };

    if (terminalId) where.terminalId = terminalId;
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.openedAt = {};
      if (fromDate) where.openedAt.gte = fromDate;
      if (toDate) where.openedAt.lte = toDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.billPosSession.findMany({
        where,
        skip,
        take,
        orderBy: { openedAt: 'desc' },
        include: {
          terminal: true,
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.billPosSession.count({ where }),
    ]);

    return { data, meta: { total, skip, take, hasMore: skip + take < total } };
  }

  async findOne(id: string) {
    const session = await this.prisma.billPosSession.findFirst({
      where: { id, isDeleted: false },
      include: {
        terminal: true,
        transactions: {
          where: { isDeleted: false },
          orderBy: { transactionTime: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('الجلسة غير موجودة');
    }

    return session;
  }

  // ==================== معاملات نقاط البيع ====================

  async createTransaction(dto: CreatePosTransactionDto) {
    // التحقق من الجلسة
    const session = await this.prisma.billPosSession.findFirst({
      where: { id: dto.sessionId, status: 'open', isDeleted: false },
    });

    if (!session) {
      throw new NotFoundException('الجلسة غير موجودة أو مغلقة');
    }

    // التحقق من العميل
    const customer = await this.prisma.billCustomer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    // إنشاء رقم المعاملة
    const transactionNumber = await this.sequenceService.getNextNumber('POS-TRX');
    const receiptNumber = await this.sequenceService.getNextNumber('RCV');

    // حساب الباقي
    const changeGiven = dto.amountTendered ? dto.amountTendered - dto.amount : 0;

    // إنشاء المعاملة
    const transaction = await this.prisma.billPosTransaction.create({
      data: {
        sessionId: dto.sessionId,
        transactionNumber,
        customerId: dto.customerId,
        invoiceId: dto.invoiceId,
        transactionType: dto.transactionType,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        cashAmount: dto.cashAmount || (dto.paymentMethod === 'cash' ? dto.amount : 0),
        cardAmount: dto.cardAmount || (dto.paymentMethod === 'card' ? dto.amount : 0),
        cardLastFour: dto.cardLastFour,
        cardApprovalCode: dto.cardApprovalCode,
        amountTendered: dto.amountTendered,
        changeGiven: changeGiven > 0 ? changeGiven : 0,
        receiptNumber,
        status: 'completed',
      },
    });

    // تحديث إحصائيات الجلسة
    await this.prisma.billPosSession.update({
      where: { id: dto.sessionId },
      data: {
        totalCashReceived: { increment: dto.cashAmount || 0 },
        totalCardReceived: { increment: dto.cardAmount || 0 },
        totalTransactions: { increment: 1 },
      },
    });

    // تحديث الفاتورة إذا كانت موجودة
    if (dto.invoiceId && dto.transactionType === 'invoice_payment') {
      await this.prisma.billInvoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: { increment: dto.amount },
          status: 'paid', // سيتم تحديثه بناءً على المبلغ المتبقي
        },
      });

      // إنشاء سجل دفع
      const paymentNo = await this.sequenceService.getNextNumber('PAY');
      await this.prisma.billPayment.create({
        data: {
          paymentNo,
          customerId: dto.customerId,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          paymentDate: new Date(),
          referenceNo: transactionNumber,
          status: 'completed',
          notes: `دفع من نقطة البيع - سند قبض رقم: ${receiptNumber}`,
        },
      });
    }

    return transaction;
  }

  async voidTransaction(id: string, dto: VoidTransactionDto) {
    const transaction = await this.prisma.billPosTransaction.findFirst({
      where: { id, isDeleted: false },
      include: { session: true },
    });

    if (!transaction) {
      throw new NotFoundException('المعاملة غير موجودة');
    }

    if (transaction.status === 'voided') {
      throw new BadRequestException('المعاملة ملغاة بالفعل');
    }

    if (transaction.session.status !== 'open') {
      throw new BadRequestException('لا يمكن إلغاء معاملة في جلسة مغلقة');
    }

    // إلغاء المعاملة
    const updated = await this.prisma.billPosTransaction.update({
      where: { id },
      data: {
        status: 'voided',
        voidReason: dto.voidReason,
        voidedBy: dto.voidedBy,
        voidedAt: new Date(),
      },
    });

    // تحديث إحصائيات الجلسة
    await this.prisma.billPosSession.update({
      where: { id: transaction.sessionId },
      data: {
        totalCashReceived: { decrement: Number(transaction.cashAmount) },
        totalCardReceived: { decrement: Number(transaction.cardAmount) },
        totalTransactions: { decrement: 1 },
      },
    });

    return updated;
  }

  async getSessionReport(id: string) {
    const session = await this.findOne(id);

    const transactions = session.transactions;
    
    const summary = {
      totalTransactions: transactions.filter(t => t.status === 'completed').length,
      voidedTransactions: transactions.filter(t => t.status === 'voided').length,
      totalCash: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.cashAmount), 0),
      totalCard: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.cardAmount), 0),
      totalAmount: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      byType: {
        invoicePayment: transactions.filter(t => t.transactionType === 'invoice_payment' && t.status === 'completed').length,
        advancePayment: transactions.filter(t => t.transactionType === 'advance_payment' && t.status === 'completed').length,
        deposit: transactions.filter(t => t.transactionType === 'deposit' && t.status === 'completed').length,
        refund: transactions.filter(t => t.transactionType === 'refund' && t.status === 'completed').length,
      },
    };

    return {
      session,
      summary,
    };
  }

  async getDailyReport(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.billPosSession.findMany({
      where: {
        openedAt: { gte: startOfDay, lte: endOfDay },
        isDeleted: false,
      },
      include: {
        terminal: true,
        transactions: {
          where: { isDeleted: false, status: 'completed' },
        },
      },
    });

    const totalCash = sessions.reduce((sum, s) => 
      sum + s.transactions.reduce((tSum, t) => tSum + Number(t.cashAmount), 0), 0);
    
    const totalCard = sessions.reduce((sum, s) => 
      sum + s.transactions.reduce((tSum, t) => tSum + Number(t.cardAmount), 0), 0);

    const totalTransactions = sessions.reduce((sum, s) => 
      sum + s.transactions.length, 0);

    return {
      date,
      sessionsCount: sessions.length,
      totalTransactions,
      totalCash,
      totalCard,
      totalAmount: totalCash + totalCard,
      sessions: sessions.map(s => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        terminal: s.terminal.terminalName,
        status: s.status,
        transactionsCount: s.transactions.length,
        totalAmount: s.transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      })),
    };
  }
}
