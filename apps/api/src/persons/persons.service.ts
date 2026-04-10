import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PersonWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpfCnpj: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { whatsapp: { contains: search } },
      ];
    }

    if (status) {
      where.status = status as any;
    }

    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        skip,
        take: limit,
        include: {
          responsible: {
            select: { id: true, name: true },
          },
          _count: {
            select: { matters: true, conversations: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.person.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
        responsible: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        matters: {
          select: {
            id: true,
            title: true,
            status: true,
            legalArea: true,
            courtNumber: true,
            court: true,
            description: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
        documents: {
          select: {
            id: true,
            name: true,
            localPath: true,
            storagePath: true,
            fileSize: true,
            tags: true,
            origin: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        conversations: {
          select: {
            id: true,
            contactName: true,
            contactPhone: true,
            subject: true,
            lastMessageAt: true,
            channel: true,
            classification: true,
          },
          orderBy: { lastMessageAt: 'desc' },
          take: 20,
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
          select: {
            id: true,
            type: true,
            totalAmount: true,
            installments: {
              select: {
                id: true,
                amount: true,
                dueDate: true,
                status: true,
                paidAmount: true,
                paidAt: true,
              },
              orderBy: { dueDate: 'asc' },
            },
          },
        },
        _count: {
          select: {
            conversations: true,
            documents: true,
            feeAgreements: true,
            tasks: true,
          },
        },
      },
    });
    if (!person) {
      throw new NotFoundException('Pessoa nao encontrada');
    }
    return person;
  }

  async create(dto: CreatePersonDto, createdById: string) {
    return this.prisma.person.create({
      data: {
        ...dto,
        status: (dto.status as any) || 'NAO_CLASSIFICADO',
        type: dto.type as any,
        tags: dto.tags || [],
        createdById,
      },
    });
  }

  async update(id: string, dto: UpdatePersonDto) {
    await this.findById(id);

    const data: any = { ...dto };
    if (dto.type) data.type = dto.type;
    if (dto.status) data.status = dto.status;

    return this.prisma.person.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.person.delete({ where: { id } });
    return { message: 'Pessoa removida com sucesso' };
  }
}
