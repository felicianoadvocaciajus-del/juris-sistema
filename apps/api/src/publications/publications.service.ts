import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    matterId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, matterId } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PublicationWhereInput = {};

    if (search) {
      where.OR = [
        { rawContent: { contains: search, mode: 'insensitive' } },
        { processNumber: { contains: search } },
        { parties: { contains: search, mode: 'insensitive' } },
        { keywords: { hasSome: [search] } },
      ];
    }

    if (status) where.status = status as any;
    if (matterId) where.matterId = matterId;

    const [data, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        skip,
        take: limit,
        include: {
          matter: { select: { id: true, title: true } },
          person: { select: { id: true, name: true } },
          processedBy: { select: { id: true, name: true } },
          _count: { select: { deadlines: true } },
        },
        orderBy: { importedAt: 'desc' },
      }),
      this.prisma.publication.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const pub = await this.prisma.publication.findUnique({
      where: { id },
      include: {
        matter: { select: { id: true, title: true, courtNumber: true } },
        person: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true } },
        deadlines: true,
      },
    });
    if (!pub) {
      throw new NotFoundException('Publicacao nao encontrada');
    }
    return pub;
  }

  async import(data: {
    rawContent: string;
    source?: string;
    processNumber?: string;
    court?: string;
    organ?: string;
    parties?: string;
    lawyers?: string[];
    actType?: string;
    relevantText?: string;
    mentionedDeadline?: string;
    keywords?: string[];
    publishedAt?: string;
    matterId?: string;
    personId?: string;
  }) {
    return this.prisma.publication.create({
      data: {
        rawContent: data.rawContent,
        source: data.source,
        processNumber: data.processNumber,
        court: data.court,
        organ: data.organ,
        parties: data.parties,
        lawyers: data.lawyers || [],
        actType: data.actType,
        relevantText: data.relevantText,
        mentionedDeadline: data.mentionedDeadline,
        keywords: data.keywords || [],
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        matterId: data.matterId,
        personId: data.personId,
      },
    });
  }

  async process(
    id: string,
    data: {
      matterId?: string;
      personId?: string;
      procedureType?: string;
      relevantText?: string;
      keywords?: string[];
      status: string;
    },
    processedById: string,
  ) {
    await this.findById(id);

    return this.prisma.publication.update({
      where: { id },
      data: {
        status: data.status as any,
        matterId: data.matterId,
        personId: data.personId,
        procedureType: data.procedureType as any,
        relevantText: data.relevantText,
        keywords: data.keywords,
        processedAt: new Date(),
        processedById,
      },
    });
  }
}
