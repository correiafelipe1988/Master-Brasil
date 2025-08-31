# Sistema de PDF e Assinatura Eletrônica - Master Brasil

Este documento descreve o sistema completo de geração de PDF, assinatura eletrônica e notificações implementado no CRM Master Brasil.

## 🚀 Funcionalidades Implementadas

### 📄 Geração de PDF
- **Contratos de Locação**: Templates dinâmicos com dados da locação
- **Recibos**: Comprovantes de pagamento personalizados
- **Preview em tempo real**: Visualização antes do download
- **Download direto**: Salvamento local dos documentos
- **Armazenamento na nuvem**: Upload automático para Supabase Storage

### ✍️ Assinatura Eletrônica
- **Integração D4Sign/Clicksign**: Suporte aos principais provedores
- **Múltiplos signatários**: Cliente, franqueado e testemunhas
- **Acompanhamento em tempo real**: Status de cada assinatura
- **Webhooks**: Recebimento automático de status
- **Cancelamento**: Possibilidade de cancelar solicitações

### 📧 Notificações por Email
- **Templates personalizados**: HTML e texto
- **Variáveis dinâmicas**: Substituição automática de dados
- **Múltiplos provedores**: Resend, SendGrid
- **Log de emails**: Histórico de envios
- **Anexos**: Suporte a documentos PDF

### 📊 Dashboard de Monitoramento
- **Estatísticas**: Visão geral das assinaturas
- **Progresso**: Acompanhamento por documento
- **Filtros**: Por locação ou visão geral
- **Ações**: Cancelar, reenviar, etc.

## 🛠️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 2. Configuração do Supabase

#### Tabelas necessárias:

```sql
-- Tabela para solicitações de assinatura
CREATE TABLE signature_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  signers JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rental_id UUID REFERENCES rentals(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para templates de email
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para log de emails
CREATE TABLE email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  rental_id UUID REFERENCES rentals(id),
  signature_request_id UUID REFERENCES signature_requests(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false);

-- Políticas de acesso
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');
```

### 3. Configuração D4Sign

1. Crie uma conta em [D4Sign](https://www.d4sign.com.br/)
2. Obtenha sua API Key
3. Configure o webhook endpoint
4. Adicione as variáveis no `.env`:

```env
VITE_SIGNATURE_PROVIDER=d4sign
VITE_SIGNATURE_API_URL=https://api.d4sign.com.br/v1
VITE_SIGNATURE_API_TOKEN=your_d4sign_token
VITE_WEBHOOK_URL=https://your-app.com/api/webhooks/signature
```

### 4. Configuração Clicksign (Alternativa)

1. Crie uma conta em [Clicksign](https://www.clicksign.com/)
2. Obtenha sua API Key
3. Configure as variáveis:

```env
VITE_SIGNATURE_PROVIDER=clicksign
VITE_SIGNATURE_API_URL=https://api.clicksign.com/v1
VITE_SIGNATURE_API_TOKEN=your_clicksign_token
```

### 5. Configuração de Email

#### Resend (Recomendado)

1. Crie uma conta em [Resend](https://resend.com/)
2. Obtenha sua API Key
3. Configure:

```env
VITE_EMAIL_PROVIDER=resend
VITE_EMAIL_API_KEY=your_resend_api_key
VITE_FROM_EMAIL=noreply@masterbrasil.com
VITE_FROM_NAME=Master Brasil
```

#### SendGrid (Alternativa)

```env
VITE_EMAIL_PROVIDER=sendgrid
VITE_EMAIL_API_KEY=your_sendgrid_api_key
```

## 📱 Como Usar

### 1. Criar uma Locação

1. Acesse a página de Locações
2. Clique em "Nova Locação"
3. Preencha os dados do cliente
4. Selecione motocicleta e plano
5. Salve a locação

**Resultado**: Email de confirmação enviado automaticamente

### 2. Gerar Documentos PDF

1. Na lista de locações, clique no ícone de visualizar
2. Na seção "Documentos da Locação":
   - **Visualizar**: Preview do documento
   - **Baixar**: Download direto
   - **Gerar & Salvar**: Salva na nuvem
   - **Enviar Email**: Envia por email

### 3. Solicitar Assinatura Eletrônica

1. No modal de detalhes da locação
2. Na seção "Assinatura Eletrônica"
3. Clique em "Nova Solicitação"
4. Configure os signatários
5. Envie para assinatura

**Resultado**: Emails enviados para todos os signatários

### 4. Monitorar Assinaturas

1. Use o componente `SignatureDashboard`
2. Acompanhe o progresso em tempo real
3. Receba notificações via webhook
4. Cancele se necessário

## 🔧 Componentes Principais

### PDFService
```typescript
// Gerar contrato
const doc = PDFService.generateRentalContract(contractData);

// Gerar recibo
const receipt = PDFService.generateRentalReceipt(contractData);
```

### DigitalSignatureService
```typescript
// Criar solicitação
const request = await DigitalSignatureService.createSignatureRequest(
  pdfBlob, fileName, signers, rentalId
);

// Processar webhook
await DigitalSignatureService.processWebhook(payload);
```

### EmailService
```typescript
// Enviar email com template
await EmailService.sendEmail({
  to: 'cliente@email.com',
  template_id: 'rental_created',
  template_variables: { client_name: 'João' }
});
```

## 🎯 Fluxo Completo

1. **Locação Criada** → Email de confirmação enviado
2. **PDF Gerado** → Documento salvo na nuvem
3. **Assinatura Solicitada** → Emails enviados aos signatários
4. **Documento Assinado** → Webhook recebido → Status atualizado → Email de confirmação
5. **Locação Ativada** → Cliente pode retirar o veículo

## 🚨 Troubleshooting

### Problemas Comuns

1. **PDFs não geram**: Verifique se jsPDF está instalado
2. **Emails não enviam**: Verifique API keys e configurações
3. **Webhooks não funcionam**: Verifique URL e assinatura
4. **Assinaturas falham**: Verifique credenciais do provedor

### Logs de Debug

Ative o modo debug no `.env`:
```env
VITE_DEBUG_MODE=true
```

### Monitoramento

- Verifique logs no console do navegador
- Monitore tabela `email_logs` no Supabase
- Acompanhe webhooks no provedor de assinatura

## 📈 Próximos Passos

1. **Relatórios**: Dashboard com métricas avançadas
2. **Automação**: Fluxos automáticos baseados em eventos
3. **Integração WhatsApp**: Notificações via WhatsApp
4. **Assinatura em lote**: Múltiplos documentos simultaneamente
5. **Templates customizáveis**: Editor visual de templates

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique este documento
2. Consulte logs de erro
3. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido para Master Brasil** 🏍️
