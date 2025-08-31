
export interface SignatureRequest {
  id: string;
  document_url: string;
  document_name: string;
  signers: Signer[];
  status: 'pending' | 'signed' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
  rental_id?: string;
}

export interface Signer {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: 'client' | 'franchisee' | 'witness';
  signed_at?: string;
  ip_address?: string;
}

export interface WebhookPayload {
  event: 'document_signed' | 'document_cancelled' | 'document_expired';
  signature_request_id: string;
  signer_email: string;
  signed_at?: string;
  document_url?: string;
}

export class DigitalSignatureService {
  private static readonly API_BASE_URL = import.meta.env.VITE_SIGNATURE_API_URL || 'https://api.d4sign.com.br/v1';
  private static readonly API_TOKEN = import.meta.env.VITE_SIGNATURE_API_TOKEN || '';
  private static readonly WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://your-app.vercel.app/api/webhooks/signature';

  /**
   * Cria uma solicitação de assinatura digital
   */
  static async createSignatureRequest(
    _documentBlob: Blob,
    documentName: string,
    signers: Signer[],
    rentalId?: string
  ): Promise<SignatureRequest> {
    try {
      // 1. Mock upload do documento (em produção, usar Supabase Storage)
      const fileName = `contracts/${Date.now()}_${documentName}`;
      console.log('📄 [DigitalSignature] Mock upload:', fileName);

      // 2. Mock URL do documento
      const mockUrl = `https://mock-storage.com/${fileName}`;
      console.log('🔗 [DigitalSignature] Mock URL:', mockUrl);

      // 3. Mock solicitação no serviço de assinatura
      const signatureRequest = await this.sendToSignatureProvider({
        document_url: mockUrl,
        document_name: documentName,
        signers,
        webhook_url: this.WEBHOOK_URL
      });

      // 4. Mock salvamento no banco de dados
      const mockData = {
        id: signatureRequest.id,
        document_url: mockUrl,
        document_name: documentName,
        signers: signers,
        status: 'pending' as const,
        rental_id: rentalId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      console.log('💾 [DigitalSignature] Mock save:', mockData);

      return mockData;

    } catch (error) {
      console.error('Erro ao criar solicitação de assinatura:', error);
      throw error;
    }
  }

  /**
   * Envia documento para o provedor de assinatura (D4Sign/Clicksign)
   */
  private static async sendToSignatureProvider(data: {
    document_url: string;
    document_name: string;
    signers: Signer[];
    webhook_url: string;
  }): Promise<{ id: string; signing_url: string }> {
    
    // Implementação para D4Sign
    if (this.API_BASE_URL.includes('d4sign')) {
      return this.sendToD4Sign(data);
    }
    
    // Implementação para Clicksign
    if (this.API_BASE_URL.includes('clicksign')) {
      return this.sendToClicksign(data);
    }

    // Mock para desenvolvimento
    return {
      id: `mock_${Date.now()}`,
      signing_url: `https://mock-signature.com/sign/${Date.now()}`
    };
  }

  /**
   * Integração específica com D4Sign
   */
  private static async sendToD4Sign(data: {
    document_url: string;
    document_name: string;
    signers: Signer[];
    webhook_url: string;
  }): Promise<{ id: string; signing_url: string }> {
    
    const response = await fetch(`${this.API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_TOKEN}`
      },
      body: JSON.stringify({
        name: data.document_name,
        url: data.document_url,
        signers: data.signers.map(signer => ({
          name: signer.name,
          email: signer.email,
          cpf: signer.cpf,
          phone: signer.phone
        })),
        webhook_url: data.webhook_url
      })
    });

