import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const LEGAL_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.odt', '.rtf',
  '.xls', '.xlsx', '.ods',
  '.jpg', '.jpeg', '.png', '.tif', '.tiff',
  '.txt', '.csv',
];

@Injectable()
export class DocumentScannerService {
  private readonly logger = new Logger(DocumentScannerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scanDirectory(dirPath: string, createdById: string) {
    if (!fs.existsSync(dirPath)) {
      return { error: `Pasta nao encontrada: ${dirPath}`, indexed: 0, skipped: 0 };
    }

    const stats = { indexed: 0, skipped: 0, errors: 0 };
    await this.walkDir(dirPath, createdById, stats);

    this.logger.log(
      `Scan concluido: ${stats.indexed} indexados, ${stats.skipped} ja existiam, ${stats.errors} erros`,
    );
    return stats;
  }

  private async walkDir(
    dir: string,
    createdById: string,
    stats: { indexed: number; skipped: number; errors: number },
  ) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      this.logger.warn(`Sem permissao para ler: ${dir}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden folders and system folders
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        await this.walkDir(fullPath, createdById, stats);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!LEGAL_EXTENSIONS.includes(ext)) continue;

        try {
          await this.indexFile(fullPath, createdById, stats);
        } catch (err) {
          this.logger.warn(`Erro ao indexar ${fullPath}: ${err.message}`);
          stats.errors++;
        }
      }
    }
  }

  private async indexFile(
    filePath: string,
    createdById: string,
    stats: { indexed: number; skipped: number; errors: number },
  ) {
    // Check if already indexed by path
    const existing = await this.prisma.document.findFirst({
      where: { localPath: filePath },
    });

    if (existing) {
      stats.skipped++;
      return;
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    const parentFolder = path.basename(path.dirname(filePath));

    // Try to match person by folder name
    const person = await this.tryMatchPerson(parentFolder);

    // Generate hash for dedup
    let fileHash: string | undefined;
    if (stat.size < 50 * 1024 * 1024) { // hash only files < 50MB
      const buffer = fs.readFileSync(filePath);
      fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Check if same hash already exists
      const duplicate = await this.prisma.document.findFirst({
        where: { fileHash },
      });
      if (duplicate) {
        stats.skipped++;
        return;
      }
    }

    // Generate tags from path
    const tags = this.extractTags(filePath);

    await this.prisma.document.create({
      data: {
        name: fileName,
        description: `Indexado de: ${filePath}`,
        origin: 'LOCAL_PATH',
        storagePath: filePath,
        localPath: filePath,
        fileType: ext,
        fileSize: stat.size,
        fileHash,
        tags,
        personId: person?.id || null,
        createdById,
      },
    });

    stats.indexed++;
    this.logger.log(`Indexado: ${fileName}`);
  }

  private async tryMatchPerson(folderName: string) {
    if (!folderName) return null;

    // Try to find a person whose name matches the folder name
    return this.prisma.person.findFirst({
      where: {
        name: { contains: folderName, mode: 'insensitive' },
      },
    });
  }

  private extractTags(filePath: string): string[] {
    const tags: string[] = [];
    const lower = filePath.toLowerCase();

    const keywords: Record<string, string> = {
      procuracao: 'procuracao',
      contrato: 'contrato',
      peticao: 'peticao',
      recurso: 'recurso',
      sentenca: 'sentenca',
      acordao: 'acordao',
      laudo: 'laudo',
      ctps: 'ctps',
      rg: 'documento-pessoal',
      cpf: 'documento-pessoal',
      holerite: 'holerite',
      comprovante: 'comprovante',
      trabalhista: 'trabalhista',
      civil: 'civil',
      criminal: 'criminal',
      previdenciario: 'previdenciario',
      consumidor: 'consumidor',
    };

    for (const [key, tag] of Object.entries(keywords)) {
      if (lower.includes(key)) tags.push(tag);
    }

    return [...new Set(tags)];
  }

  async getConfiguredPaths(): Promise<string[]> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'document_scan_paths' },
    });
    if (!config) return [];
    try {
      return JSON.parse(config.value);
    } catch {
      return [];
    }
  }

  async setConfiguredPaths(paths: string[]) {
    // Validate paths exist
    const validPaths = paths.filter((p) => fs.existsSync(p));

    await this.prisma.systemConfig.upsert({
      where: { key: 'document_scan_paths' },
      update: { value: JSON.stringify(validPaths) },
      create: {
        key: 'document_scan_paths',
        value: JSON.stringify(validPaths),
        description: 'Pastas do computador para indexar documentos automaticamente',
      },
    });

    return { paths: validPaths, invalid: paths.filter((p) => !fs.existsSync(p)) };
  }

  async scanAllConfigured(createdById: string) {
    const paths = await this.getConfiguredPaths();
    if (paths.length === 0) {
      return { message: 'Nenhuma pasta configurada. Use POST /documents/scan/config para configurar.' };
    }

    const results: Record<string, any> = {};
    for (const p of paths) {
      results[p] = await this.scanDirectory(p, createdById);
    }
    return results;
  }
}
