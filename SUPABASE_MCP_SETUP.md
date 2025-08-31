# Configuração do MCP Supabase

## Passo 1: Copiar configuração para o Claude Desktop

Copie o conteúdo do arquivo `claude_desktop_config.json` e cole no arquivo de configuração do Claude Desktop:

**Localização do arquivo de configuração do Claude Desktop:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

## Passo 2: Substituir o Access Token

1. No arquivo `claude_desktop_config.json` criado, substitua `SEU_ACCESS_TOKEN_AQUI` pelo seu Access Token real do Supabase
2. O Access Token deve ser um Service Role Key ou Personal Access Token do Supabase

## Passo 3: Instalação do servidor MCP Supabase

O servidor MCP do Supabase já foi instalado no projeto:

```bash
npm install mcp-supabase
```

## Passo 4: Configuração final

1. **Backup da configuração atual do Claude Desktop (se existir):**
   ```bash
   cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup
   ```

2. **Copiar a nova configuração:**
   ```bash
   cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Reiniciar o Claude Desktop** para carregar a nova configuração

## Passo 5: Editar com seu Access Token

Edite o arquivo copiado e substitua `SEU_ACCESS_TOKEN_AQUI` pelo seu token:

```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## Configuração Completa

Após a configuração, o arquivo deve ficar assim:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "mcp-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://diopahhcwhdasextobav.supabase.co",
        "SUPABASE_ACCESS_TOKEN": "sbp_seu_token_real_aqui"
      }
    }
  }
}
```

## Verificação

Após reiniciar o Claude Desktop, você deve ver o MCP Supabase ativo e poderá usar comandos relacionados ao banco de dados diretamente no chat.

## Tipos de Access Token

- **Service Role Key**: Para acesso completo (recomendado para desenvolvimento)
- **Personal Access Token**: Para operações mais limitadas
- **Anon Key**: Não recomendado para MCP (acesso muito limitado)

O token deve começar com `sbp_` (Personal Access Token) ou ser uma service role key.