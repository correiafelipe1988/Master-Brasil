# 🚀 Instruções para Deploy do Webhook

## 📋 **OPÇÃO 1: Deploy via Supabase Dashboard (Recomendado)**

### **Passo 1: Acessar o Dashboard**
1. Acesse: https://supabase.com/dashboard/project/diopahhcwhdasextobav
2. Vá para **Edge Functions** no menu lateral
3. Clique em **Create a new function**

### **Passo 2: Configurar a Função**
- **Nome:** `signature-webhook`
- **Código:** Copie todo o conteúdo do arquivo `supabase/functions/signature-webhook/index.ts`

### **Passo 3: Deploy**
1. Cole o código completo
2. Clique em **Deploy function**
3. Aguarde o deploy ser concluído

---

## 📋 **OPÇÃO 2: Deploy via CLI (Se disponível)**

### **Instalar Supabase CLI:**
```bash
# macOS
brew install supabase/tap/supabase

# npm
npm install -g supabase

# Verificar instalação
supabase --version
```

### **Fazer Login:**
```bash
supabase login
```

### **Deploy da Função:**
```bash
cd /Users/felipecorreia/Master\ Brasil/city-scope-crm
supabase functions deploy signature-webhook --project-ref diopahhcwhdasextobav
```

---

## 🔧 **CONFIGURAÇÃO APÓS DEPLOY**

### **1. Verificar URL da Função**
Após o deploy, a URL será:
```
https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook
```

### **2. Testar a Função**
```bash
curl -X POST https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "event": "document_sent",
    "document_id": "test_doc_123",
    "signature_request_id": "test_req_456",
    "status": "pending"
  }'
```

### **3. Configurar na Empresa de Assinatura**
- **Webhook URL:** `https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook`
- **Método:** POST
- **Content-Type:** application/json
- **Eventos:** document_sent, signer_signed, document_signed, document_rejected, document_expired

---

## 🔐 **VARIÁVEIS DE AMBIENTE (Opcional)**

No dashboard do Supabase, em **Settings > Edge Functions**, adicione:

```env
WEBHOOK_SECRET=sua_chave_secreta_para_validacao
```

---

## ✅ **VERIFICAÇÃO**

### **1. Logs da Função**
- Acesse **Edge Functions > signature-webhook > Logs**
- Monitore os logs em tempo real

### **2. Teste de Integração**
1. Gere um contrato no sistema
2. Envie para assinatura
3. Simule webhook da empresa de assinatura
4. Verifique se o status do contrato foi atualizado

### **3. Verificar Contratos**
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
WHERE signature_request_id IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🆘 **TROUBLESHOOTING**

### **Erro: Function not found**
- Verifique se o deploy foi bem-sucedido
- Confirme a URL da função

### **Erro: Invalid payload**
- Verifique se o JSON está bem formado
- Confirme os campos obrigatórios: `event`, `signature_request_id`, `status`

### **Erro: Database update failed**
- Verifique as políticas RLS da tabela `generated_contracts`
- Confirme se o `signature_request_id` existe

### **Logs não aparecem**
- Aguarde alguns minutos para propagação
- Verifique se a função está sendo chamada corretamente

---

## 📞 **PRÓXIMOS PASSOS**

1. ✅ **Deploy da função webhook**
2. ✅ **Teste com payload de exemplo**
3. ✅ **Configuração na empresa de assinatura**
4. ✅ **Teste de integração completa**
5. ✅ **Monitoramento em produção**

**A função está pronta para receber webhooks da empresa de assinatura eletrônica!** 🎉
