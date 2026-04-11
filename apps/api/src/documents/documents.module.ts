import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentScannerService } from './document-scanner.service';
import { OcrService } from './ocr.service';
import { NetworkScannerService } from './network-scanner.service';
import { DocumentsController } from './documents.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DocumentsService, DocumentScannerService, OcrService, NetworkScannerService],
  controllers: [DocumentsController],
  exports: [DocumentsService, DocumentScannerService, OcrService, NetworkScannerService],
})
export class DocumentsModule {}
