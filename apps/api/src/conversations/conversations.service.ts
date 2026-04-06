import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    classification?: string;
    channel?: string;
    personId?: string;
    isArchived?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      classification,
      channel,
      personId,
      isArchived,
      page = 1,
      limit = 20,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {};

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classification) where.classification = classification as any;
    if (channel) where.channel = channel as any;
    if (personId) where.personId = personId;
    if (isArchived !== undefined) where.isArchived = isArchived;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        include: {
          person: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, name: true } },
        matter: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
        messages: {
          include: {
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Conversa nao encontrada');
    }
    return conversation;
  }

  async create(data: {
    channel: string;
    contactName?: string;
    contactPhone?: string;
    subject?: string;
    personId?: string;
    matterId?: string;
    assignedToId?: string;
  }) {
    return this.prisma.conversation.create({
      data: {
        channel: data.channel as any,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        subject: data.subject,
        personId: data.personId,
        matterId: data.matterId,
        assignedToId: data.assignedToId,
      },
    });
  }

  async classify(
    id: string,
    classification: string,
    personId?: string,
    matterId?: string,
  ) {
    await this.findById(id);

    return this.prisma.conversation.update({
      where: { id },
      data: {
        classification: classification as any,
        ...(personId && { personId }),
        ...(matterId && { matterId }),
      },
    });
  }

  async addMessage(
    conversationId: string,
    data: {
      direction: string;
      content: string;
      senderName?: string;
      senderPhone?: string;
    },
  ) {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: data.direction as any,
        content: data.content,
        senderName: data.senderName,
        senderPhone: data.senderPhone,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async archive(id: string) {
    await this.findById(id);
    return this.prisma.conversation.update({
      where: { id },
      data: { isArchived: true },
    });
  }
}
