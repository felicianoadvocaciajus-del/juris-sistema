import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    matterId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, priority, assignedToId, matterId } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (assignedToId) where.assignedToId = assignedToId;
    if (matterId) where.matterId = matterId;

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          matter: { select: { id: true, title: true } },
          person: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          deadline: { select: { id: true, description: true, suggestedEndDate: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        matter: { select: { id: true, title: true } },
        person: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        deadline: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Tarefa nao encontrada');
    }
    return task;
  }

  async create(
    data: {
      title: string;
      description?: string;
      matterId?: string;
      personId?: string;
      deadlineId?: string;
      assignedToId?: string;
      priority?: string;
      dueDate?: string;
      checklist?: any;
    },
    createdById: string,
  ) {
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        matterId: data.matterId,
        personId: data.personId,
        deadlineId: data.deadlineId,
        assignedToId: data.assignedToId,
        priority: (data.priority as any) || 'MEDIA',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        checklist: data.checklist,
        createdById,
      },
    });

    if (data.matterId) {
      await this.prisma.timelineEvent.create({
        data: {
          matterId: data.matterId,
          personId: data.personId,
          type: 'TAREFA',
          title: 'Tarefa criada',
          description: `Tarefa "${data.title}" criada`,
          createdById,
        },
      });
    }

    return task;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignedToId?: string;
      dueDate?: string;
      checklist?: any;
    },
  ) {
    await this.findById(id);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status as any }),
        ...(data.priority && { priority: data.priority as any }),
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.checklist !== undefined && { checklist: data.checklist }),
        ...(data.status === 'CONCLUIDA' && { completedAt: new Date() }),
      },
    });
  }

  async complete(id: string) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: { status: 'CONCLUIDA', completedAt: new Date() },
    });
  }
}
