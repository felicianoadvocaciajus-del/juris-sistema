# Setup do Segundo Cérebro (Claude + Obsidian + basic-memory)

> Guia para integrar Claude (Code, Desktop e Web) com Obsidian, criando um segundo cérebro com memória persistente.
> Para usar: copie o **PROMPT** abaixo e cole no Claude Code do seu notebook em uma conversa nova.

---

## Trio do segundo cérebro

| Peça | O que faz |
|---|---|
| **Obsidian** | Vault local em Markdown — seus dados ficam seus |
| **Claude** (Code + Desktop + Web) | Pensamento, escrita, código |
| **basic-memory (MCP)** | Memória persistente — Claude lembra entre sessões |
| + Extensão de navegador | Captura conversas do claude.ai web |
| + Skill `obsidian-second-brain` | Claude escreve sozinho no vault |

---

## PROMPT — copie e cole no Claude Code do notebook

```markdown
# MISSÃO: Construir meu Segundo Cérebro com Claude + Obsidian + basic-memory

Sou ANALFABETO DIGITAL. Trate-me com paciência. Toda vez que usar uma palavra técnica, traduza em parênteses. Antes de cada comando, explique em uma frase o QUE vai fazer e POR QUÊ. Pergunte antes de qualquer coisa irreversível. Se eu errar, me corrija com calma. Confirme cada etapa concluída com um teste real (não suponha que funcionou).

## OBJETIVO FINAL
Que TUDO que eu converso com você (Claude) — em qualquer interface (Claude Code, Claude Desktop, Claude.ai web, Projects) — seja salvo automaticamente como notas no meu vault do Obsidian, formando um segundo cérebro permanente, pesquisável, e que VOCÊ MESMO consulta no início de cada nova conversa para nunca mais esquecer nada do que conversamos.

## FERRAMENTAS A INSTALAR (na ordem)

### Bloco A — Diagnóstico e preparação
1. Detecte: SO (sistema operacional), arquitetura, shell, e o que já está instalado: Obsidian, Claude Desktop, Claude Code, Node.js, npm, Python 3.10+, uv/uvx, Homebrew (macOS) ou Chocolatey/Scoop (Windows).
2. Pergunte:
   - Caminho ABSOLUTO do meu vault do Obsidian (ex.: `/Users/joao/Documents/MeuCerebro`). Se eu não tiver vault, crie um.
   - Se posso fechar e reabrir Obsidian/Claude Desktop quando você pedir.
   - Se uso navegador Chrome, Edge, Brave ou Firefox (para a extensão).
3. Instale o que faltar (Node, uv, etc.) com explicação simples antes.
4. Mostre um resumo do diagnóstico e espere meu "ok".

### Bloco B — Estrutura do vault (segundo cérebro)
Crie esta estrutura DENTRO do meu vault, só se ainda não existir:
```
00_Inbox/                    (entrada — onde tudo cai primeiro)
01_Conversas/
   ├── ClaudeCode/           (logs do Claude Code)
   ├── ClaudeDesktop/        (logs do Claude Desktop)
   ├── ClaudeWeb/            (chats do claude.ai)
   └── Projetos/             (Projects do Claude.ai)
02_Projetos/                 (meus projetos pessoais/profissionais)
03_Areas/                    (áreas permanentes da minha vida)
04_Recursos/                 (referências, anotações)
05_Arquivo/                  (concluído/inativo)
99_Memoria/                  (memória persistente do basic-memory)
_CLAUDE.md                   (instruções globais que o Claude lê toda sessão)
```
Crie um `_CLAUDE.md` na raiz do vault com este conteúdo (adapte ao meu nome quando eu te disser):
```markdown
# Instruções permanentes para Claude

Você é meu parceiro de pensamento. No início de TODA sessão:
1. Leia as 5 conversas mais recentes em `01_Conversas/`.
2. Leia `99_Memoria/index.md` (fatos importantes sobre mim e meus projetos).
3. Resuma em 3 linhas o que lembra antes de responder a primeira pergunta.

