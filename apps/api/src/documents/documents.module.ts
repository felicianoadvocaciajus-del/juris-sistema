import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentScannerService } from './document-scanner.service';
import { DocumentsController } from './documents.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DocumentsService, DocumentScannerService],
  controllers: [DocumentsController],
  exports: [DocumentsService, DocumentScannerService],
})
export class DocumentsModule {}
