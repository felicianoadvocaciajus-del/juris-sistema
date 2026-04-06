import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { DocumentScannerService } from './document-scanner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly scannerService: DocumentScannerService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'personId', required: false })
  @ApiQuery({ name: 'matterId', required: false })
  @ApiQuery({ name: 'origin', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('personId') personId?: string,
    @Query('matterId') matterId?: string,
    @Query('origin') origin?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.documentsService.findAll({
      search,
      personId,
      matterId,
      origin,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  async findById(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload de documento' })
  async upload(
    @Body()
    body: {
      name: string;
      description?: string;
      personId?: string;
      matterId?: string;
      storagePath: string;
      localPath?: string;
      fileType?: string;
      fileSize?: number;
      tags?: string[];
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.upload({
      ...body,
      createdById: user.sub,
    });
  }

  @Post('index-local')
  @ApiOperation({ summary: 'Indexar diretorio local' })
  async indexLocal(
    @Body()
    body: {
      dirPath: string;
      matterId?: string;
      personId?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.indexLocalDirectory(
      body.dirPath,
      body.matterId,
      body.personId,
      user.sub,
    );
  }

  @Post('scan/config')
  @ApiOperation({ summary: 'Configurar pastas para scanner de documentos' })
  async setScanPaths(@Body() body: { paths: string[] }) {
    return this.scannerService.setConfiguredPaths(body.paths);
  }

  @Get('scan/config')
  @ApiOperation({ summary: 'Ver pastas configuradas' })
  async getScanPaths() {
    const paths = await this.scannerService.getConfiguredPaths();
    return { paths };
  }

  @Post('scan/run')
  @ApiOperation({ summary: 'Executar scanner nas pastas configuradas' })
  async runScan(@CurrentUser() user: JwtPayload) {
    return this.scannerService.scanAllConfigured(user.sub);
  }

  @Post('scan/directory')
  @ApiOperation({ summary: 'Escanear uma pasta especifica' })
  async scanDirectory(
    @Body() body: { path: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scannerService.scanDirectory(body.path, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      tags?: string[];
      personId?: string;
      matterId?: string;
    },
  ) {
    return this.documentsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento' })
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
