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
import { MattersService } from './matters.service';
import { CreateMatterDto } from './dto/create-matter.dto';
import { UpdateMatterDto } from './dto/update-matter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Matters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matters')
export class MattersController {
  constructor(private readonly mattersService: MattersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar processos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'legalArea', required: false })
  @ApiQuery({ name: 'personId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('legalArea') legalArea?: string,
    @Query('personId') personId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.mattersService.findAll({
      search,
      status,
      legalArea,
      personId,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar processo por ID' })
  async findById(@Param('id') id: string) {
    return this.mattersService.findById(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Timeline do processo' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTimeline(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.mattersService.getTimeline(id, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo processo' })
  async create(
    @Body() dto: CreateMatterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mattersService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar processo' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMatterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mattersService.update(id, dto, user.sub);
  }
}
