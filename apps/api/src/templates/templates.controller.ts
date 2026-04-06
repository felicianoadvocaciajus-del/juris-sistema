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
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar templates' })
  @ApiQuery({ name: 'category', required: false })
  async findAll(@Query('category') category?: string) {
    return this.templatesService.findAll(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  async findById(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar template' })
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      content: string;
      category?: string;
    },
  ) {
    return this.templatesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar template' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      content?: string;
      category?: string;
      isActive?: boolean;
    },
  ) {
    return this.templatesService.update(id, body);
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Renderizar template com variaveis' })
  async render(
    @Param('id') id: string,
    @Body() body: { variables: Record<string, any> },
  ) {
    const html = await this.templatesService.render(id, body.variables);
    return { html };
  }

  @Post(':id/generate-pdf')
  @ApiOperation({ summary: 'Gerar PDF a partir do template' })
  async generatePdf(
    @Param('id') id: string,
    @Body()
    body: {
      variables: Record<string, any>;
      outputPath?: string;
    },
  ) {
    return this.templatesService.generatePdf(
      id,
      body.variables,
      body.outputPath,
    );
  }
}
