import { Module } from '@nestjs/common';
import { WhatsappWebhookController, ConversationsAnalysisController } from './whatsapp-webhook.controller';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { ConversationClassifierService } from './conversation-classifier.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WhatsappWebhookController, ConversationsAnalysisController],
  providers: [WhatsappWebhookService, ConversationClassifierService],
  exports: [ConversationClassifierService],
})
export class WebhookModule {}
