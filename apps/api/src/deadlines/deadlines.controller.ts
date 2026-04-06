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
import { DeadlinesService } from './deadlines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Deadlines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deadlines')
export class DeadlinesController {
  constructor(private readonly deadlinesService: DeadlinesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar prazos' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'matterId', required: false })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: string,
    @Query('matterId') matterId?: string,
    @Query('overdue') overdue?: boolean,
    @Query('upcoming') upcoming?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.deadlinesService.findAll({
      status,
      matterId,
      overdue,
      upcoming,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar prazo por ID' })
  async findById(@Param('id') id: string) {
    return this.deadlinesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar prazo' })
  async create(
    @Body()
    body: {
      description: string;
      procedureType: string;
      dayCountType: string;
      dayCount: number;
      startDate: string;
      matterId?: string;
      personId?: string;
      publicationId?: string;
      legalBasis?: string;
      calculationNotes?: string;
    },
  ) {
    return this.deadlinesService.create(body);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirmar prazo' })
  async confirm(
    @Param('id') id: string,
    @Body() body: { confirmedEndDate: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deadlinesService.confirm(id, body.confirmedEndDate, user.sub);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar prazo como cumprido' })
  async markCompleted(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deadlinesService.markCompleted(id, user.sub);
  }

  @Patch(':id/lost')
  @ApiOperation({ summary: 'Marcar prazo como perdido' })
  async markLost(@Param('id') id: string) {
    return this.deadlinesService.markLost(id);
  }
}
