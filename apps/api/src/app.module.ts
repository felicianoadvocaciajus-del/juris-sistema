import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PersonsModule } from './persons/persons.module';
import { MattersModule } from './matters/matters.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DocumentsModule } from './documents/documents.module';
import { FinanceModule } from './finance/finance.module';
import { PublicationsModule } from './publications/publications.module';
import { DeadlinesModule } from './deadlines/deadlines.module';
import { TasksModule } from './tasks/tasks.module';
import { AlertsModule } from './alerts/alerts.module';
import { TemplatesModule } from './templates/templates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { TimelineModule } from './timeline/timeline.module';
import { WebhookModule } from './webhook/webhook.module';
import { PrevidenciarioModule } from './previdenciario/previdenciario.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PersonsModule,
    MattersModule,
    ConversationsModule,
    DocumentsModule,
    FinanceModule,
    PublicationsModule,
    DeadlinesModule,
    TasksModule,
    AlertsModule,
    TemplatesModule,
    DashboardModule,
    AuditModule,
    TimelineModule,
    WebhookModule,
    PrevidenciarioModule,
  ],
})
export class AppModule {}
