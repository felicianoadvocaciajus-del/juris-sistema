# JurisSystem - Sistema Interno do Escritorio

Sistema completo para gerenciar clientes, casos, documentos, financeiro,
publicacoes, prazos e conversas do escritorio de advocacia.

---

## Como instalar (primeira vez)

### Pre-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Node.js 20+](https://nodejs.org/) instalado
- [Git](https://git-scm.com/) instalado

### Passo 1 - Baixar o projeto
```bash
cd C:\Users\SeuUsuario\Documents
git clone <url-do-repositorio> juris-sistema
cd juris-sistema
```

### Passo 2 - Configurar
```bash
cp .env.example .env
```
Edite o arquivo `.env` se precisar mudar senhas ou portas.

### Passo 3 - Subir o banco de dados
```bash
npm run docker:up
```
Aguarde ate as mensagens pararem (uns 30 segundos).

### Passo 4 - Instalar dependencias
```bash
npm install
```

### Passo 5 - Criar as tabelas do banco
```bash
npm run db:generate
npm run db:push
```

### Passo 6 - Carregar dados de exemplo
```bash
npm run db:seed
```

### Passo 7 - Iniciar o sistema
```bash
npm run dev
```

### Passo 8 - Acessar
Abra o navegador em: **http://localhost:3000**

Login inicial:
- Email: `admin@juris.local`
- Senha: `mudar123`
- (O sistema vai pedir para trocar a senha no primeiro acesso)

---

## Uso diario

### Ligar o sistema
```bash
cd juris-sistema
npm run docker:up
npm run dev
```

### Desligar o sistema
Aperte `Ctrl+C` no terminal, depois:
```bash
npm run docker:down
```

### Fazer backup
```bash
npm run backup
```

### Restaurar backup
```bash
npm run restore
```

---

## Estrutura do projeto

```
juris-sistema/
  apps/
    api/          <- Backend (NestJS)
    web/          <- Frontend (Next.js)
  packages/       <- Codigo compartilhado
  docs/           <- Documentacao
  infra/
    backups/      <- Backups do banco
    scripts/      <- Scripts utilitarios
  docker-compose.yml
  .env
```

---

## Documentacao

- [Resumo do Sistema](docs/RESUMO_EXECUTIVO.md)
- [Arquitetura Tecnica](docs/ARQUITETURA.md)
- [Backup e Restauracao](docs/BACKUP_AND_RESTORE.md)
- [Suposicoes Adotadas](docs/ASSUMPTIONS.md)
- [Plano de Fases](docs/FASES.md)

---

## Modulos disponiveis

| Modulo | Descricao |
|--------|-----------|
| Dashboard | Visao geral de tudo que precisa de atencao |
| Clientes | Cadastro e historico de clientes e leads |
| Casos | Processos e servicos de cada cliente |
| Conversas | Registro de mensagens importantes |
| Documentos | Indexacao e geracao de documentos |
| Financeiro | Honorarios, parcelas e pagamentos |
| Publicacoes e Prazos | Publicacoes, calculo de prazo com revisao |
| Modelos | Templates para gerar documentos automaticamente |
| Administracao | Usuarios, auditoria, configuracoes |

---

## Suporte

Duvidas ou problemas? Consulte a documentacao em `docs/` ou
entre em contato com o responsavel tecnico.
