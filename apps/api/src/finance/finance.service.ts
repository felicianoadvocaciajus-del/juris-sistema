import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Fee Agreements ---

  async findAllAgreements(params: {
    personId?: string;
    matterId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { personId, matterId, isActive } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FeeAgreementWhereInput = {};
    if (personId) where.personId = personId;
    if (matterId) where.matterId = matterId;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.feeAgreement.findMany({
        where,
        skip,
        take: limit,
        include: {
          person: { select: { id: true, name: true } },
          matter: { select: { id: true, title: true } },
          _count: { select: { installments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feeAgreement.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAgreementById(id: string) {
    const agreement = await this.prisma.feeAgreement.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, name: true } },
        matter: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
        installments: {
          include: {
            payments: true,
          },
          orderBy: { number: 'asc' },
        },
      },
    });
    if (!agreement) {
      throw new NotFoundException('Acordo de honorarios nao encontrado');
    }
    return agreement;
  }

  async createAgreement(
    data: {
      personId: string;
      matterId?: string;
      type: string;
      totalAmount: number;
      downPayment?: number;
      installmentCount?: number;
      notes?: string;
    },
    createdById: string,
  ) {
    const agreement = await this.prisma.feeAgreement.create({
      data: {
        personId: data.personId,
        matterId: data.matterId,
        type: data.type as any,
        totalAmount: data.totalAmount,
        downPayment: data.downPayment || 0,
        installmentCount: data.installmentCount || 1,
        notes: data.notes,
        createdById,
      },
    });

    // Generate installments
    const netAmount = data.totalAmount - (data.downPayment || 0);
    const count = data.installmentCount || 1;
    const installmentAmount = Number(
      (netAmount / count).toFixed(2),
    );

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      const amount =
        i === count
          ? Number((netAmount - installmentAmount * (count - 1)).toFixed(2))
          : installmentAmount;

      await this.prisma.installment.create({
        data: {
          feeAgreementId: agreement.id,
          number: i,
          amount,
          dueDate,
        },
      });
    }

    if (data.matterId) {
      await this.prisma.timelineEvent.create({
        data: {
          matterId: data.matterId,
          personId: data.personId,
          type: 'PAGAMENTO',
          title: 'Acordo de honorarios criado',
          description: `Tipo: ${data.type}, Valor: R$ ${data.totalAmount}`,
          createdById,
        },
      });
    }

    return this.findAgreementById(agreement.id);
  }

  // --- Installments ---

  async findPendingInstallments(params: {
    overdue?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { overdue } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.InstallmentWhereInput = {
      status: { in: ['PENDENTE', 'VENCIDO'] },
    };

    if (overdue) {
      where.dueDate = { lt: now };
    }

    const [data, total] = await Promise.all([
      this.prisma.installment.findMany({
        where,
        skip,
        take: limit,
        include: {
          feeAgreement: {
            include: {
              person: { select: { id: true, name: true } },
              matter: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.installment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // --- Payments ---

  async registerPayment(
    data: {
      installmentId: string;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
      paidAt: string;
    },
    createdById: string,
  ) {
    const installment = await this.prisma.installment.findUnique({
      where: { id: data.installmentId },
      include: {
        feeAgreement: { select: { personId: true, matterId: true } },
      },
    });
    if (!installment) {
      throw new NotFoundException('Parcela nao encontrada');
    }

    const payment = await this.prisma.payment.create({
      data: {
        installmentId: data.installmentId,
        amount: data.amount,
        method: data.method as any,
        reference: data.reference,
        notes: data.notes,
        paidAt: new Date(data.paidAt),
        createdById,
      },
    });

    // Update installment status
    const totalPaid =
      Number(installment.paidAmount) + data.amount;
    const installmentAmount = Number(installment.amount);

    let newStatus: string;
    if (totalPaid >= installmentAmount) {
      newStatus = 'PAGO';
    } else {
      newStatus = 'PARCIAL';
    }

    await this.prisma.installment.update({
      where: { id: data.installmentId },
      data: {
        paidAmount: totalPaid,
        status: newStatus as any,
        ...(newStatus === 'PAGO' && { paidAt: new Date(data.paidAt) }),
      },
    });

    if (installment.feeAgreement.matterId) {
      await this.prisma.timelineEvent.create({
        data: {
          matterId: installment.feeAgreement.matterId,
          personId: installment.feeAgreement.personId,
          type: 'PAGAMENTO',
          title: 'Pagamento registrado',
          description: `R$ ${data.amount} via ${data.method}`,
          createdById,
        },
      });
    }

    return payment;
  }
}
