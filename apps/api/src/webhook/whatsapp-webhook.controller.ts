import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WhatsappWebhookService } from './whatsapp-webhook.service';

@Controller('webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly service: WhatsappWebhookService) {}

  @Post('whatsapp')
  async receiveWhatsapp(@Body() body: any) {
    this.logger.log(`Webhook recebido: ${body?.event || 'unknown'}`);
    return this.service.handleMessage(body);
  }
}
