import { Injectable } from '@nestjs/common';

interface ParsedPublication {
  processNumber?: string;
  court?: string;
  organ?: string;
  parties?: string;
  lawyers?: string[];
  actType?: string;
  relevantText?: string;
  mentionedDeadline?: string;
  keywords?: string[];
}

@Injectable()
export class PublicationParserService {
  parse(rawContent: string): ParsedPublication {
    const result: ParsedPublication = {};

    // Extrair numero do processo (CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO)
    const processMatch = rawContent.match(
      /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/,
    );
    if (processMatch) {
      result.processNumber = processMatch[1];
    }

    // Extrair tribunal/vara pela segmentacao do numero CNJ
    if (result.processNumber) {
      const segments = result.processNumber.match(
        /\d{7}-\d{2}\.(\d{4})\.(\d)\.(\d{2})\.\d{4}/,
      );
      if (segments) {
        const justica = segments[2];
        const tribunal = segments[3];
        const tribunais: Record<string, Record<string, string>> = {
          '4': { '03': 'TRF3 - Tribunal Regional Federal da 3a Regiao' },
          '5': { '02': 'TRT2 - Tribunal Regional do Trabalho da 2a Regiao', '15': 'TRT15' },
          '8': { '26': 'TJSP - Tribunal de Justica de Sao Paulo', '20': 'TJRN' },
        };
        result.court =
          tribunais[justica]?.[tribunal] ||
          `Justica ${justica} - Tribunal ${tribunal}`;
      }
    }

    // Extrair partes (polo ativo/passivo)
    const poloAtivoMatch = rawContent.match(
      /POLO\s+ATIVO[:\s]*([^\n]+)/i,
    );
    const poloPassivoMatch = rawContent.match(
      /POLO\s+PASSIVO[:\s]*([^\n]+)/i,
    );
    const requerenteMatch = rawContent.match(
      /(?:REQUERENTE|AUTOR|RECLAMANTE|IMPETRANTE|EXEQUENTE|APELANTE)[:\s]*([^\n]+)/i,
    );
    const requeridoMatch = rawContent.match(
      /(?:REQUERIDO|REU|RECLAMADO|IMPETRADO|EXECUTADO|APELADO)[:\s]*([^\n]+)/i,
    );

    const partes: string[] = [];
    if (poloAtivoMatch) partes.push(`Polo Ativo: ${poloAtivoMatch[1].trim()}`);
    if (poloPassivoMatch) partes.push(`Polo Passivo: ${poloPassivoMatch[1].trim()}`);
    if (!poloAtivoMatch && requerenteMatch) partes.push(`Requerente: ${requerenteMatch[1].trim()}`);
    if (!poloPassivoMatch && requeridoMatch) partes.push(`Requerido: ${requeridoMatch[1].trim()}`);
    if (partes.length > 0) result.parties = partes.join(' | ');

    // Extrair advogados (OAB)
    const lawyerMatches = rawContent.matchAll(
      /ADVOGAD[OA][:\s]*([^-\n]+)\s*-\s*OAB[:\s]*(\d+\/\w+)/gi,
    );
    const lawyers: string[] = [];
    for (const m of lawyerMatches) {
      lawyers.push(`${m[1].trim()} (OAB ${m[2].trim()})`);
    }
    if (lawyers.length > 0) result.lawyers = lawyers;

    // Detectar tipo de ato
    const actTypes: [RegExp, string][] = [
      [/SENTEN[CÇ]A/i, 'SENTENCA'],
      [/AC[OÓ]RD[AÃ]O/i, 'ACORDAO'],
      [/DESPACHO/i, 'DESPACHO'],
      [/DECIS[AÃ]O/i, 'DECISAO'],
      [/INTIMA[CÇ][AÃ]O/i, 'INTIMACAO'],
      [/CITA[CÇ][AÃ]O/i, 'CITACAO'],
      [/EDITAL/i, 'EDITAL'],
      [/ATA\s+DE\s+AUDI[EÊ]NCIA/i, 'ATA_AUDIENCIA'],
      [/MANDADO/i, 'MANDADO'],
      [/PETI[CÇ][AÃ]O/i, 'PETICAO'],
    ];
    for (const [regex, tipo] of actTypes) {
      if (regex.test(rawContent)) {
        result.actType = tipo;
        break;
      }
    }

    // Extrair prazos mencionados
    const prazoMatch = rawContent.match(
      /(?:prazo\s+de\s+|no\s+prazo\s+de\s+)(\d+)\s*(?:dias?\s*(?:úteis|uteis|corridos)?|horas?)/i,
    );
    if (prazoMatch) {
      result.mentionedDeadline = prazoMatch[0].trim();
    }

    // Gerar keywords
    const kws = new Set<string>();
    const kwPatterns: [RegExp, string][] = [
      [/TRABALHIST/i, 'trabalhista'],
      [/PREVIDENCI[AÁ]RI/i, 'previdenciario'],
      [/C[IÍ]VEL/i, 'civel'],
      [/CRIMINAL|PENAL/i, 'criminal'],
      [/HABEAS\s+CORPUS/i, 'habeas corpus'],
      [/ALIMENTOS/i, 'alimentos'],
      [/INVENT[AÁ]RIO/i, 'inventario'],
      [/USUCAPI[AÃ]O/i, 'usucapiao'],
      [/EXECU[CÇ][AÃ]O/i, 'execucao'],
      [/CUMPRIMENTO\s+DE\s+SENTEN[CÇ]A/i, 'cumprimento de sentenca'],
      [/APOSENTADORIA/i, 'aposentadoria'],
      [/AUX[IÍ]LIO[\s-]DOE[NÇ]A/i, 'auxilio doenca'],
      [/INDENIZA[CÇ][AÃ]O/i, 'indenizacao'],
      [/RECURSO/i, 'recurso'],
      [/APELA[CÇ][AÃ]O/i, 'apelacao'],
      [/AGRAVO/i, 'agravo'],
      [/EMBARGO/i, 'embargo'],
      [/LOAS|BPC/i, 'LOAS/BPC'],
      [/PENS[AÃ]O\s+POR\s+MORTE/i, 'pensao por morte'],
      [/INTERDI[CÇ][AÃ]O/i, 'interdicao'],
      [/RPV|PRECAT[OÓ]RIO/i, 'RPV/precatorio'],
    ];
    for (const [regex, keyword] of kwPatterns) {
      if (regex.test(rawContent)) kws.add(keyword);
    }
    if (kws.size > 0) result.keywords = Array.from(kws);

    // Texto relevante - primeiros 500 caracteres limpos
    result.relevantText = rawContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);

    return result;
  }
}
