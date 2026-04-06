import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatterDto } from './dto/create-matter.dto';
import { UpdateMatterDto } from './dto/update-matter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MattersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    legalArea?: string;
    personId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, legalArea, personId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MatterWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { courtNumber: { contains: search } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status as any;
    if (legalArea) where.legalArea = legalArea as any;
    if (personId) where.personId = personId;

    const [data, total] = await Promise.all([
      this.prisma.matter.findMany({
        where,
        skip,
        take: limit,
        include: {
          person: { select: { id: true, name: true } },
          responsible: { select: { id: true, name: true } },
          _count: {
            select: {
              documents: true,
              deadlines: true,
              tasks: true,
              publications: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.matter.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const matter = await this.prisma.matter.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, name: true, cpfCnpj: true } },
        responsible: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        documents: {
          select: { id: true, name: true, fileType: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        deadlines: {
          select: {
            id: true,
            description: true,
            status: true,
            suggestedEndDate: true,
            confirmedEndDate: true,
          },
          orderBy: { suggestedEndDate: 'asc' },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
          orderBy: { dueDate: 'asc' },
        },
        feeAgreements: {
          select: { id: true, type: true, totalAmount: true, isActive: true },
        },
        _count: {
          select: { conversations: true, publications: true },
        },
      },
    });
    if (!matter) {
      throw new NotFoundException('Processo nao encontrado');
    }
    return matter;
  }

  async create(dto: CreateMatterDto, createdById: string) {
    const matter = await this.prisma.matter.create({
      data: {
        title: dto.title,
        description: dto.description,
        personId: dto.personId,
        legalArea: dto.legalArea as any,
        courtNumber: dto.courtNumber,
        court: dto.court,
        jurisdiction: dto.jurisdiction,
        nextSteps: dto.nextSteps,
        responsibleId: dto.responsibleId,
        createdById,
      },
    });

    await this.prisma.timelineEvent.create({
      data: {
        matterId: matter.id,
        personId: dto.personId,
        type: 'STATUS_CHANGE',
        title: 'Processo criado',
        description: `Processo "${dto.title}" criado`,
        createdById,
      },
    });

    return matter;
  }

  async update(id: string, dto: UpdateMatterDto, updatedById: string) {
    const existing = await this.findById(id);

    const matter = await this.prisma.matter.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.legalArea && { legalArea: dto.legalArea as any }),
        ...(dto.courtNumber !== undefined && { courtNumber: dto.courtNumber }),
        ...(dto.court !== undefined && { court: dto.court }),
        ...(dto.jurisdiction !== undefined && { jurisdiction: dto.jurisdiction }),
        ...(dto.nextSteps !== undefined && { nextSteps: dto.nextSteps }),
        ...(dto.responsibleId && { responsibleId: dto.responsibleId }),
      },
    });

    if (dto.status && dto.status !== existing.status) {
      await this.prisma.timelineEvent.create({
        data: {
          matterId: id,
          personId: existing.personId,
          type: 'STATUS_CHANGE',
          title: 'Status alterado',
          description: `Status alterado de ${existing.status} para ${dto.status}`,
          createdById: updatedById,
        },
      });
    }

    return matter;
  }

  async getTimeline(matterId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.timelineEvent.findMany({
        where: { matterId },
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.timelineEvent.count({ where: { matterId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
