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
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alertas' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
    @Query('isRead') isRead?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.alertsService.findAll({
      userId: user.sub,
      type,
      isRead,
      page,
      limit,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contagem de alertas nao lidos' })
  async unreadCount(@CurrentUser() user: JwtPayload) {
    return this.alertsService.getUnreadCount(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Criar alerta' })
  async create(
    @Body()
    body: {
      type: string;
      severity?: string;
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
      userId?: string;
    },
  ) {
    return this.alertsService.create(body);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar alerta como lido' })
  async markAsRead(@Param('id') id: string) {
    return this.alertsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todos como lidos' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.alertsService.markAllAsRead(user.sub);
  }
}