Ao final de cada sessão (ou quando eu disser "salva"):
- Escreva um resumo em `01_Conversas/[interface]/AAAA-MM-DD-titulo.md`.
- Atualize `99_Memoria/index.md` com fatos novos relevantes.
- Use frontmatter YAML com tags e data.
```

### Bloco C — Integração 1: basic-memory (CORAÇÃO do sistema)
- Repositório: `basicmachines-co/basic-memory`
- Instale via `uvx` (recomendado) ou `pipx`.
- Configure para usar `99_Memoria/` do meu vault como pasta de memória.
- Adicione ao `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "basic-memory": {
      "command": "uvx",
      "args": ["basic-memory", "mcp"],
      "env": {
        "BASIC_MEMORY_HOME": "<CAMINHO_VAULT>/99_Memoria"
      }
    }
  }
}
```
- Faça backup `.bak` do config antes de editar. Faça MERGE (não sobrescreva).
- Teste: peça pra eu dizer "lembra-se que meu nome é X e adoro Y", reinicie o Claude Desktop, abra nova conversa e pergunte "qual meu nome?". Se responder correto, ok.

### Bloco D — Integração 2: Claude Code MCP plugin (Obsidian)
- Repositório: `iansinnott/obsidian-claude-code-mcp`
- Me guie passo a passo no Obsidian: Configurações → Plugins da comunidade → ativar (se desativado) → Procurar "Claude Code MCP" → Instalar → Ativar.
- Confirme que a porta 22360 está livre.
- Teste: rode `claude` dentro da pasta do vault, digite `/mcp` e veja se aparece o servidor do Obsidian.

### Bloco E — Integração 3: MCP Obsidian via REST API
- Repositório do servidor: `MarkusPfundstein/mcp-obsidian`
- No Obsidian: instalar plugin comunitário "Local REST API" → Ativar → Copiar a API Key gerada.
- Aguarde eu colar a key. NUNCA mostre a key em logs ou commits.
- Adicione ao `claude_desktop_config.json` (merge, não sobrescrever):
```json
{
  "mcpServers": {
    "obsidian-rest": {
      "command": "uvx",
      "args": ["mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": "<MINHA_KEY>",
        "OBSIDIAN_HOST": "127.0.0.1",
        "OBSIDIAN_PORT": "27124"
      }
    }
  }
}
```
- Teste: no Claude Desktop, pergunte "liste os arquivos do meu vault". Deve listar.

### Bloco F — Integração 4: Obsidian MCP Tools (busca semântica + Templater)
- Repositório: `jacksteamdev/obsidian-mcp-tools`
- Instale o plugin pelo navegador de plugins comunitários do Obsidian.
- Siga o setup do plugin (ele baixa um binário auxiliar — confirme o caminho).
- Adicione ao `claude_desktop_config.json` se o plugin pedir.
- Teste: pergunte ao Claude algo conceitual sobre minhas notas (ex.: "que ideias minhas se conectam com X?") — deve usar busca semântica, não só palavra-chave.

### Bloco G — Skill "obsidian-second-brain" (autonomia para Claude Code)
- Repositório: `eugeniughelbur/obsidian-second-brain`
- Instale como skill do Claude Code apontando para meu vault.
- Isso permite escritas autônomas, ingestão de conhecimento e agentes agendados.
- Teste: rode `claude` no vault e peça "crie uma nota em 00_Inbox sobre [assunto]".

### Bloco H — Captura do Claude.ai web (browser)
- Instale a extensão **"Claude to Obsidian & Markdown Export"** no meu navegador (Chrome Web Store).
- Configure destino padrão: `01_Conversas/ClaudeWeb/`.
- Como extra, instale o plugin **"Nexus AI Chat Importer"** no Obsidian para importar em massa conversas antigas (se eu já tiver exportado o ZIP do Claude.ai).
- Teste: abra uma conversa em claude.ai, clique no botão da extensão, confirme que o `.md` apareceu no vault.

### Bloco I — Automação "salvar tudo automaticamente"
1. Crie um hook `SessionStart` no Claude Code que:
   - Leia as 5 notas mais recentes em `01_Conversas/ClaudeCode/`.
   - Leia `99_Memoria/index.md`.
2. Crie um hook `SessionEnd` (ou `Stop`) que:
   - Salve um resumo da sessão em `01_Conversas/ClaudeCode/AAAA-MM-DD-titulo.md` com frontmatter YAML.
3. Para o Claude Desktop, instrua basic-memory a salvar conversas automaticamente em `99_Memoria/`.
4. Mostre os hooks no `~/.claude/settings.json` antes de salvar e me explique o que cada um faz.

### Bloco J — Teste final integrado (CRÍTICO)
Faça este roteiro comigo, na ordem:
1. Abra o Claude Desktop, conte 3 fatos sobre mim ("trabalho com X, gosto de Y, projeto atual é Z"). Feche.
2. Abra Claude Code no vault, pergunte "o que você sabe sobre mim?". Deve responder com os 3 fatos (basic-memory + leitura do vault).
3. Use a extensão para salvar uma conversa do claude.ai web. Confirme que apareceu em `01_Conversas/ClaudeWeb/`.
4. No Claude Desktop, peça "encontre nas minhas notas qualquer coisa sobre [assunto dos 3 fatos]". Deve usar busca semântica e citar a nota.
5. Se TODOS os 4 testes passarem, sistema está operacional.

## REGRAS DE OURO
- **NUNCA** sobrescreva `claude_desktop_config.json` — sempre faça MERGE com backup `.bak`.
- **NUNCA** exponha API keys em logs, commits, ou prints.
- **NUNCA** instale algo global sem me avisar antes.
- **SEMPRE** explique o que vai fazer ANTES de fazer, em linguagem de leigo.
- **SEMPRE** teste de verdade — não escreva "deve funcionar".
- Se travar, mostre o erro completo, diagnostique a causa raiz e proponha a correção.

## ENTREGA FINAL
Ao terminar, me dê um relatório com:
1. Tudo que foi instalado e onde está cada arquivo de configuração.
2. Como desinstalar cada coisa se eu quiser desfazer.
3. **5 prompts práticos** que agora funcionam (ex.: "salva essa conversa", "o que conversamos semana passada sobre X?", etc.).
4. **Manutenção semanal**: 3 coisas que devo fazer toda semana para manter o sistema saudável (ex.: rodar `basic-memory sync`, revisar `00_Inbox/`).
5. **Próximos passos opcionais** que posso explorar quando estiver mais confortável (ex.: agentes agendados, integrações com Logseq, Readwise).

Comece pelo Bloco A. Vai com calma. Eu confirmo cada passo.
```

