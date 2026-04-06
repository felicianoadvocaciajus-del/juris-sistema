import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    personId?: string;
    matterId?: string;
    origin?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, personId, matterId, origin, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (personId) where.personId = personId;
    if (matterId) where.matterId = matterId;
    if (origin) where.origin = origin as any;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        include: {
          person: { select: { id: true, name: true } },
          matter: { select: { id: true, title: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, name: true } },
        matter: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!doc) {
      throw new NotFoundException('Documento nao encontrado');
    }
    return doc;
  }

  async upload(data: {
    name: string;
    description?: string;
    personId?: string;
    matterId?: string;
    storagePath: string;
    localPath?: string;
    fileType?: string;
    fileSize?: number;
    tags?: string[];
    createdById: string;
  }) {
    let fileHash: string | undefined;
    if (data.localPath && fs.existsSync(data.localPath)) {
      const fileBuffer = fs.readFileSync(data.localPath);
      fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    const doc = await this.prisma.document.create({
      data: {
        name: data.name,
        description: data.description,
        personId: data.personId,
        matterId: data.matterId,
        origin: data.localPath ? 'LOCAL_PATH' : 'UPLOAD',
        storagePath: data.storagePath,
        localPath: data.localPath,
        fileType: data.fileType,
        fileSize: data.fileSize,
        fileHash,
        tags: data.tags || [],
        createdById: data.createdById,
      },
    });

    if (data.matterId) {
      await this.prisma.timelineEvent.create({
        data: {
          matterId: data.matterId,
          personId: data.personId,
          type: 'DOCUMENTO',
          title: 'Documento adicionado',
          description: `Documento "${data.name}" adicionado`,
          createdById: data.createdById,
        },
      });
    }

    return doc;
  }

  async indexLocalDirectory(
    dirPath: string,
    matterId: string | undefined,
    personId: string | undefined,
    createdById: string,
  ) {
    if (!fs.existsSync(dirPath)) {
      throw new NotFoundException('Diretorio nao encontrado');
    }

    const files = fs.readdirSync(dirPath);
    const results: any[] = [];

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        const doc = await this.upload({
          name: file,
          storagePath: fullPath,
          localPath: fullPath,
          fileType: ext,
          fileSize: stat.size,
          matterId,
          personId,
          createdById,
        });
        results.push(doc);
      }
    }

    return { indexed: results.length, documents: results };
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
      personId?: string;
      matterId?: string;
    },
  ) {
    await this.findById(id);
    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Documento removido com sucesso' };
  }
}