    if (!response.ok) {
      throw new Error(`D4Sign API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.uuid,
      signing_url: result.signing_url
    };
  }

  /**
   * Integração específica com Clicksign
   */
  private static async sendToClicksign(data: {
    document_url: string;
    document_name: string;
    signers: Signer[];
    webhook_url: string;
  }): Promise<{ id: string; signing_url: string }> {
    
    const response = await fetch(`${this.API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_TOKEN}`
      },
      body: JSON.stringify({
        document: {
          name: data.document_name,
          content: data.document_url,
          content_type: 'url'
        },
        signers: data.signers.map(signer => ({
          name: signer.name,
          email: signer.email,
          documentation: signer.cpf,
          phone_number: signer.phone
        })),
        webhook: {
          url: data.webhook_url
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Clicksign API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.document.key,
      signing_url: result.document.download_url
    };
  }

  /**
   * Processa webhook de status de assinatura
   */
  static async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      // Mock atualização no banco de dados
      console.log('📥 [DigitalSignature] Mock webhook processing:', {
        event: payload.event,
        signature_request_id: payload.signature_request_id,
        status: this.mapWebhookEventToStatus(payload.event)
      });

      // Se documento foi assinado, atualizar status da locação
      if (payload.event === 'document_signed') {
        await this.updateRentalStatus(payload.signature_request_id);
      }

      // Enviar notificação por email
      await this.sendNotification(payload);

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Mapeia eventos do webhook para status interno
   */
  private static mapWebhookEventToStatus(event: string): 'pending' | 'signed' | 'cancelled' | 'expired' {
    switch (event) {
      case 'document_signed':
        return 'signed';
      case 'document_cancelled':
        return 'cancelled';
      case 'document_expired':
        return 'expired';
      default:
        return 'pending';
    }
  }

  /**
   * Atualiza status da locação quando documento é assinado
   */
  private static async updateRentalStatus(signatureRequestId: string): Promise<void> {
    try {
      // Mock busca da solicitação de assinatura
      console.log('🔍 [DigitalSignature] Mock rental status update:', signatureRequestId);

      // Mock atualização do status da locação
      console.log('✅ [DigitalSignature] Mock rental activated');

    } catch (error) {
      console.error('Erro ao atualizar status da locação:', error);
    }
  }

  /**
   * Envia notificação por email
   */
  private static async sendNotification(payload: WebhookPayload): Promise<void> {
    try {
      // Implementar integração com serviço de email (SendGrid, Resend, etc.)
      console.log('Enviando notificação:', payload);
      
      // Aqui você implementaria a integração com seu provedor de email
      // Exemplo com fetch para um endpoint de email:
      /*
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.signer_email,
          subject: this.getEmailSubject(payload.event),
          template: this.getEmailTemplate(payload.event),
          data: payload
        })
      });
      */

    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  /**
   * Obtém lista de solicitações de assinatura
   */
  static async getSignatureRequests(rentalId?: string): Promise<SignatureRequest[]> {
    try {
      // Mock data para demonstração
      const mockRequests: SignatureRequest[] = [
        {
          id: 'mock_request_1',
          document_url: 'https://mock-storage.com/contract_1.pdf',
          document_name: 'Contrato de Locação - João Silva',
          signers: [
            {
              name: 'João Silva',
              email: 'joao@email.com',
              cpf: '123.456.789-00',
              phone: '(11) 99999-9999',
              role: 'client'
            },
            {
              name: 'Master Brasil',
              email: 'contrato@masterbrasil.com',
              cpf: '',
              phone: '',
              role: 'franchisee'
            }
          ],
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          rental_id: rentalId
        }
      ];

      console.log('📋 [DigitalSignature] Mock signature requests:', mockRequests);
      return rentalId ? mockRequests.filter(r => r.rental_id === rentalId) : mockRequests;

    } catch (error) {
      console.error('Erro ao buscar solicitações de assinatura:', error);
      return [];
    }
  }

  /**
   * Cancela uma solicitação de assinatura
   */
  static async cancelSignatureRequest(signatureRequestId: string): Promise<void> {
    try {
      // Mock cancelamento no provedor de assinatura
      console.log('❌ [DigitalSignature] Mock cancel request:', signatureRequestId);

      // Mock atualização do status local
      console.log('📝 [DigitalSignature] Mock status updated to cancelled');

    } catch (error) {
      console.error('Erro ao cancelar solicitação de assinatura:', error);
      throw error;
    }
  }
}
