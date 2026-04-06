# Arquitetura do Sistema

## Visao Geral

```
[Navegador] <---> [Next.js Frontend :3000]
                        |
                   [NestJS API :4000]
                        |
              +---------+---------+
              |                   |
        [PostgreSQL :5432]   [Redis :6379]
              |                   |
        (dados reais)       (filas/jobs)
```

## Stack Tecnica

| Camada       | Tecnologia                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14 + TypeScript + Tailwind + shadcn/ui |
| Backend     | NestJS + TypeScript               |
| Banco       | PostgreSQL 16                     |
| ORM         | Prisma                            |
| Filas/Jobs  | Redis + BullMQ                    |
| Auth        | JWT + bcrypt + RBAC proprio       |
| Storage     | Hibrido (local + S3 futuro)       |
| Container   | Docker Compose                    |
| Monorepo    | npm workspaces                    |

## Modulos

### 1. Core
- Autenticacao e RBAC
- Auditoria (audit trail)
- Configuracoes do sistema

### 2. CRM Juridico
- Clientes (Person, Company)
- Leads (potenciais clientes)
- Contatos e canais

### 3. Casos
- Matter/Case
- Timeline unificada
- Status e workflow

### 4. Conversas
- Inbox multi-canal
- Triagem e classificacao
- Alertas automaticos
- 4 modos de ingestao (API, Android helper, iPhone assistido, manual)

### 5. Documentos
- Metadados no banco
- Arquivos em storage hibrido
- Agente local para pastas Windows
- Versionamento basico

### 6. Financeiro
- Contratos de honorarios
- Parcelas e pagamentos
- Alertas de cobranca

### 7. Publicacoes e Prazos
- Inbox de publicacoes
- Parser juridico
- Calendario forense
- Calculadora de prazo (com revisao humana obrigatoria)
- Painel de controladoria

### 8. Templates
- Engine de templates com variaveis
- Modelos pre-definidos (procuracao, contrato, hipossuficiencia)
- Geracao automatica com dados do cliente/caso

## Seguranca

- Senhas com bcrypt (salt rounds: 12)
- JWT com refresh token
- RBAC: admin, advogado, assistente
- Audit trail em todas operacoes criticas
- Certificado digital via adapter seguro (nunca armazenado em texto plano)

## Persistencia

- PostgreSQL com volume Docker persistente
- Backup diario automatico via cron job
- Scripts de backup e restore documentados
- Seed de demonstracao para primeiro uso

## Escalabilidade Futura

- Storage S3-compatible quando necessario
- Integracoes via adapters plugaveis
- API REST padrao para conectores futuros
