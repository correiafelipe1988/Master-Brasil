import { DigitalSignatureService, WebhookPayload } from '@/services/digitalSignatureService';
import { EmailService } from '@/services/emailService';

/**
 * Endpoint para receber webhooks de assinatura eletrônica
 * Este arquivo seria usado em um ambiente Next.js ou similar
 * Para Vite, você precisaria configurar um servidor Express separado
 */

export async function POST(request: Request) {
  try {
    // Verificar autenticação do webhook (opcional)
    const signature = request.headers.get('x-signature');
    const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // Verificar assinatura do webhook para segurança
      const isValid = await verifyWebhookSignature(
        await request.text(),
        signature,
        webhookSecret
      );
      
      if (!isValid) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse do payload
    const payload: WebhookPayload = await request.json();
    
    console.log('📥 [Webhook] Recebido:', payload);

    // Processar webhook
    await DigitalSignatureService.processWebhook(payload);

    // Enviar notificações específicas baseadas no evento
    await handleWebhookNotifications(payload);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('❌ [Webhook] Erro ao processar:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Verifica a assinatura do webhook para segurança
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Implementar verificação de assinatura HMAC
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Erro ao verificar assinatura do webhook:', error);
    return false;
  }
}

/**
 * Processa notificações específicas baseadas no evento do webhook
 */
async function handleWebhookNotifications(payload: WebhookPayload): Promise<void> {
  try {
    switch (payload.event) {
      case 'document_signed':
        await handleDocumentSigned(payload);
        break;
      
      case 'document_cancelled':
        await handleDocumentCancelled(payload);
        break;
      
      case 'document_expired':
        await handleDocumentExpired(payload);
        break;
      
      default:
        console.log(`Evento não tratado: ${payload.event}`);
    }
  } catch (error) {
    console.error('Erro ao processar notificações do webhook:', error);
  }
}

/**
 * Processa evento de documento assinado
 */
async function handleDocumentSigned(payload: WebhookPayload): Promise<void> {
  try {
    // Buscar dados da solicitação de assinatura
    const signatureRequest = await DigitalSignatureService.getSignatureRequests();
    const request = signatureRequest.find(r => r.id === payload.signature_request_id);
    
    if (!request) {
      console.error('Solicitação de assinatura não encontrada:', payload.signature_request_id);
      return;
    }

    // Se há rental_id associado, buscar dados da locação
    if (request.rental_id) {
      // Aqui você buscaria os dados da locação do banco
      // const rental = await getRentalById(request.rental_id);
      
      // Enviar notificação de documento assinado
      const clientSigner = request.signers.find(s => s.role === 'client');
      if (clientSigner) {
        await EmailService.sendDocumentSignedNotification(
          clientSigner.email,
          clientSigner.name,
          {
            contract_number: request.rental_id,
            signed_at: payload.signed_at
          }
        );
      }
    }

    console.log('✅ [Webhook] Documento assinado processado:', payload.signature_request_id);
  } catch (error) {
    console.error('Erro ao processar documento assinado:', error);
  }
}

/**
 * Processa evento de documento cancelado
 */
async function handleDocumentCancelled(payload: WebhookPayload): Promise<void> {
  try {
    // Implementar lógica para documento cancelado
    // Por exemplo, notificar administradores, reverter status da locação, etc.
    
    console.log('⚠️ [Webhook] Documento cancelado:', payload.signature_request_id);
  } catch (error) {
    console.error('Erro ao processar documento cancelado:', error);
  }
}

/**
 * Processa evento de documento expirado
 */
async function handleDocumentExpired(payload: WebhookPayload): Promise<void> {
  try {
    // Implementar lógica para documento expirado
    // Por exemplo, notificar cliente e franqueado, criar nova solicitação, etc.
    
    console.log('⏰ [Webhook] Documento expirado:', payload.signature_request_id);
  } catch (error) {
    console.error('Erro ao processar documento expirado:', error);
  }
}

// Para uso em ambiente Express.js (alternativa ao Next.js)
export const expressWebhookHandler = async (req: any, res: any) => {
  try {
    const payload: WebhookPayload = req.body;
    
    console.log('📥 [Express Webhook] Recebido:', payload);

    await DigitalSignatureService.processWebhook(payload);
    await handleWebhookNotifications(payload);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [Express Webhook] Erro:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
