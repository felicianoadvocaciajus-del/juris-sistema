import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ConversationAnalysis {
  classification: string;
  urgency: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  context: string;
  suggestedAction?: string;
  waitingResponse: boolean;
  lastClientMessage?: string;
  hoursWithoutResponse?: number;
}

@Injectable()
export class ConversationClassifierService {
  private readonly logger = new Logger(ConversationClassifierService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze a conversation and classify urgency/context
   */
  async analyzeConversation(conversationId: string): Promise<ConversationAnalysis> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        person: { select: { name: true, id: true } },
      },
    });

    if (!conversation) {
      return {
        classification: 'DESCONHECIDO',
        urgency: 'BAIXA',
        context: 'Conversa nao encontrada',
        waitingResponse: false,
      };
    }

    const messages = conversation.messages.reverse();
    const lastMsg = messages[messages.length - 1];
    const isLastFromClient = lastMsg && lastMsg.direction === 'INBOUND';

    // Calculate hours without response
    let hoursWithoutResponse = 0;
    if (isLastFromClient && lastMsg.createdAt) {
      hoursWithoutResponse = Math.floor(
        (Date.now() - new Date(lastMsg.createdAt).getTime()) / (1000 * 60 * 60),
      );
    }

    // Analyze message content for context
    const allText = messages.map((m) => m.content || '').join(' ').toLowerCase();
    const lastText = (lastMsg?.content || '').toLowerCase();

    // Classify context
    const context = this.detectContext(allText);

    // Detect urgency
    const urgency = this.detectUrgency(lastText, hoursWithoutResponse, isLastFromClient);

    // Suggested action
    let suggestedAction: string | undefined;
    if (isLastFromClient && hoursWithoutResponse >= 4) {
      suggestedAction = `Cliente ${conversation.contactName} aguarda resposta ha ${hoursWithoutResponse}h`;
    }
    if (urgency === 'URGENTE') {
      suggestedAction = `URGENTE: ${conversation.contactName} precisa de atencao imediata!`;
    }

    return {
      classification: conversation.classification || this.autoClassify(allText),
      urgency,
      context,
      suggestedAction,
      waitingResponse: isLastFromClient,
      lastClientMessage: isLastFromClient ? lastMsg.content : undefined,
      hoursWithoutResponse: isLastFromClient ? hoursWithoutResponse : undefined,
    };
  }

  /**
   * Get all conversations waiting for response, sorted by urgency
   */
  async getWaitingConversations() {
    const conversations = await this.prisma.conversation.findMany({
      where: { isArchived: false },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        person: { select: { name: true, id: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const waiting: any[] = [];

    for (const conv of conversations) {
      const lastMsg = conv.messages[0];
      if (!lastMsg || lastMsg.direction !== 'INBOUND') continue;

      const hoursAgo = Math.floor(
        (Date.now() - new Date(lastMsg.createdAt).getTime()) / (1000 * 60 * 60),
      );

      const lastText = (lastMsg.content || '').toLowerCase();
      const urgency = this.detectUrgency(lastText, hoursAgo, true);

      waiting.push({
        conversationId: conv.id,
        contactName: conv.contactName,
        contactPhone: conv.contactPhone,
        personName: conv.person?.name,
        personId: conv.person?.id,
        lastMessage: lastMsg.content?.substring(0, 200),
        hoursWithoutResponse: hoursAgo,
        urgency,
        context: this.detectContext(lastText),
        classification: conv.classification,
      });
    }

    // Sort by urgency then hours
    const urgencyOrder: Record<string, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
    waiting.sort((a: any, b: any) => {
      const uDiff = (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
      if (uDiff !== 0) return uDiff;
      return b.hoursWithoutResponse - a.hoursWithoutResponse;
    });

    return {
      total: waiting.length,
      urgentes: waiting.filter((w) => w.urgency === 'URGENTE').length,
      altas: waiting.filter((w) => w.urgency === 'ALTA').length,
      conversations: waiting,
    };
  }

  /**
   * Create alerts for conversations needing attention
   */
  async generateAlerts() {
    const waiting = await this.getWaitingConversations();
    const alertsCreated: string[] = [];

    for (const conv of waiting.conversations) {
      if (conv.hoursWithoutResponse < 2) continue;

      // Check if alert already exists for this conversation today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          type: 'CONVERSA',
          title: { contains: conv.contactName },
          createdAt: { gte: today },
        },
      });

      if (existingAlert) continue;

      let severity: 'INFO' | 'WARNING' | 'CRITICAL';
      let message: string;

      if (conv.urgency === 'URGENTE') {
        severity = 'CRITICAL';
        message = `URGENTE: ${conv.contactName} aguarda resposta ha ${conv.hoursWithoutResponse}h - "${conv.lastMessage?.substring(0, 100)}"`;
      } else if (conv.hoursWithoutResponse >= 12) {
        severity = 'CRITICAL';
        message = `${conv.contactName} sem resposta ha ${conv.hoursWithoutResponse}h`;
      } else if (conv.hoursWithoutResponse >= 4) {
        severity = 'WARNING';
        message = `${conv.contactName} aguarda resposta (${conv.hoursWithoutResponse}h)`;
      } else {
        continue;
      }

      await this.prisma.alert.create({
        data: {
          type: 'CONVERSA',
          severity,
          title: `WhatsApp: ${conv.contactName}`,
          message,
          entityType: 'conversation',
          entityId: conv.conversationId,
        },
      });

      alertsCreated.push(conv.contactName);
    }

    return {
      alertsCreated: alertsCreated.length,
      names: alertsCreated,
    };
  }

  private detectContext(text: string): string {
    const contexts: [RegExp, string][] = [
      [/prazo|venc|urgent|amanha|hoje/i, 'PRAZO_URGENTE'],
      [/pagar|pagament|boleto|pix|valor|honor/i, 'FINANCEIRO'],
      [/audi[eê]ncia|per[ií]cia/i, 'AUDIENCIA'],
      [/document|certid|procura[cç]/i, 'DOCUMENTOS'],
      [/processo|andamento|despacho|senten/i, 'ANDAMENTO_PROCESSO'],
      [/consulta|reuni|agendar|hor[aá]rio/i, 'AGENDAMENTO'],
      [/obrigad|agradec/i, 'AGRADECIMENTO'],
      [/oi|bom dia|boa tarde|boa noite|ol[aá]/i, 'SAUDACAO'],
    ];

    for (const [regex, ctx] of contexts) {
      if (regex.test(text)) return ctx;
    }
    return 'GERAL';
  }

  private detectUrgency(
    text: string,
    hoursWithoutResponse: number,
    isFromClient: boolean,
  ): 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE' {
    if (!isFromClient) return 'BAIXA';

    // Urgent keywords
    if (/urgent|socorro|por favor|ajud|desesper|prazo.*amanha|prazo.*hoje/i.test(text)) {
      return 'URGENTE';
    }

    // Time-based urgency
    if (hoursWithoutResponse >= 24) return 'ALTA';
    if (hoursWithoutResponse >= 8) return 'MEDIA';
    if (hoursWithoutResponse >= 2) return 'MEDIA';

    return 'BAIXA';
  }

  private autoClassify(text: string): string {
    if (/advogad|procura[cç][aã]o|oab/i.test(text)) return 'ADVOGADO';
    if (/juiz|tribunal|vara|foro|cart[oó]rio/i.test(text)) return 'TRIBUNAL';
    if (/processo|caso|a[cç][aã]o|peti[cç]/i.test(text)) return 'CLIENTE';
    return 'NAO_CLASSIFICADO';
  }
}
