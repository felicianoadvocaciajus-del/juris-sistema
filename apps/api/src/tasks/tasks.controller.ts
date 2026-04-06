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
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tarefas' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'matterId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('matterId') matterId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tasksService.findAll({
      status,
      priority,
      assignedToId,
      matterId,
      page,
      limit,
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Minhas tarefas' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async myTasks(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tasksService.findAll({
      assignedToId: user.sub,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tarefa por ID' })
  async findById(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar tarefa' })
  async create(
    @Body()
    body: {
      title: string;
      description?: string;
      matterId?: string;
      personId?: string;
      deadlineId?: string;
      assignedToId?: string;
      priority?: string;
      dueDate?: string;
      checklist?: any;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.create(body, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignedToId?: string;
      dueDate?: string;
      checklist?: any;
    },
  ) {
    return this.tasksService.update(id, body);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Concluir tarefa' })
  async complete(@Param('id') id: string) {
    return this.tasksService.complete(id);
  }
}
