import { Controller, Post, Get, Param, Body, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { ConversationClassifierService } from './conversation-classifier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly service: WhatsappWebhookService,
    private readonly classifier: ConversationClassifierService,
  ) {}

  @Post('whatsapp')
  async receiveWhatsapp(@Body() body: any) {
    this.logger.log(`Webhook recebido: ${body?.event || 'unknown'}`);
    return this.service.handleMessage(body);
  }
}

@ApiTags('WhatsApp Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsAnalysisController {
  constructor(private readonly classifier: ConversationClassifierService) {}

  @Get('waiting')
  @ApiOperation({ summary: 'Conversas aguardando resposta (ordenadas por urgencia)' })
  async getWaiting() {
    return this.classifier.getWaitingConversations();
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Analisar conversa (classificacao, urgencia, contexto)' })
  async analyzeConversation(@Param('id') id: string): Promise<any> {
    return this.classifier.analyzeConversation(id);
  }

  @Post('generate-alerts')
  @ApiOperation({ summary: 'Gerar alertas para conversas sem resposta' })
  async generateAlerts() {
    return this.classifier.generateAlerts();
  }
}
