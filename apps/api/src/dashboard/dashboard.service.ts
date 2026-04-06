import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const [
      unreadAlerts,
      pendingTasks,
      overdueDeadlines,
      upcomingDeadlines,
      pendingPayments,
      unclassifiedConversations,
      recentTimeline,
      activeMatters,
      totalClients,
    ] = await Promise.all([
      // Unread alerts for this user
      this.prisma.alert.count({
        where: { userId, isRead: false },
      }),

      // Pending tasks assigned to this user
      this.prisma.task.count({
        where: {
          assignedToId: userId,
          status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
        },
      }),

      // Overdue deadlines (confirmed or suggested end date in the past, not completed)
      this.prisma.deadline.count({
        where: {
          status: { in: ['SUGERIDO', 'CONFIRMADO'] },
          OR: [
            { confirmedEndDate: { lt: now } },
            {
              confirmedEndDate: null,
              suggestedEndDate: { lt: now },
            },
          ],
        },
      }),

      // Upcoming deadlines (next 7 days)
      this.prisma.deadline.findMany({
        where: {
          status: { in: ['SUGERIDO', 'CONFIRMADO'] },
          OR: [
            {
              confirmedEndDate: { gte: now, lte: sevenDaysFromNow },
            },
            {
              confirmedEndDate: null,
              suggestedEndDate: { gte: now, lte: sevenDaysFromNow },
            },
          ],
        },
        include: {
          matter: { select: { id: true, title: true } },
          person: { select: { id: true, name: true } },
        },
        orderBy: { suggestedEndDate: 'asc' },
        take: 10,
      }),

      // Pending installments (PENDENTE or VENCIDO)
      this.prisma.installment.count({
        where: { status: { in: ['PENDENTE', 'VENCIDO'] } },
      }),

      // Unclassified conversations
      this.prisma.conversation.count({
        where: { classification: 'NAO_CLASSIFICADO' },
      }),

      // Recent timeline events
      this.prisma.timelineEvent.findMany({
        include: {
          person: { select: { id: true, name: true } },
          matter: { select: { id: true, title: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),

      // Active matters count
      this.prisma.matter.count({
        where: { status: 'ATIVO' },
      }),

      // Total active clients
      this.prisma.person.count({
        where: { status: 'CLIENTE_ATIVO' },
      }),
    ]);

    return {
      unreadAlerts,
      pendingTasks,
      overdueDeadlines,
      upcomingDeadlines,
      pendingPayments,
      unclassifiedConversations,
      recentTimeline,
      activeMatters,
      totalClients,
    };
  }
}
