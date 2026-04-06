# Como Usar o JurisSystem no Dia a Dia

## LIGAR O SISTEMA (todo dia de manha)

### Passo 1 - Abrir o terminal
- Aperte as teclas Windows + R
- Digite: cmd
- Aperte Enter

### Passo 2 - Digitar estes comandos (copie e cole)
```
cd C:\Users\Administrador\Documents\Documents\juris-sistema
npm run dev
```

### Passo 3 - Aguardar
- Espere aparecer "ready" ou "started" no terminal
- Demora uns 15-30 segundos

### Passo 4 - Abrir no navegador
- Abra o Chrome ou Edge
- Digite na barra de endereco: http://localhost:3000
- Pronto!

### Passo 5 - Fazer login
- Email: admin@juris.local
- Senha: mudar123 (troque na primeira vez)

---

## DESLIGAR O SISTEMA (fim do dia)

- Va no terminal onde o sistema esta rodando
- Aperte Ctrl + C
- Pode fechar o terminal

---

## O QUE FAZER EM CADA TELA

### DASHBOARD (tela inicial)
O que aparece aqui:
- Alertas criticos (vermelho) = coisas urgentes
- Prazos vencendo (amarelo) = prazos proximos
- Tarefas pendentes = coisas para fazer
- Pagamentos pendentes = clientes devendo
- Conversas nao triadas = mensagens novas para classificar

**Rotina:** Olhe essa tela TODO DIA de manha. Resolva o que estiver vermelho primeiro.

---

### CLIENTES
Para cadastrar um cliente novo:
1. Clique em "Novo Cliente"
2. Preencha nome e telefone (minimo)
3. Marque o status: "Cliente Ativo" ou "Potencial Cliente"
4. Salve

Para encontrar um cliente:
- Use a barra de busca (nome, CPF, telefone)
- Use as abas: Todos, Ativos, Potenciais, Encerrados

---

### CASOS
Cada cliente pode ter varios casos (processos, servicos).

Para criar um caso:
1. Va em Casos > Novo Caso
2. Selecione o cliente
3. Preencha o titulo (ex: "Reclamacao Trabalhista - Maria vs Empresa X")
4. Escolha a area do direito
5. Se ja tiver numero do processo, coloque
6. Salve

---

### CONVERSAS
Aqui voce registra mensagens importantes do WhatsApp.

Para importar uma conversa:
1. Clique em "Importar"
2. Escolha "WhatsApp"
3. Cole o texto da conversa
4. Clique Importar

Para classificar:
- Abra a conversa
- Clique em: Cliente, Potencial, Pessoal ou Ignorar
- Isso ajuda o sistema a organizar

**Dica:** Nao precisa importar TUDO. So o que e importante para o caso.

---

### DOCUMENTOS
Para encontrar um documento:
- Use a busca por nome
- Filtre por cliente ou caso

Para subir um documento:
1. Clique em "Upload"
2. Selecione o arquivo (PDF, DOC, imagem)
3. Vincule ao cliente e/ou caso
4. Salve

---

### MODELOS (gerar documentos automaticamente)
O sistema ja vem com 3 modelos prontos:
- Procuracao
- Declaracao de Hipossuficiencia
- Contrato de Honorarios

Para gerar:
1. Va em Modelos
2. Clique "Gerar Documento" no modelo desejado
3. Selecione o cliente
4. O sistema preenche automaticamente com os dados do cliente
5. Baixe o PDF

---

### FINANCEIRO
Para lancar honorarios:
1. Va no caso do cliente
2. Aba "Financeiro"
3. Crie o contrato de honorarios
4. Defina: valor, tipo (a vista, parcelado, mensal, exito)
5. O sistema cria as parcelas automaticamente

Para registrar pagamento:
1. Va em Financeiro
2. Encontre a parcela
3. Clique para registrar o pagamento
4. Informe data e forma (PIX, transferencia, etc)

**O sistema avisa quando tem parcela vencida!**

---

### PUBLICACOES E PRAZOS
Para registrar uma publicacao do diario:
1. Clique "Importar Publicacao"
2. Cole o texto da publicacao
3. O sistema tenta identificar o processo, partes e tipo de ato
4. Vincule ao caso

Para prazos:
- O sistema SUGERE o prazo com base na regra (CPC, CLT, etc)
- Voce PRECISA CONFIRMAR clicando em "Confirmar"
- NUNCA confie so na sugestao - sempre confira!

**IMPORTANTE: Prazo so vale depois que VOCE confirma!**

---

### ADMINISTRACAO
- Usuarios: criar contas para outros advogados ou assistentes
- Calendario Forense: ver feriados e suspensoes
- Auditoria: ver quem fez o que no sistema

---

## BACKUP (fazer pelo menos 1x por semana)

### Pelo terminal:
```
cd C:\Users\Administrador\Documents\Documents\juris-sistema
npm run backup
```

O arquivo de backup fica em: juris-sistema\infra\backups\

**Dica:** Copie esse arquivo para um pendrive ou nuvem de vez em quando.

---

## PROBLEMAS COMUNS

### "O sistema nao abre"
1. Verifique se o terminal esta rodando (Passo 1 e 2 acima)
2. Verifique se digitou o endereco certo: http://localhost:3000

### "Deu erro ao salvar"
1. Verifique se o PostgreSQL esta rodando
2. Abra outro terminal e digite: npm run db:push
3. Tente de novo

### "Esqueci a senha"
- Fale comigo (Claude) que eu reseto

### "Preciso restaurar o backup"
```
cd C:\Users\Administrador\Documents\Documents\juris-sistema
npm run restore
```
Ele pergunta se tem certeza. Digite "s" e Enter.

---

## RESUMO DA ROTINA DIARIA

1. Liga o sistema (2 comandos no terminal)
2. Abre o navegador em localhost:3000
3. Olha o Dashboard - resolve o que esta vermelho
4. Cadastra clientes novos se chegaram
5. Importa conversas importantes do WhatsApp
6. Registra publicacoes e confere prazos
7. Confere pagamentos pendentes
8. No fim do dia, Ctrl+C no terminal
