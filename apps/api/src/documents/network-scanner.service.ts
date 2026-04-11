import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentScannerService } from './document-scanner.service';
import * as fs from 'fs';
import * as path from 'path';

interface NetworkPath {
  name: string;
  path: string;
  ip: string;
  description?: string;
}

@Injectable()
export class NetworkScannerService {
  private readonly logger = new Logger(NetworkScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scanner: DocumentScannerService,
  ) {}

  /**
   * Get configured network paths to scan
   */
  async getNetworkPaths(): Promise<NetworkPath[]> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'network_scan_paths' },
    });
    if (!config) return [];
    try {
      return JSON.parse(config.value);
    } catch {
      return [];
    }
  }

  /**
   * Configure network paths from other PCs
   */
  async setNetworkPaths(paths: NetworkPath[]) {
    // Validate which paths are accessible
    const results = paths.map((p) => ({
      ...p,
      accessible: fs.existsSync(p.path),
    }));

    await this.prisma.systemConfig.upsert({
      where: { key: 'network_scan_paths' },
      update: { value: JSON.stringify(paths) },
      create: {
        key: 'network_scan_paths',
        value: JSON.stringify(paths),
        description: 'Pastas de rede para indexar documentos de outros computadores',
      },
    });

    return results;
  }

  /**
   * Scan all network paths
   */
  async scanAllNetworkPaths(createdById: string) {
    const paths = await this.getNetworkPaths();
    if (paths.length === 0) {
      return { message: 'Nenhuma pasta de rede configurada.' };
    }

    const results: Record<string, any> = {};
    for (const np of paths) {
      this.logger.log(`Scanning network path: ${np.name} (${np.path})`);

      if (!fs.existsSync(np.path)) {
        results[np.name] = {
          error: `Pasta nao acessivel: ${np.path}. Verifique se o PC ${np.ip} esta ligado e a pasta compartilhada.`,
        };
        continue;
      }

      try {
        const scanResult = await this.scanner.scanDirectory(np.path, createdById);
        results[np.name] = scanResult;
      } catch (err) {
        results[np.name] = { error: err.message };
      }
    }

    return results;
  }
}
