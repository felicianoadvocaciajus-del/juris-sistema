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
import { PublicationsService } from './publications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Publications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar publicacoes' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'matterId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('matterId') matterId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.publicationsService.findAll({
      search,
      status,
      matterId,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar publicacao por ID' })
  async findById(@Param('id') id: string) {
    return this.publicationsService.findById(id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar publicacao' })
  async import(
    @Body()
    body: {
      rawContent: string;
      source?: string;
      processNumber?: string;
      court?: string;
      organ?: string;
      parties?: string;
      lawyers?: string[];
      actType?: string;
      relevantText?: string;
      mentionedDeadline?: string;
      keywords?: string[];
      publishedAt?: string;
      matterId?: string;
      personId?: string;
    },
  ) {
    return this.publicationsService.import(body);
  }

  @Patch(':id/process')
  @ApiOperation({ summary: 'Processar publicacao' })
  async process(
    @Param('id') id: string,
    @Body()
    body: {
      matterId?: string;
      personId?: string;
      procedureType?: string;
      relevantText?: string;
      keywords?: string[];
      status: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.publicationsService.process(id, body, user.sub);
  }
}
