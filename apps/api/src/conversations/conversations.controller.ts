import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar conversas' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'classification', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'personId', required: false })
  @ApiQuery({ name: 'isArchived', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('classification') classification?: string,
    @Query('channel') channel?: string,
    @Query('personId') personId?: string,
    @Query('isArchived') isArchived?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.findAll({
      search,
      classification,
      channel,
      personId,
      isArchived,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conversa com mensagens' })
  async findById(@Param('id') id: string) {
    return this.conversationsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova conversa' })
  async create(
    @Body()
    body: {
      channel: string;
      contactName?: string;
      contactPhone?: string;
      subject?: string;
      personId?: string;
      matterId?: string;
      assignedToId?: string;
    },
  ) {
    return this.conversationsService.create(body);
  }

  @Patch(':id/classify')
  @ApiOperation({ summary: 'Classificar conversa' })
  async classify(
    @Param('id') id: string,
    @Body()
    body: {
      classification: string;
      personId?: string;
      matterId?: string;
    },
  ) {
    return this.conversationsService.classify(
      id,
      body.classification,
      body.personId,
      body.matterId,
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Adicionar mensagem a conversa' })
  async addMessage(
    @Param('id') id: string,
    @Body()
    body: {
      direction: string;
      content: string;
      senderName?: string;
      senderPhone?: string;
    },
  ) {
    return this.conversationsService.addMessage(id, body);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Arquivar conversa' })
  async archive(@Param('id') id: string) {
    return this.conversationsService.archive(id);
  }
}
