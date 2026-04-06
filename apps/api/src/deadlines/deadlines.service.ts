import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeadlinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: string;
    matterId?: string;
    overdue?: boolean;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { status, matterId, overdue, upcoming, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.DeadlineWhereInput = {};

    if (status) where.status = status as any;
    if (matterId) where.matterId = matterId;

    if (overdue) {
      where.status = { in: ['SUGERIDO', 'CONFIRMADO'] };
      where.OR = [
        { confirmedEndDate: { lt: now } },
        { confirmedEndDate: null, suggestedEndDate: { lt: now } },
      ];
    }

    if (upcoming) {
      const sevenDays = new Date();
      sevenDays.setDate(now.getDate() + 7);
      where.status = { in: ['SUGERIDO', 'CONFIRMADO'] };
      where.OR = [
        { confirmedEndDate: { gte: now, lte: sevenDays } },
        { confirmedEndDate: null, suggestedEndDate: { gte: now, lte: sevenDays } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.deadline.findMany({
        where,
        skip,
        take: limit,
        include: {
          matter: { select: { id: true, title: true, courtNumber: true } },
          person: { select: { id: true, name: true } },
          confirmedBy: { select: { id: true, name: true } },
          publication: { select: { id: true, actType: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { suggestedEndDate: 'asc' },
      }),
      this.prisma.deadline.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const deadline = await this.prisma.deadline.findUnique({
      where: { id },
      include: {
        matter: { select: { id: true, title: true, courtNumber: true } },
        person: { select: { id: true, name: true } },
        publication: true,
        confirmedBy: { select: { id: true, name: true } },
        tasks: true,
      },
    });
    if (!deadline) {
      throw new NotFoundException('Prazo nao encontrado');
    }
    return deadline;
  }

  async create(data: {
    description: string;
    procedureType: string;
    dayCountType: string;
    dayCount: number;
    startDate: string;
    matterId?: string;
    personId?: string;
    publicationId?: string;
    legalBasis?: string;
    calculationNotes?: string;
  }) {
    const startDate = new Date(data.startDate);
    const suggestedEndDate = await this.calculateEndDate(
      startDate,
      data.dayCount,
      data.dayCountType,
    );

    return this.prisma.deadline.create({
      data: {
        description: data.description,
        procedureType: data.procedureType as any,
        dayCountType: data.dayCountType as any,
        dayCount: data.dayCount,
        startDate,
        suggestedEndDate,
        matterId: data.matterId,
        personId: data.personId,
        publicationId: data.publicationId,
        legalBasis: data.legalBasis,
        calculationNotes: data.calculationNotes,
      },
    });
  }

  async confirm(id: string, confirmedEndDate: string, confirmedById: string) {
    await this.findById(id);

    const deadline = await this.prisma.deadline.update({
      where: { id },
      data: {
        status: 'CONFIRMADO',
        confirmedEndDate: new Date(confirmedEndDate),
        confirmedById,
        confirmedAt: new Date(),
      },
    });

    if (deadline.matterId) {
      await this.prisma.timelineEvent.create({
        data: {
          matterId: deadline.matterId,
          personId: deadline.personId,
          type: 'PRAZO',
          title: 'Prazo confirmado',
          description: `Prazo "${deadline.description}" confirmado para ${confirmedEndDate}`,
          createdById: confirmedById,
        },
      });
    }

    return deadline;
  }

  async markCompleted(id: string, userId: string) {
    await this.findById(id);

    return this.prisma.deadline.update({
      where: { id },
      data: { status: 'CUMPRIDO' },
    });
  }

  async markLost(id: string) {
    await this.findById(id);
    return this.prisma.deadline.update({
      where: { id },
      data: { status: 'PERDIDO' },
    });
  }

  private async calculateEndDate(
    startDate: Date,
    dayCount: number,
    dayCountType: string,
  ): Promise<Date> {
    if (dayCountType === 'CORRIDOS') {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + dayCount);
      return endDate;
    }

    // UTEIS - skip weekends and holidays
    const holidays = await this.prisma.forensicCalendar.findMany({
      where: {
        date: { gte: startDate },
      },
      select: { date: true },
    });

    const holidaySet = new Set(
      holidays.map((h) => h.date.toISOString().split('T')[0]),
    );

    let currentDate = new Date(startDate);
    let businessDays = 0;

    while (businessDays < dayCount) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
        businessDays++;
      }
    }

    return currentDate;
  }
}
