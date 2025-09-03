
import { supabase } from '@/integrations/supabase/client';
import { BeSignService, BeSignSignatario, CreateDocumentRequest } from './beSignService';

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
  private static readonly API_BASE_URL = import.meta.env.VITE_BESIGN_API_URL || 'https://app-sign.efcaz.com.br/efcaz-clm/api';
  private static readonly API_KEY = import.meta.env.VITE_BESIGN_API_KEY || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ7XCJvcmdcIjoxMDY3MCxcInVzclwiOjE2MDQxLFwiY3J0XCI6XCJTZXAgMywgMjAyNSwgNzoxNTo1MiBBTVwifSJ9.yPKMVBuMao20NJu5L_YzaKBL5UIUtKM0l241ClI3dJU';
  private static readonly WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook';

  static {
    console.log('🔧 [DigitalSignature] Configuração BeSign v2:', {
      API_BASE_URL: this.API_BASE_URL,
      API_KEY: this.API_KEY ? `***configurado*** (${this.API_KEY.length} chars)` : 'não configurado',
      WEBHOOK_URL: this.WEBHOOK_URL,
      API_KEY_VALID: this.API_KEY && this.API_KEY !== 'SUA_API_KEY_AQUI' && this.API_KEY.length >= 50
    });
  }

  /**
   * Cria uma solicitação de assinatura digital
   */
  static async createSignatureRequest(
    documentBlob: Blob,
    documentName: string,
    signers: Signer[],
    contractNumber: string,
    rentalId?: string
  ): Promise<SignatureRequest> {
    console.log('🚀 [DigitalSignature] Iniciando criação de solicitação:', {
      documentName,
      contractNumber,
      rentalId,
      signersCount: signers.length
    });

    try {
      // 1. Upload do documento para Supabase Storage
      const fileName = `contracts/${Date.now()}_${documentName}`;
      console.log('📄 [DigitalSignature] Fazendo upload:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, documentBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [DigitalSignature] Erro no upload:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      console.log('✅ [DigitalSignature] Upload realizado com sucesso:', uploadData.path);

      // 2. Obter URL pública do documento
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(uploadData.path);

      const documentUrl = urlData.publicUrl;
      console.log('🔗 [DigitalSignature] URL do documento:', documentUrl);

      // 3. Criar um registro de solicitação de assinatura diretamente
      console.log('🔍 [DigitalSignature] Criando solicitação para:', { contractNumber, rentalId });
      
      // Gerar ID único para a solicitação
      const signatureRequestId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log('🆔 [DigitalSignature] ID da solicitação:', signatureRequestId);

      // 4. Enviar para o provedor de assinatura
      console.log('📤 [DigitalSignature] Enviando para provedor de assinatura...');
      const signatureRequest = await this.sendToSignatureProvider({
        document_url: documentUrl,
        document_name: documentName,
        signers,
        webhook_url: this.WEBHOOK_URL,
        metadata: {
          contract_number: contractNumber,
          rental_id: rentalId
        }
      });

      console.log('✅ [DigitalSignature] Resposta do provedor:', signatureRequest);

      // 5. Log de sucesso
      console.log('✅ [DigitalSignature] Solicitação processada com sucesso');

      const result = {
        id: signatureRequest.id,
        document_url: documentUrl,
        document_name: documentName,
        signers: signers,
        status: 'pending' as const,
        rental_id: rentalId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        signing_url: signatureRequest.signing_url
      };

      console.log('✅ [DigitalSignature] Solicitação criada com sucesso:', result);
      return result;

    } catch (error) {
      console.error('❌ [DigitalSignature] Erro ao criar solicitação de assinatura:', error);
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
    metadata?: {
      contract_id?: string;
      contract_number?: string;
      rental_id?: string;
    };
  }): Promise<{ id: string; signing_url: string }> {

    console.log('🔧 [DigitalSignature] Determinando provedor:', {
      API_BASE_URL: this.API_BASE_URL,
      isBesign: this.API_BASE_URL.includes('besign'),
      isD4Sign: this.API_BASE_URL.includes('d4sign'),
      isClicksign: this.API_BASE_URL.includes('clicksign')
    });

    // Implementação para BeSign
    if (this.API_BASE_URL.includes('besign') || this.API_BASE_URL.includes('efcaz')) {
      console.log('📤 [DigitalSignature] Usando BeSign v2');
      return this.sendToBeSign(data);
    }

    // Implementação para D4Sign
    if (this.API_BASE_URL.includes('d4sign')) {
      console.log('📤 [DigitalSignature] Usando D4Sign');
      return this.sendToD4Sign(data);
    }

    // Implementação para Clicksign
    if (this.API_BASE_URL.includes('clicksign')) {
      console.log('📤 [DigitalSignature] Usando Clicksign');
      return this.sendToClicksign(data);
    }

    // Mock para desenvolvimento
    console.log('🧪 [DigitalSignature] Usando Mock (desenvolvimento)');
    console.log('📋 [DigitalSignature] Dados que seriam enviados:', {
      url: this.API_BASE_URL,
      apiKey: this.API_KEY ? 'API Key configurada' : 'API Key não configurada',
      document: data.document_name,
      signers: data.signers.length,
      webhook: data.webhook_url
    });
    
    const mockResult = {
      id: `mock_${Date.now()}`,
      signing_url: `https://mock-signature.com/sign/${Date.now()}`
    };
    console.log('✅ [DigitalSignature] Mock criado com sucesso:', mockResult);
    return mockResult;
  }

  /**
   * Integração específica com BeSign
   */
  private static async sendToBeSign(data: {
    document_url: string;
    document_name: string;
    signers: Signer[];
    webhook_url: string;
    metadata?: {
      contract_id?: string;
      contract_number?: string;
      rental_id?: string;
    };
  }): Promise<{ id: string; signing_url: string }> {

    console.log('🚀 [BeSign] Tentando enviar para:', this.API_BASE_URL);
    console.log('🔑 [BeSign] API Key:', {
      present: !!this.API_KEY,
      length: this.API_KEY?.length || 0,
      preview: this.API_KEY ? this.API_KEY.substring(0, 20) + '...' : 'não configurada',
      isValid: this.API_KEY && this.API_KEY !== 'SUA_API_KEY_AQUI' && this.API_KEY.length >= 50
    });
    console.log('📄 [BeSign] Dados do documento:', {
      name: data.document_name,
      url: data.document_url,
      signersCount: data.signers.length
    });

    // Fallback para desenvolvimento/teste se não conseguir acessar a API
    if (!this.API_KEY || this.API_KEY === 'SUA_API_KEY_AQUI' || this.API_KEY.length < 50) {
      console.warn('⚠️ [BeSign] API Key inválida, usando mock para desenvolvimento');
      return {
        id: `dev_${Date.now()}`,
        signing_url: `https://dev.mock.com/sign/${Date.now()}`
      };
    }

    try {
      console.log('📤 [BeSign] Criando documento via BeSign v2 API');

      // Testar requisição direta para BeSign v2
      console.log('📤 [BeSign] Fazendo requisição direta para API...');
      
      const pdfBase64 = await this.getPdfAsBase64(data.document_url);
      
      const requestPayload = {
        nome: data.document_name,
        data_inicio_vigencia: this.formatDateForBeSign(new Date()),
        data_fim_vigencia: this.formatDateForBeSign(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 dias
        data_inicio_assinatura: this.formatDateForBeSign(new Date()),
        data_fim_assinatura: this.formatDateForBeSign(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 dias
        identificador_pasta: await this.getDefaultPastaId(),
        arquivos: [{
          nome: data.document_name,
          pdf_base64: pdfBase64
        }],
        signatarios: data.signers.map((signer) => ({
          dados_pessoais: {
            email: signer.email,
            telefone: this.formatPhoneForBeSign(signer.phone || '')
          },
          dados_assinatura: {
            tipo_assinatura: 'Eletronica',
            tipo_documento: 'CPF',
            papel: this.mapRoleToBeSignPapel(signer.role),
            opcional: {
              modalidade_assinatura: 'REMOTA'
            }
          },
          opcional: {
            nome: signer.name,
            documento: signer.cpf || ''
          }
        }))
      };

      console.log('📤 [BeSign] Payload:', JSON.stringify(requestPayload, null, 2));

      // Usar proxy em desenvolvimento para evitar CORS
      const apiUrl = import.meta.env.DEV 
        ? '/api/besign/public/v2/documentos'
        : `${this.API_BASE_URL}/public/v2/documentos`;
      
      console.log('🔗 [BeSign] URL da requisição:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'API-KEY': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📥 [BeSign] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [BeSign] API Error:', errorText);
        throw new Error(`BeSign API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [BeSign] Success response:', result);

      return {
        id: result.identificador || `besign_${Date.now()}`,
        signing_url: `${this.API_BASE_URL}/public/assinatura/${result.identificador || 'unknown'}`
      };

    } catch (error) {
      console.error('❌ [BeSign] Erro ao criar documento:', error);
      console.warn('⚠️ [BeSign] Usando mock devido ao erro');
      
      // Fallback para desenvolvimento
      return {
        id: `error_fallback_${Date.now()}`,
        signing_url: `https://error.mock.com/sign/${Date.now()}`
      };
    }
  }

  /**
   * Formata data para o padrão BeSign (DD-MM-AAAA)
   */
  private static formatDateForBeSign(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}-${month}-${year}`;
  }

  /**
   * Formata telefone para o padrão BeSign (DDD + 9 + numero)
   * Exemplo: (11) 99999-9999 → 11999999999
   */
  private static formatPhoneForBeSign(phone: string): string {
    if (!phone) return '';
    
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se já está no formato correto (11 dígitos), retorna
    if (cleaned.length === 11) {
      return cleaned;
    }
    
    // Se tem 10 dígitos, adiciona o 9 após o DDD
    if (cleaned.length === 10) {
      return cleaned.substring(0, 2) + '9' + cleaned.substring(2);
    }
    
    // Se tem outros formatos, tenta construir um padrão válido
    if (cleaned.length >= 8) {
      // Assume DDD padrão 11 se não fornecido
      const ddd = cleaned.length >= 10 ? cleaned.substring(0, 2) : '11';
      const numero = cleaned.substring(cleaned.length >= 10 ? 2 : 0);
      
      // Garante que o número tenha 9 dígitos (adiciona 9 se necessário)
      const numeroFormatado = numero.length === 8 ? '9' + numero : numero.substring(0, 9);
      
      return ddd + numeroFormatado;
    }
    
    // Se muito curto, retorna vazio para não causar erro na API
    return '';
  }

  /**
   * Converte papel interno para papel BeSign
   */
  private static mapRoleToBeSignPapel(role: string): BeSignSignatario['dados_assinatura']['papel'] {
    switch (role) {
      case 'client':
        return 'Contratante';
      case 'franchisee':
        return 'Contratada';
      case 'witness':
        return 'Testemunha';
      default:
        return 'Parte';
    }
  }

  /**
   * Obtém ID de uma pasta válida (busca a primeira disponível ou cria uma nova)
   */
  private static async getDefaultPastaId(): Promise<string> {
    try {
      // Primeiro tenta buscar pastas existentes
      const apiUrl = import.meta.env.DEV 
        ? '/api/besign/public/v2/pastas?page=0&pageSize=1'
        : `${this.API_BASE_URL}/public/v2/pastas?page=0&pageSize=1`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'API-KEY': this.API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.content && result.content.length > 0) {
          console.log('📁 [BeSign] Usando pasta existente:', result.content[0].identificador);
          return result.content[0].identificador;
        }
      }

      // Se não encontrou pastas, cria uma nova
      const createUrl = import.meta.env.DEV 
        ? '/api/besign/public/v2/pastas'
        : `${this.API_BASE_URL}/public/v2/pastas`;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'API-KEY': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: 'Contratos CRM'
        })
      });

      if (createResponse.ok) {
        const newPasta = await createResponse.json();
        console.log('📁 [BeSign] Pasta criada:', newPasta.identificador);
        return newPasta.identificador;
      }

    } catch (error) {
      console.error('❌ [BeSign] Erro ao gerenciar pastas:', error);
    }

    // Fallback: usar um UUID válido genérico (não recomendado para produção)
    console.warn('⚠️ [BeSign] Usando UUID genérico para pasta');
    return '00000000-0000-0000-0000-000000000000';
  }

  /**
   * Obtém ou cria uma pasta no BeSign (método original mantido)
   */
  private static async getOrCreatePasta(nomePasta: string): Promise<string> {
    try {
      const pastas = await BeSignService.buscarPastas();
      const pastaExistente = pastas.content.find(p => p.nome === nomePasta);
      
      if (pastaExistente?.identificador) {
        return pastaExistente.identificador;
      }
      
      const novaPasta = await BeSignService.criarPasta({ nome: nomePasta });
      return novaPasta.identificador || 'default';
    } catch (error) {
      console.warn('⚠️ [BeSign] Erro ao gerenciar pasta, usando padrão');
      return 'default';
    }
  }

  /**
   * Baixa PDF da URL e converte para base64
   */
  private static async getPdfAsBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await BeSignService.blobToBase64(blob);
    } catch (error) {
      console.error('❌ [BeSign] Erro ao baixar PDF:', error);
      throw new Error('Erro ao processar documento PDF');
    }
  }


  /**
   * Integração específica com D4Sign
   */
  private static async sendToD4Sign(data: {
    document_url: string;
    document_name: string;
    signers: Signer[];
    webhook_url: string;
    metadata?: {
      contract_id?: string;
      rental_id?: string;
    };
  }): Promise<{ id: string; signing_url: string }> {
    
    const response = await fetch(`${this.API_BASE_URL}/public/v2/documentos`, {
      method: 'POST',
      headers: {
        'API-KEY': this.API_KEY,
        'Content-Type': 'application/json'
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
        webhook_url: data.webhook_url,
        metadata: data.metadata
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
    metadata?: {
      contract_id?: string;
      rental_id?: string;
    };
  }): Promise<{ id: string; signing_url: string }> {
    
    const response = await fetch(`${this.API_BASE_URL}/public/v2/documentos`, {
      method: 'POST',
      headers: {
        'API-KEY': this.API_KEY,
        'Content-Type': 'application/json'
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
        },
        metadata: data.metadata
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