---

## Glossário rápido (linguagem de leigo)

- **Vault**: cofre. É a pasta onde o Obsidian guarda suas anotações.
- **Markdown (.md)**: formato de texto simples com formatação leve. Igual nota de bloco, mas com `**negrito**` e listas.
- **MCP (Model Context Protocol)**: "tomada universal" que conecta o Claude a outras ferramentas (Obsidian, banco de dados, etc.).
- **Servidor MCP**: programinha que fica rodando no fundo e oferece funcionalidades pro Claude usar.
- **Plugin**: extensão que você instala no Obsidian pra adicionar funcionalidades novas.
- **API Key**: senha gerada por um app pra outros programas conversarem com ele.
- **Hook**: gatilho que dispara uma ação automática (ex.: "toda vez que a sessão começar, leia minhas notas").
- **Skill**: habilidade pré-pronta que você instala no Claude Code (ex.: "saber escrever no Obsidian").
- **CLI**: linha de comando — aquela tela preta com texto onde você digita comandos.
- **Repositório (repo)**: pasta de código no GitHub.
- **Commit / Push**: salvar mudanças (commit) e enviar pro GitHub (push).

---

## Fontes

- https://github.com/basicmachines-co/basic-memory
- https://github.com/eugeniughelbur/obsidian-second-brain
- https://github.com/iansinnott/obsidian-claude-code-mcp
- https://github.com/MarkusPfundstein/mcp-obsidian
- https://github.com/jacksteamdev/obsidian-mcp-tools
- https://chromewebstore.google.com/detail/claude-to-obsidian-markdo/ehacefdknbaacgjcikcpkogkocemcdil
- https://forum.obsidian.md/t/plugin-nexus-ai-chat-importer-import-chatgpt-and-claude-conversations-to-your-vault/71664
