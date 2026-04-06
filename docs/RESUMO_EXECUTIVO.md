# JurisSystem - Resumo Executivo

## O que e este sistema?

Um sistema interno, privado, feito sob medida para o escritorio de advocacia.
Ele centraliza tudo que o escritorio precisa em um lugar so:

- **Clientes**: cadastro completo, historico, timeline
- **Conversas**: registro de mensagens importantes do WhatsApp e outros canais
- **Casos**: cada servico/processo de cada cliente, organizado
- **Documentos**: indexacao das pastas que ja existem no computador + upload quando necessario
- **Financeiro**: honorarios, parcelas, cobranças, alertas de vencimento
- **Publicacoes e Prazos**: receber publicacoes, calcular prazos, exigir conferencia humana
- **Modelos**: gerar procuracao, contrato, hipossuficiencia automaticamente
- **Dashboard**: tudo que precisa de atencao hoje, em uma tela

## O que NAO e

- Nao e um software juridico generico de mercado
- Nao e um ERP contabil
- Nao e um CRM de marketing
- Nao exige mudanca de rotina no dia 1

## Como funciona

- Roda no computador do escritorio via Docker (instala uma vez, sobe com um clique)
- Acessa pelo navegador (Chrome, Edge) no endereco local
- Os dados ficam salvos no banco PostgreSQL com volume persistente
- Tem backup automatico configuravel
- Nao depende de internet para funcionar (exceto integracoes externas)

## Para quem e

- Os 2 advogados do escritorio
- Eventuais assistentes/estagiarios (com acesso limitado)

## Diferencial

- Respeita a organizacao de pastas que ja existe
- Nao obriga upload de tudo para dentro do sistema
- Trata WhatsApp com honestidade (nao inventa integracao impossivel)
- Prazos NUNCA sao gravados sem revisao humana
- Simples por fora, robusto por dentro
