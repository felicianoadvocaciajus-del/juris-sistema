import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrevidenciarioService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CNIS Extracts ────────────────────────────────────────────────

  async getCnisExtracts(personId: string) {
    return this.prisma.cnisExtract.findMany({
      where: { personId },
      include: {
        person: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { calculations: true } },
      },
      orderBy: { extractDate: 'desc' },
    });
  }

  async createCnisExtract(data: {
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
    createdById?: string;
  }) {
    return this.prisma.cnisExtract.create({
      data: {
        personId: data.personId,
        cpf: data.cpf,
        nit: data.nit,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        extractDate: new Date(data.extractDate),
        rawData: data.rawData,
        vinculos: data.vinculos,
        competencias: data.competencias,
        indicators: data.indicators,
        totalTC: data.totalTC,
        carencia: data.carencia,
        filePath: data.filePath,
        createdById: data.createdById,
      },
    });
  }

  // ─── Calculations ─────────────────────────────────────────────────

  async getCalculations(personId: string) {
    return this.prisma.prevCalculation.findMany({
      where: { personId },
      include: {
        person: { select: { id: true, name: true } },
        cnisExtract: { select: { id: true, cpf: true, extractDate: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { contributions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCalculation(id: string) {
    const calc = await this.prisma.prevCalculation.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, name: true } },
        cnisExtract: { select: { id: true, cpf: true, extractDate: true } },
        createdBy: { select: { id: true, name: true } },
        contributions: {
          orderBy: { competencia: 'asc' },
        },
      },
    });
    if (!calc) {
      throw new NotFoundException('Calculo nao encontrado');
    }
    return calc;
  }

  async createCalculation(data: {
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
    createdById?: string;
  }) {
    return this.prisma.prevCalculation.create({
      data: {
        personId: data.personId,
        cnisExtractId: data.cnisExtractId,
        title: data.title,
        type: data.type,
        status: data.status || 'RASCUNHO',
        rules: data.rules,
        bestRule: data.bestRule,
        eligibilityDate: data.eligibilityDate
          ? new Date(data.eligibilityDate)
          : undefined,
        estimatedRMI: data.estimatedRMI,
        tc: data.tc,
        carencia: data.carencia,
        strategy: data.strategy,
        notes: data.notes,
        documentPath: data.documentPath,
        createdById: data.createdById,
      },
    });
  }

  async updateCalculation(
    id: string,
    data: {
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
    await this.getCalculation(id);

    return this.prisma.prevCalculation.update({
      where: { id },
      data: {
        ...data,
        eligibilityDate: data.eligibilityDate
          ? new Date(data.eligibilityDate)
          : undefined,
      },
    });
  }

  // ─── Contribution Debts ───────────────────────────────────────────

  async getContributions(personId: string, calculationId?: string) {
    const where: any = { personId };
    if (calculationId) {
      where.calculationId = calculationId;
    }

    return this.prisma.contributionDebt.findMany({
      where,
      include: {
        person: { select: { id: true, name: true } },
        calculation: { select: { id: true, title: true, type: true } },
      },
      orderBy: { competencia: 'asc' },
    });
  }

  async createContributions(
    data: Array<{
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
    return this.prisma.contributionDebt.createMany({
      data: data.map((item) => ({
        personId: item.personId,
        calculationId: item.calculationId,
        competencia: item.competencia,
        tipo: item.tipo,
        valorOriginal: item.valorOriginal,
        valorAtualizado: item.valorAtualizado,
        salarioMinimo: item.salarioMinimo,
        aliquota: item.aliquota,
        status: item.status || 'PENDENTE',
        gpsNumero: item.gpsNumero,
        dataPagamento: item.dataPagamento
          ? new Date(item.dataPagamento)
          : undefined,
      })),
    });
  }

  async updateContribution(
    id: string,
    data: {
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
    const existing = await this.prisma.contributionDebt.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Contribuicao nao encontrada');
    }

    return this.prisma.contributionDebt.update({
      where: { id },
      data: {
        ...data,
        dataPagamento: data.dataPagamento
          ? new Date(data.dataPagamento)
          : undefined,
      },
    });
  }
}
