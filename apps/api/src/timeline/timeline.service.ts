import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPerson(
    personId: string,
    params: { type?: string; page?: number; limit?: number } = {},
  ) {
    const { type, page = 1, limit = 30 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TimelineEventWhereInput = { personId };
    if (type) where.type = type as any;

    const [data, total] = await Promise.all([
      this.prisma.timelineEvent.findMany({
        where,
        skip,
        take: limit,
        include: {
          matter: { select: { id: true, title: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.timelineEvent.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByMatter(
    matterId: string,
    params: { type?: string; page?: number; limit?: number } = {},
  ) {
    const { type, page = 1, limit = 30 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TimelineEventWhereInput = { matterId };
    if (type) where.type = type as any;

    const [data, total] = await Promise.all([
      this.prisma.timelineEvent.findMany({
        where,
        skip,
        take: limit,
        include: {
          person: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.timelineEvent.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async addEvent(data: {
    personId?: string;
    matterId?: string;
    type: string;
    title: string;
    description?: string;
    metadata?: any;
    createdById?: string;
  }) {
    return this.prisma.timelineEvent.create({
      data: {
        personId: data.personId,
        matterId: data.matterId,
        type: data.type as any,
        title: data.title,
        description: data.description,
        metadata: data.metadata,
        createdById: data.createdById,
      },
    });
  }

  async findRecent(limit = 20) {
    return this.prisma.timelineEvent.findMany({
      include: {
        person: { select: { id: true, name: true } },
        matter: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
