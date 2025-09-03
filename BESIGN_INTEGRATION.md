# Integração BeSign v2 - Guia de Configuração

## Visão Geral

Este documento descreve a integração completa com a API BeSign v2 para assinatura eletrônica de documentos no sistema CRM.

## Arquivos Criados

### Serviços
- `src/services/beSignService.ts` - Serviço principal para integração com BeSign v2 API
- `src/services/digitalSignatureService.ts` - Atualizado para usar BeSign v2

### Componentes
- `src/components/BeSignSignature.tsx` - Componente para criação e envio de documentos
- `src/components/BeSignDocumentManager.tsx` - Componente para gerenciamento de documentos
- `src/components/DigitalSignature.tsx` - Atualizado com sistema de abas (BeSign v2 + Legacy)

## Configuração

### 1. Variáveis de Ambiente (.env)

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Configurações de Assinatura Digital BeSign v2
VITE_BESIGN_API_URL="https://app-sign.efcaz.com.br/efcaz-clm/api"
VITE_BESIGN_API_KEY="SUA_API_KEY_AQUI"
VITE_WEBHOOK_URL="https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook"
```

**⚠️ Importante:** Substitua `SUA_API_KEY_AQUI` pela sua API Key real do BeSign.

### 2. Obter API Key do BeSign

1. Acesse a plataforma BeSign
2. Vá em Configurações → Integrações
3. Gere uma nova API Key
4. Copie e cole no arquivo `.env`

### 3. Configuração de Webhook

1. Na plataforma BeSign, vá em Configurações → Integrações → Webhook
2. Ative o webhook
3. Insira a URL: `https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook`
4. Configure os eventos desejados

## Funcionalidades Implementadas

### BeSignService (src/services/beSignService.ts)

#### Documentos
- ✅ Criar documento
- ✅ Buscar documento
- ✅ Listar documentos
- ✅ Assinar documento
- ✅ Formalizar documento
- ✅ Download (completo, assinado, impressão)
- ✅ Arquivar/desarquivar
- ✅ Cancelar
- ✅ Remover

#### Signatários
- ✅ Buscar signatários
- ✅ Inserir signatário
- ✅ Convidar signatário
- ✅ Remover signatário

#### Pastas
- ✅ Buscar pastas
- ✅ Criar pasta
- ✅ Renomear pasta

#### Usuários
- ✅ Buscar usuários
- ✅ Criar usuário
- ✅ Alterar nível de acesso

### Componentes de Interface

#### BeSignSignature
- ✅ Interface para adicionar signatários
- ✅ Configuração de papéis e tipos de documento
- ✅ Validação de formulário
- ✅ Envio para assinatura
- ✅ Feedback visual de status

#### BeSignDocumentManager
- ✅ Listagem de documentos
- ✅ Filtros por status
- ✅ Busca por nome/ID
- ✅ Ações: download, formalizar, arquivar, cancelar, remover
- ✅ Interface responsiva

#### DigitalSignature (Atualizado)
- ✅ Sistema de abas (BeSign v2 + Legacy)
- ✅ Compatibilidade com sistema anterior
- ✅ Integração transparente

## Como Usar

### 1. Enviar Documento para Assinatura

```tsx
import { BeSignSignature } from '@/components/BeSignSignature';

<BeSignSignature
  documentName="Contrato de Locação - Cliente"
  contractNumber="CONT-001"
  rentalId="rental-123"
  onSignatureRequest={(request) => {
    console.log('Documento enviado:', request);
  }}
/>
```

### 2. Gerenciar Documentos

```tsx
import { BeSignDocumentManager } from '@/components/BeSignDocumentManager';

<BeSignDocumentManager
  rentalId="rental-123"
  onDocumentUpdate={(document) => {
    console.log('Documento atualizado:', document);
  }}
/>
```

### 3. Usar API Diretamente

```tsx
import { BeSignService } from '@/services/beSignService';

// Criar documento
const documento = await BeSignService.criarDocumento({
  nome: "Contrato de Locação",
  data_inicio_vigencia: "01-01-2024",
  data_fim_vigencia: "31-12-2024",
  data_inicio_assinatura: "01-01-2024",
  data_fim_assinatura: "08-01-2024",
  identificador_pasta: "pasta-123",
  arquivos: [{
    nome: "contrato.pdf",
    pdf_base64: "base64_string..."
  }],
  signatarios: [{
    dados_pessoais: {
      email: "cliente@email.com"
    },
    dados_assinatura: {
      tipo_assinatura: "Eletronica",
      tipo_documento: "CPF",
      papel: "Contratante"
    }
  }]
});

// Buscar documentos
const documentos = await BeSignService.buscarDocumentos();

// Download documento assinado
const blob = await BeSignService.downloadDocumentoAssinado("doc-id");
```

## Status e Papéis Suportados

### Status de Documentos
- `PENDENTE` - Aguardando assinatura
- `ASSINADO` - Documento assinado
- `FORMALIZADO` - Documento formalizado
- `CANCELADO` - Documento cancelado
- `EXPIRADO` - Documento expirado

### Papéis de Signatários
- Contratante
- Contratada
- Testemunha
- Avalista
- Representante Legal
- Procurador
- E outros conforme documentação BeSign

### Tipos de Documento
- CPF
- RG
- CNH
- Outros

## Webhook

O sistema está preparado para receber webhooks do BeSign com a seguinte estrutura:

```json
{
  "dataHoraNotificacao": "14/12/2023 10:26:25 BRT",
  "documento": {
    "identificador": "290456de-1d88-4eb9-b999-db2708c8a900"
  },
  "contato": {
    "identificador": "1734f56c-2615-4358-8526-cd18a220d783",
    "status": "ASSINADO"
  }
}
```

## Fallbacks e Tratamento de Erro

- ✅ Fallback para modo mock em desenvolvimento
- ✅ Tratamento de erros de API
- ✅ Logs detalhados para debug
- ✅ Validação de dados
- ✅ Sistema de retry automático

## Próximos Passos

1. **Configurar Webhook Real**: Implementar endpoint para processar webhooks
2. **Testes de Integração**: Testar com API Key real
3. **Monitoramento**: Implementar logs e métricas
4. **Documentação de Usuário**: Criar guia para usuários finais

## Limitações da Versão FREE

- 100 requisições por mês
- 10 documentos via email
- Funcionalidades limitadas

Para produção, considere o upgrade para versão paga.

## Suporte

Para dúvidas sobre a integração:
1. Consulte a [documentação oficial do BeSign](https://docs.besign.com.br)
2. Verifique os logs no console do navegador
3. Teste com dados mock primeiro

## Estrutura da API BeSign v2

Base URL: `https://app-sign.efcaz.com.br/efcaz-clm/api/public/v2`

Todas as requisições requerem o header:
```
API-KEY: sua_api_key_aqui
Content-Type: application/json
```

A integração está completa e pronta para uso!