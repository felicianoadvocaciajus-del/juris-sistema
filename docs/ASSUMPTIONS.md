# Suposicoes Adotadas (Assumptions)

Este documento registra todas as decisoes que foram tomadas sem consulta explicita,
usando defaults profissionais e sensatos.

## Infraestrutura

1. **O sistema roda localmente** no computador principal do escritorio via Docker.
   - Nao requer servidor na nuvem no MVP.
   - Pode ser migrado para nuvem depois sem reescrever.

2. **PostgreSQL 16** como banco principal.
   - Volume Docker persistente em `./data/postgres`.
   - Backup diario automatico.

3. **Redis 7** para filas e cache.
   - Usado apenas para jobs assincronos e cache.
   - Se o Redis reiniciar, os jobs pendentes sao re-enfileirados.

## Autenticacao

4. **Login proprio** com email + senha.
   - Sem integracao com Google/Microsoft no MVP.
   - Admin cria as contas dos usuarios.
   - Senha padrao do seed: `mudar123` (exigir troca no primeiro login).

5. **3 perfis de acesso**: admin, advogado, assistente.
   - Admin: acesso total.
   - Advogado: acesso a tudo exceto gerenciamento de usuarios.
   - Assistente: acesso limitado (nao ve financeiro detalhado, nao confirma prazos).

## Clientes

6. **CPF/CNPJ nao obrigatorio** no cadastro inicial.
   - Muitos contatos começam como leads sem documentos.
   - O sistema avisa quando falta CPF/CNPJ em cliente ativo.

7. **Status padrao de novo contato**: "nao classificado".

## Documentos

8. **Pasta raiz padrao**: `C:\Documentos\Clientes\`
   - Configuravel nas configuracoes do sistema.
   - O agente local cria subpastas por cliente automaticamente.

9. **Arquivos menores que 50MB** podem ser uploaded direto ao sistema.
   - Maiores ficam apenas referenciados pelo caminho local.

## Financeiro

10. **Moeda**: Real (BRL), sem suporte multi-moeda.

11. **Impostos e notas fiscais** nao sao escopo do MVP.
    - O sistema registra valores brutos de honorarios.

12. **Juros e multa por atraso** nao sao calculados automaticamente no MVP.
    - Podem ser registrados como ajuste manual.

## Publicacoes e Prazos

13. **Feriados pre-carregados**: nacionais 2024-2027 + SP + Guarulhos.
    - Outros podem ser adicionados manualmente.
    - Atualizacao anual necessaria.

14. **Prazos sempre em status "sugerido"** ate confirmacao do advogado.
    - Nunca automaticamente confirmados.

15. **Regras de prazo pre-configuradas**:
    - CPC geral (dias uteis)
    - CLT (dias corridos)
    - Criminal/CPP
    - Regras especiais configuraveis

## Conversas e WhatsApp

16. **Modo inicial de ingestao**: importacao manual (colar texto, upload de export).
    - Demais modos (API, Android, iPhone) ficam preparados mas nao ativos no MVP.

17. **O sistema NAO acessa WhatsApp diretamente** no MVP.
    - Isso e uma decisao consciente de honestidade tecnica.
    - Integracao com WhatsApp Business API pode ser adicionada depois.

## Interface

18. **Idioma da interface**: Portugues brasileiro.

19. **Tema**: claro (light mode), cores sobrias (azul-marinho, cinza, branco).
    - Dark mode pode ser adicionado depois.

20. **Resolucao alvo**: 1366x768 minimo (tela de notebook comum).

## Templates de Documentos

21. **Engine de template**: Handlebars-like com variaveis simples.
    - {{cliente.nome}}, {{caso.numero}}, etc.
    - Saida em PDF via html-pdf ou puppeteer.

22. **3 modelos pre-incluidos**:
    - Procuracao ad judicia
    - Declaracao de hipossuficiencia
    - Contrato de honorarios padrao

## Desenvolvimento

23. **Testes**: focados em regras de negocio criticas.
    - Calculo de prazos
    - Financeiro (parcelas, saldos)
    - RBAC
    - Nao exigir 100% de cobertura.

24. **CI/CD**: nao no MVP. Docker Compose e suficiente.

25. **Monorepo com npm workspaces** (sem turborepo/nx por simplicidade).
