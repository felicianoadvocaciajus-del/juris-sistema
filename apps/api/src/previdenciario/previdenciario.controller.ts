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
import { PrevidenciarioService } from './previdenciario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Previdenciario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('previdenciario')
export class PrevidenciarioController {
  constructor(private readonly previdenciarioService: PrevidenciarioService) {}

  // ─── CNIS Extracts ────────────────────────────────────────────────

  @Get('cnis')
  @ApiOperation({ summary: 'Listar extratos CNIS de uma pessoa' })
  @ApiQuery({ name: 'personId', required: true })
  async getCnisExtracts(@Query('personId') personId: string) {
    return this.previdenciarioService.getCnisExtracts(personId);
  }

  @Post('cnis')
  @ApiOperation({ summary: 'Criar extrato CNIS' })
  async createCnisExtract(
    @Body()
    body: {
      personId: string;
      cpf: string;
      nit?: string;
      birthDate?: string;
      extractDate: string;
      rawData: any;
      vinculos: any;
      competencias: any;
      indicators: any;
      totalTC: any;
      carencia: any;
      filePath?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.previdenciarioService.createCnisExtract({
      ...body,
      createdById: user.sub,
    });
  }

  // ─── Calculations ─────────────────────────────────────────────────

  @Get('calculations')
  @ApiOperation({ summary: 'Listar todos os calculos de uma pessoa' })
  @ApiQuery({ name: 'personId', required: true })
  async getCalculations(@Query('personId') personId: string) {
    return this.previdenciarioService.getCalculations(personId);
  }

  @Get('calculations/:id')
  @ApiOperation({ summary: 'Buscar calculo por ID com contribuicoes' })
  async getCalculation(@Param('id') id: string) {
    return this.previdenciarioService.getCalculation(id);
  }

  @Post('calculations')
  @ApiOperation({ summary: 'Criar calculo previdenciario' })
  async createCalculation(
    @Body()
    body: {
      personId: string;
      cnisExtractId?: string;
      title: string;
      type: string;
      status?: string;
      rules: any;
      bestRule?: string;
      eligibilityDate?: string;
      estimatedRMI?: number;
      tc: any;
      carencia: any;
      strategy?: any;
      notes?: string;
      documentPath?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.previdenciarioService.createCalculation({
      ...body,
      createdById: user.sub,
    });
  }

  @Patch('calculations/:id')
  @ApiOperation({ summary: 'Atualizar calculo previdenciario' })
  async updateCalculation(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      type?: string;
      status?: string;
      rules?: any;
      bestRule?: string;
      eligibilityDate?: string;
      estimatedRMI?: number;
      tc?: any;
      carencia?: any;
      strategy?: any;
      notes?: string;
      documentPath?: string;
      cnisExtractId?: string;
    },
  ) {
    return this.previdenciarioService.updateCalculation(id, body);
  }

  // ─── Contribution Debts ───────────────────────────────────────────

  @Get('contributions')
  @ApiOperation({ summary: 'Listar contribuicoes pendentes' })
  @ApiQuery({ name: 'personId', required: true })
  @ApiQuery({ name: 'calculationId', required: false })
  async getContributions(
    @Query('personId') personId: string,
    @Query('calculationId') calculationId?: string,
  ) {
    return this.previdenciarioService.getContributions(personId, calculationId);
  }

  @Post('contributions')
  @ApiOperation({ summary: 'Criar contribuicoes em lote' })
  async createContributions(
    @Body()
    body: Array<{
      personId: string;
      calculationId?: string;
      competencia: string;
      tipo: string;
      valorOriginal?: number;
      valorAtualizado?: number;
      salarioMinimo?: number;
      aliquota?: number;
      status?: string;
      gpsNumero?: string;
      dataPagamento?: string;
    }>,
  ) {
    return this.previdenciarioService.createContributions(body);
  }

  @Patch('contributions/:id')
  @ApiOperation({ summary: 'Atualizar contribuicao' })
  async updateContribution(
    @Param('id') id: string,
    @Body()
    body: {
      competencia?: string;
      tipo?: string;
      valorOriginal?: number;
      valorAtualizado?: number;
      salarioMinimo?: number;
      aliquota?: number;
      status?: string;
      gpsNumero?: string;
      dataPagamento?: string;
    },
  ) {
    return this.previdenciarioService.updateContribution(id, body);
  }
}
