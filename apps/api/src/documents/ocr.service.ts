import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private tesseractPath: string;

  constructor(private readonly prisma: PrismaService) {
    // Try common Tesseract paths on Windows
    const paths = [
      'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
      'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
      'tesseract', // if in PATH
    ];
    this.tesseractPath = paths.find((p) => {
      try {
        if (p === 'tesseract') return true;
        return fs.existsSync(p);
      } catch {
        return false;
      }
    }) || 'tesseract';
  }

  /**
   * Extract text from a PDF file using Python pdfplumber + pytesseract fallback
   */
  async extractTextFromFile(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`File not found: ${filePath}`);
      return '';
    }

    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.pdf') {
        return await this.extractFromPdf(filePath);
      } else if (['.jpg', '.jpeg', '.png', '.tif', '.tiff'].includes(ext)) {
        return await this.extractFromImage(filePath);
      } else if (['.txt', '.csv'].includes(ext)) {
        return fs.readFileSync(filePath, 'utf-8').substring(0, 50000);
      }
    } catch (err) {
      this.logger.warn(`OCR failed for ${filePath}: ${err.message}`);
    }

    return '';
  }

  /**
   * Extract text from PDF using Python pdfplumber (native text) + pytesseract (OCR fallback)
   */
  private async extractFromPdf(filePath: string): Promise<string> {
    const escapedPath = filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const pythonScript = `
import sys
try:
    import pdfplumber
    text = ''
    with pdfplumber.open(r"${escapedPath}") as pdf:
        for page in pdf.pages[:30]:
            t = page.extract_text() or ''
            text += t + '\\n'
    if text.strip():
        print(text[:50000])
    else:
        # Fallback: try pytesseract
        try:
            from pdf2image import convert_from_path
            import pytesseract
            images = convert_from_path(r"${escapedPath}", first_page=1, last_page=5, dpi=200)
            ocr_text = ''
            for img in images:
                ocr_text += pytesseract.image_to_string(img, lang='por') + '\\n'
            print(ocr_text[:50000])
        except Exception as e2:
            print(f'OCR_FALLBACK_FAILED:{e2}', file=sys.stderr)
            print('')
except Exception as e:
    print(f'ERROR:{e}', file=sys.stderr)
    print('')
`;

    try {
      const { stdout, stderr } = await execAsync(
        `python -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ';')}"`,
        { timeout: 60000, maxBuffer: 10 * 1024 * 1024 },
      );
      if (stderr) this.logger.debug(`OCR stderr: ${stderr}`);
      return stdout.trim();
    } catch (err) {
      // Simpler fallback - just try pdfplumber without OCR
      try {
        const { stdout } = await execAsync(
          `python -c "import pdfplumber;pdf=pdfplumber.open(r'${escapedPath}');print(''.join([(p.extract_text() or '') for p in pdf.pages[:20]])[:50000])"`,
          { timeout: 30000, maxBuffer: 5 * 1024 * 1024 },
        );
        return stdout.trim();
      } catch {
        return '';
      }
    }
  }

  /**
   * Extract text from image using pytesseract
   */
  private async extractFromImage(filePath: string): Promise<string> {
    const escapedPath = filePath.replace(/\\/g, '\\\\');
    try {
      const { stdout } = await execAsync(
        `python -c "import pytesseract;from PIL import Image;print(pytesseract.image_to_string(Image.open(r'${escapedPath}'), lang='por')[:20000])"`,
        { timeout: 30000, maxBuffer: 5 * 1024 * 1024 },
      );
      return stdout.trim();
    } catch {
      return '';
    }
  }

  /**
   * Parse extracted text to find client info (CPF, name, process number)
   */
  parseDocumentInfo(text: string): {
    cpf?: string;
    processNumber?: string;
    clientName?: string;
    documentType?: string;
    summary?: string;
  } {
    const result: any = {};

    // Extract CPF
    const cpfMatch = text.match(/(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/);
    if (cpfMatch) result.cpf = cpfMatch[1].replace(/[.\s-]/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    // Extract process number (CNJ format)
    const procMatch = text.match(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/);
    if (procMatch) result.processNumber = procMatch[1];

    // Extract OAB
    const oabMatch = text.match(/OAB[:/\s]*(\d+[/\s]*\w{2})/i);

    // Document type detection
    const types: [RegExp, string][] = [
      [/CNIS|CADASTRO NACIONAL/i, 'CNIS'],
      [/CTPS|CARTEIRA DE TRABALHO/i, 'CTPS'],
      [/PROCURA[CÇ][AÃ]O/i, 'PROCURACAO'],
      [/CONTRATO/i, 'CONTRATO'],
      [/PETI[CÇ][AÃ]O/i, 'PETICAO'],
      [/SENTEN[CÇ]A/i, 'SENTENCA'],
      [/AC[OÓ]RD[AÃ]O/i, 'ACORDAO'],
      [/LAUDO/i, 'LAUDO'],
      [/PPP|PERFIL PROFISSIOGR/i, 'PPP'],
      [/HOLERITE|CONTRA ?CHEQUE/i, 'HOLERITE'],
      [/RG|IDENTIDADE/i, 'RG'],
      [/CPF/i, 'CPF'],
      [/CERTID[AÃ]O/i, 'CERTIDAO'],
      [/DECLARA[CÇ][AÃ]O/i, 'DECLARACAO'],
      [/MANDADO/i, 'MANDADO'],
      [/RECURSO|APELA[CÇ][AÃ]O/i, 'RECURSO'],
    ];

    for (const [regex, tipo] of types) {
      if (regex.test(text)) {
        result.documentType = tipo;
        break;
      }
    }

    // Summary - first 300 chars
    result.summary = text.replace(/\s+/g, ' ').trim().substring(0, 300);

    return result;
  }

  /**
   * Process a single document - extract text, parse info, update DB
   */
  async processDocument(documentId: string): Promise<any> {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return { error: 'Document not found' };

    const filePath = doc.storagePath || doc.localPath;
    if (!filePath || !fs.existsSync(filePath)) {
      return { error: 'File not found on disk' };
    }

    const text = await this.extractTextFromFile(filePath);
    if (!text) return { error: 'No text extracted' };

    const info = this.parseDocumentInfo(text);

    // Update document with extracted info
    const updateData: any = {};
    if (info.documentType && !doc.description?.includes('Tipo:')) {
      updateData.description = `Tipo: ${info.documentType}. ${doc.description || ''}`.trim();
    }

    // Add tags based on extracted info
    const newTags = [...(doc.tags || [])];
    if (info.documentType && !newTags.includes(info.documentType.toLowerCase())) {
      newTags.push(info.documentType.toLowerCase());
    }
    if (info.cpf) newTags.push(`cpf:${info.cpf}`);
    if (info.processNumber) newTags.push(`proc:${info.processNumber}`);
    updateData.tags = [...new Set(newTags)];

    // Try to link to person by CPF if not already linked
    if (!doc.personId && info.cpf) {
      const cleanCpf = info.cpf.replace(/[.\-]/g, '');
      const person = await this.prisma.person.findFirst({
        where: {
          OR: [
            { tags: { hasSome: [`cpf:${info.cpf}`] } },
            { tags: { hasSome: [`cpf:${cleanCpf}`] } },
          ],
        },
      });
      if (person) updateData.personId = person.id;
    }

    // Try to link to matter by process number
    if (!doc.matterId && info.processNumber) {
      const matter = await this.prisma.matter.findFirst({
        where: { courtNumber: info.processNumber },
      });
      if (matter) updateData.matterId = matter.id;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: updateData,
      });
    }

    return {
      documentId,
      extracted: {
        textLength: text.length,
        ...info,
      },
      updated: Object.keys(updateData),
    };
  }

  /**
   * Batch process all unprocessed documents
   */
  async processAllDocuments(limit = 50): Promise<any> {
    // Get documents that haven't been OCR'd yet (no cpf/proc tags)
    const docs = await this.prisma.document.findMany({
      where: {
        AND: [
          { fileType: { in: ['.pdf', '.jpg', '.jpeg', '.png', '.tif', '.tiff'] } },
          { NOT: { tags: { hasSome: ['ocr-processed'] } } },
        ],
      },
      select: { id: true, name: true, storagePath: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Processing ${docs.length} documents with OCR...`);

    const results = { processed: 0, errors: 0, skipped: 0 };

    for (const doc of docs) {
      try {
        const result = await this.processDocument(doc.id);
        if (result.error) {
          results.skipped++;
        } else {
          results.processed++;
          // Mark as processed
          const currentTags = (await this.prisma.document.findUnique({
            where: { id: doc.id },
            select: { tags: true },
          }))?.tags || [];
          await this.prisma.document.update({
            where: { id: doc.id },
            data: { tags: [...new Set([...currentTags, 'ocr-processed'])] },
          });
        }
      } catch (err) {
        this.logger.warn(`Error processing ${doc.name}: ${err.message}`);
        results.errors++;
      }
    }

    return results;
  }
}
