import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { PublicationsService } from './publications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

  @Post('extract-pdf')
  @ApiOperation({ summary: 'Extrair texto de PDF para publicacao' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async extractPdf(@UploadedFile() file: any) {
    if (!file) {
      return { text: '' };
    }

    try {
      // Extrair texto do PDF usando pdfjs-dist
      const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
      const data = new Uint8Array(file.buffer);
      const doc = await pdfjsLib.getDocument({ data }).promise;
      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }

      if (text.trim().length > 10) {
        return { text: text.substring(0, 100000) };
      }

      return { text: '', error: 'PDF sem texto extraivel. Cole o texto manualmente.' };
    } catch (err) {
      return { text: '', error: 'Erro ao ler PDF: ' + (err?.message || 'desconhecido') };
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar publicacao' })
  async import(
    @Body()
    body: {
      rawContent?: string;
      text?: string;
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
    // Aceitar tanto rawContent quanto text
    const importData = {
      ...body,
      rawContent: body.rawContent || body.text || '',
    };
    return this.publicationsService.import(importData as any);
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
