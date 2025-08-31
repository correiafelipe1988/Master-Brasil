#!/bin/bash

# Script para configurar MCP Supabase
echo "🚀 Configurando MCP Supabase para Claude Desktop..."

# Verificar se o Access Token foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Access Token não fornecido"
    echo "Uso: ./setup-mcp.sh SEU_ACCESS_TOKEN"
    echo "Exemplo: ./setup-mcp.sh sbp_abcd1234..."
    exit 1
fi

ACCESS_TOKEN=$1
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# Criar diretório se não existir
mkdir -p "$CLAUDE_CONFIG_DIR"

# Fazer backup se já existir configuração
if [ -f "$CONFIG_FILE" ]; then
    echo "📋 Fazendo backup da configuração existente..."
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Substituir o token no arquivo de configuração
echo "⚙️  Criando configuração MCP..."
sed "s/SEU_ACCESS_TOKEN_AQUI/$ACCESS_TOKEN/g" claude_desktop_config.json > "$CONFIG_FILE"

echo "✅ Configuração MCP criada em: $CONFIG_FILE"
echo ""
echo "📋 Próximos passos:"
echo "1. Feche completamente o Claude Desktop"
echo "2. Reabra o Claude Desktop" 
echo "3. Verifique se o MCP Supabase aparece na lista de conexões"
echo ""
echo "🔍 Para verificar se funcionou, pergunte ao Claude:"
echo "   'Quais tabelas existem no meu banco Supabase?'"
echo ""
echo "✨ Pronto! MCP Supabase configurado com sucesso!"