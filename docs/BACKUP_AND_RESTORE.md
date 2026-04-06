# Backup e Restauracao - Guia Simples

## O que e backup?

Backup e uma copia de seguranca de todos os dados do sistema:
clientes, casos, documentos, financeiro, prazos, tudo.

Se algo der errado (computador quebrar, virus, erro humano),
voce pode restaurar essa copia e nao perder nada.

---

## Como fazer backup

### Passo 1
Abra o terminal (Prompt de Comando ou Git Bash) na pasta do sistema.

### Passo 2
Digite:
```
npm run backup
```

### Passo 3
Pronto! O backup foi salvo na pasta `infra/backups/` com a data e hora no nome.

Exemplo: `juris_backup_20240315_143000.sql.gz`

---

## Como restaurar um backup

### ATENCAO: Restaurar um backup SUBSTITUI todos os dados atuais!

### Passo 1
Abra o terminal na pasta do sistema.

### Passo 2
Para restaurar o backup mais recente:
```
npm run restore
```

Para restaurar um backup especifico:
```
bash infra/scripts/restore.sh infra/backups/juris_backup_20240315_143000.sql.gz
```

### Passo 3
O sistema vai perguntar se voce tem certeza. Digite `s` e aperte Enter.

### Passo 4
Aguarde a mensagem de sucesso.

---

## Backup automatico

O sistema limpa automaticamente backups com mais de 30 dias.

Para fazer backup todo dia automaticamente, configure um agendamento
no Windows (Agendador de Tarefas) ou deixe rodar o comando
`npm run backup` uma vez por dia.

---

## Onde ficam os backups?

Na pasta: `infra/backups/`

Recomendacao: copie os backups para outro lugar tambem
(pendrive, HD externo, nuvem) para maior seguranca.

---

## Duvidas comuns

**Quanto espaco ocupa um backup?**
Depende da quantidade de dados. No inicio, poucos KB.
Com muitos dados, alguns MB. Dificilmente passara de 100MB.

**Posso fazer backup com o sistema ligado?**
Sim, pode fazer backup a qualquer momento.

**O que NAO esta no backup?**
Arquivos fisicos (PDFs, documentos) que estao nas pastas do computador.
O backup protege os dados do sistema (cadastros, financeiro, prazos).
Faca backup das pastas de documentos separadamente.
