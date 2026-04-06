import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user;

    if (!user || method === 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        const entityId = request.params?.id || response?.id || 'unknown';
        const pathParts = url.split('/').filter(Boolean);
        const entity = pathParts.find(
          (p: string) => p !== 'api' && !p.match(/^[0-9a-f-]+$/),
        ) || 'unknown';

        const actionMap: Record<string, string> = {
          POST: 'CREATE',
          PATCH: 'UPDATE',
          PUT: 'UPDATE',
          DELETE: 'DELETE',
        };

        this.auditService
          .log({
            userId: user.sub,
            action: actionMap[method] || method,
            entity: entity.toUpperCase(),
            entityId,
            newValue: method !== 'DELETE' ? request.body : undefined,
            ipAddress:
              request.ip || request.connection?.remoteAddress,
          })
          .catch((err) =>
            this.logger.error(`Audit log failed: ${err.message}`),
          );
      }),
    );
  }
}
