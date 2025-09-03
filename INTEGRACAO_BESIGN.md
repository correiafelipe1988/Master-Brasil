# 📝 Integração BeSign - Master Brasil

## 🎯 **WEBHOOK CONFIGURADO PARA BESIGN**

### **URL do Webhook:**
```
https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook
```

### **Método:** `POST`
### **Content-Type:** `application/json`

---

## 🔧 **CONFIGURAÇÃO BESIGN**

### **1. Variáveis de Ambiente**
Configure no seu sistema:

```env
# URL da API BeSign
VITE_SIGNATURE_API_URL=https://api.besign.app

# Token de autenticação BeSign
VITE_SIGNATURE_API_TOKEN=seu_token_besign_aqui

# URL do webhook (já configurada)
VITE_WEBHOOK_URL=https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook
```

### **2. Configuração no Painel BeSign**
1. Acesse o painel administrativo da BeSign
2. Vá em **Configurações** → **Webhooks**
3. Adicione novo webhook:
   - **URL:** `https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook`
   - **Eventos:** Selecione todos os eventos de documento
   - **Método:** POST
   - **Content-Type:** application/json

---

## 📋 **EVENTOS BESIGN SUPORTADOS**

### **Eventos Principais:**
- `document.created` - Documento criado na BeSign
- `document.sent` - Documento enviado para assinatura
- `document.signed` - Um signatário assinou
- `document.completed` - Todos assinaram (documento finalizado)
- `document.rejected` - Documento rejeitado
- `document.expired` - Documento expirado

### **Payload BeSign Esperado:**
```json
{
  "event": "document.completed",
  "id": "besign_doc_123456",
  "status": "completed",
  "completed_at": "2025-01-15T10:30:00Z",
  "signer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678901",
    "signed_at": "2025-01-15T10:30:00Z"
  },
  "document": {
    "name": "contrato_locacao_123.pdf",
    "url": "https://original-url.com/doc.pdf",
    "download_url": "https://besign.app/download/doc_signed.pdf"
  },
  "metadata": {
    "rental_id": "rental_uuid",
    "contract_id": "contract_uuid",
    "city_id": "city_uuid"
  }
}
```

---

## 🔄 **MAPEAMENTO DE STATUS**

### **BeSign → Sistema Master Brasil:**
- `pending` → `sent`
- `sent` → `sent`
- `signed` → `signed`
- `completed` → `signed`
- `rejected` → `cancelled`
- `expired` → `cancelled`
- `cancelled` → `cancelled`

---

## 🛠️ **IMPLEMENTAÇÃO TÉCNICA**

### **Serviço de Assinatura Digital:**
```typescript
// Configuração automática para BeSign
private static readonly API_BASE_URL = 'https://api.besign.app';

// Método específico para BeSign
private static async sendToBeSign(data) {
  const response = await fetch(`${this.API_BASE_URL}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_TOKEN}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      document: {
        name: data.document_name,
        url: data.document_url,
        auto_close: true,
        locale: 'pt-BR'
      },
      signers: data.signers.map((signer, index) => ({
        name: signer.name,
        email: signer.email,
        document: signer.cpf,
        phone: signer.phone,
        order: index + 1,
        sign_method: 'email'
      })),
      webhook: {
        url: data.webhook_url,
        events: [
          'document.created',
          'document.sent', 
          'document.signed',
          'document.completed',
          'document.rejected',
          'document.expired'
        ]
      },
      metadata: data.metadata
    })
  });
}
```

### **Webhook Processor:**
- ✅ Processa eventos BeSign (`document.created`, `document.completed`, etc.)
- ✅ Mantém compatibilidade com eventos genéricos
- ✅ Mapeia campos BeSign (`id`, `download_url`, `completed_at`)
- ✅ Atualiza contratos automaticamente

---

## 🧪 **TESTES**

### **Testar Webhook:**
```bash
node test_webhook_integration.js
```

### **Testar Evento Específico:**
```bash
node test_webhook_integration.js "document.completed"
```

### **Payload de Teste Manual:**
```bash
curl -X POST https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "event": "document.completed",
    "id": "test_besign_001",
    "status": "completed",
    "completed_at": "2025-01-15T10:30:00Z",
    "document": {
      "name": "contrato_teste.pdf",
      "download_url": "https://example.com/signed.pdf"
    }
  }'
```

---

## 📊 **MONITORAMENTO**

### **Verificar Contratos BeSign:**
```sql
SELECT 
  id,
  contract_number,
  status,
  signature_request_id,
  pdf_url,
  signed_at,
  created_at
FROM generated_contracts 
WHERE signature_request_id LIKE 'besign_%'
ORDER BY created_at DESC;
```

### **Logs do Webhook:**
- Acesse: Supabase Dashboard → Edge Functions → signature-webhook → Logs
- Monitore eventos em tempo real
- Verifique erros de processamento

---

## 🔐 **SEGURANÇA**

### **Autenticação:**
- Token Bearer na API BeSign
- Validação de payload no webhook
- Headers CORS configurados

### **Validação de Webhook:**
- Verificação de campos obrigatórios
- Suporte a assinatura HMAC (opcional)
- Logs detalhados para auditoria

---

## 🚀 **FLUXO COMPLETO**

### **1. Geração do Contrato:**
```
Usuário gera contrato → PDF criado → Upload Supabase Storage → Envio BeSign
```

### **2. Processo de Assinatura:**
```
BeSign envia webhook → Webhook processa → Contrato atualizado → Notificações
```

### **3. Finalização:**
```
document.completed → Status 'signed' → PDF assinado salvo → Processo concluído
```

---

## ✅ **CHECKLIST DE INTEGRAÇÃO**

### **Para a BeSign:**
- [ ] Configurar webhook URL no painel
- [ ] Selecionar eventos de documento
- [ ] Testar envio de webhook
- [ ] Validar estrutura do payload

### **Para o Sistema:**
- [x] Webhook configurado e funcionando
- [x] Suporte a eventos BeSign
- [x] Mapeamento de status correto
- [x] Testes automatizados criados

---

## 📞 **SUPORTE**

### **Problemas Comuns:**
1. **Webhook não recebido:** Verificar URL e configuração no painel BeSign
2. **Erro de autenticação:** Verificar token da API BeSign
3. **Contrato não atualizado:** Verificar se `signature_request_id` está correto
4. **Status incorreto:** Verificar mapeamento de status BeSign

### **Logs Úteis:**
```javascript
// No webhook
console.log('📥 [Webhook] Payload recebido:', payload);
console.log('🔄 [Webhook] Processando evento:', event);
console.log('✅ [Webhook] Contrato atualizado:', data[0]);
```

**Integração BeSign pronta para produção!** 🎉
