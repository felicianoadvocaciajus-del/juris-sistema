import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    userId?: string;
    type?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { userId, type, isRead, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AlertWhereInput = {};

    if (userId) where.userId = userId;
    if (type) where.type = type as any;
    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.alert.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: {
    type: string;
    severity?: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
  }) {
    return this.prisma.alert.create({
      data: {
        type: data.type as any,
        severity: (data.severity as any) || 'INFO',
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
      },
    });
  }

  async markAsRead(id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      throw new NotFoundException('Alerta nao encontrado');
    }

    return this.prisma.alert.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.alert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Todos os alertas marcados como lidos' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.alert.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
