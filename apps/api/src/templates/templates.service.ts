import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    const where = category ? { category, isActive: true } : { isActive: true };
    return this.prisma.documentTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('Template nao encontrado');
    }
    return template;
  }

  async create(data: {
    name: string;
    description?: string;
    content: string;
    category?: string;
  }) {
    return this.prisma.documentTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        category: data.category,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      category?: string;
      isActive?: boolean;
    },
  ) {
    await this.findById(id);
    return this.prisma.documentTemplate.update({
      where: { id },
      data,
    });
  }

  async render(id: string, variables: Record<string, any>): Promise<string> {
    const template = await this.findById(id);
    const compiled = Handlebars.compile(template.content);
    return compiled(variables);
  }

  async generatePdf(
    id: string,
    variables: Record<string, any>,
    outputPath?: string,
  ): Promise<{ html: string; pdfPath?: string }> {
    const html = await this.render(id, variables);

    if (!outputPath) {
      return { html };
    }

    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });

      await browser.close();

      return { html, pdfPath: outputPath };
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error}`);
      return { html };
    }
  }
}
