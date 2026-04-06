import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleMessage(payload: any) {
    try {
      const event = payload.event;

      if (event !== 'messages.upsert') {
        return { status: 'ignored', reason: `event: ${event}` };
      }

      const data = payload.data;
      if (!data) {
        return { status: 'ignored', reason: 'no data' };
      }

      const message = data;
      const key = message.key;
      if (!key) {
        return { status: 'ignored', reason: 'no key' };
      }

      // Skip status messages and group messages (focus on direct chats)
      if (key.remoteJid === 'status@broadcast') {
        return { status: 'ignored', reason: 'status broadcast' };
      }

      const isFromMe = key.fromMe === true;
      const remoteJid = key.remoteJid || '';
      const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      const isGroup = remoteJid.endsWith('@g.us');

      // Extract message content
      const content = this.extractContent(message.message);
      if (!content) {
        return { status: 'ignored', reason: 'no text content' };
      }

      const contactName = message.pushName || phone;

      // Find or create conversation by phone number
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          contactPhone: phone,
          channel: 'WHATSAPP',
          isArchived: false,
        },
      });

      if (!conversation) {
        // Try to find person by whatsapp number
        const person = await this.prisma.person.findFirst({
          where: {
            OR: [
              { whatsapp: phone },
              { whatsapp: `+55${phone}` },
              { phone: phone },
              { phone: `+55${phone}` },
            ],
          },
        });

        conversation = await this.prisma.conversation.create({
          data: {
            channel: 'WHATSAPP',
            contactName,
            contactPhone: phone,
            subject: isGroup ? `Grupo: ${contactName}` : `WhatsApp - ${contactName}`,
            personId: person?.id || null,
            classification: person ? 'CLIENTE' : 'NAO_CLASSIFICADO',
            lastMessageAt: new Date(),
          },
        });

        this.logger.log(`Nova conversa criada: ${contactName} (${phone})`);
      }

      // Add message
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: isFromMe ? 'OUTBOUND' : 'INBOUND',
          content,
          senderName: isFromMe ? 'Escritorio' : contactName,
          senderPhone: phone,
          metadata: {
            messageId: key.id,
            isGroup,
            timestamp: message.messageTimestamp,
          },
        },
      });

      // Update conversation last message time
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          contactName: !isFromMe ? contactName : conversation.contactName,
        },
      });

      this.logger.log(
        `Mensagem ${isFromMe ? 'enviada' : 'recebida'}: ${contactName} (${phone}) - ${content.substring(0, 50)}...`,
      );

      return { status: 'ok', conversationId: conversation.id };
    } catch (error) {
      this.logger.error('Erro ao processar webhook WhatsApp:', error);
      return { status: 'error', message: error.message };
    }
  }

  private extractContent(msg: any): string | null {
    if (!msg) return null;
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return `[Imagem] ${msg.imageMessage.caption}`;
    if (msg.imageMessage) return '[Imagem]';
    if (msg.videoMessage?.caption) return `[Video] ${msg.videoMessage.caption}`;
    if (msg.videoMessage) return '[Video]';
    if (msg.audioMessage) return '[Audio]';
    if (msg.documentMessage) return `[Documento] ${msg.documentMessage?.fileName || ''}`;
    if (msg.stickerMessage) return '[Figurinha]';
    if (msg.contactMessage) return `[Contato] ${msg.contactMessage?.displayName || ''}`;
    if (msg.locationMessage) return '[Localizacao]';
    return null;
  }
}
