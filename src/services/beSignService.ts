/**
 * Serviço para integração com BeSign v2 API
 * Base URL: https://app-sign.efcaz.com.br/efcaz-clm/api
 * Documentação: API BeSign v2
 */

export interface BeSignDocument {
  identificador: string;
  nome: string;
  data_inicio_vigencia: string;
  data_fim_vigencia?: string;
  data_inicio_assinatura: string;
  data_fim_assinatura: string;
  status: 'PENDENTE' | 'ASSINADO' | 'CANCELADO' | 'EXPIRADO' | 'FORMALIZADO';
}

export interface BeSignSignatario {
  identificador?: string;
  dados_pessoais: {
    email: string;
    telefone?: string;
  };
  dados_assinatura: {
    tipo_assinatura: 'Eletronica' | 'Digital';
    tipo_documento: 'CPF' | 'RG' | 'CNH' | 'Outros';
    papel: 'Avalista' | 'Cedente' | 'Cessionário' | 'Contratada' | 'Contratante' | 'Devedor Solidário' | 'Emitente' | 'Endossante' | 'Endossatário' | 'Gestor' | 'Interveniente' | 'Parte' | 'Parte Compradora' | 'Parte Vendedora' | 'Procurador' | 'Representante Legal' | 'Responsável Solidário' | 'Testemunha' | 'Validador';
    opcional?: {
      modalidade_assinatura?: 'REMOTA';
    };
  };
  opcional?: {
    id_externo?: string;
    nome?: string;
    data_nascimento?: string;
    documento?: string;
  };
}

export interface BeSignPasta {
  identificador?: string;
  nome: string;
}

export interface BeSignWebhook {
  dataHoraNotificacao: string;
  documento: {
    identificador: string;
  };
  contato: {
    identificador: string;
    status: 'ASSINADO' | 'CANCELADO' | 'EXPIRADO';
  };
}

export interface CreateDocumentRequest {
  nome: string;
  data_inicio_vigencia: string;
  data_fim_vigencia?: string;
  data_inicio_assinatura: string;
  data_fim_assinatura: string;
  identificador_pasta: string;
  arquivos: Array<{
    nome: string;
    pdf_base64: string;
  }>;
  signatarios: BeSignSignatario[];
}

export interface SignDocumentRequest {
  nome: string;
  documento: string;
  data_nascimento: string;
  assinatura_manuscrita_base64?: string;
  'ip.signatario': string;
}

export class BeSignService {
  private static readonly BASE_URL = import.meta.env.VITE_BESIGN_API_URL || 'https://app-sign.efcaz.com.br/efcaz-clm/api';
  private static readonly API_KEY = import.meta.env.VITE_BESIGN_API_KEY || '';

  /**
   * Headers padrão para todas as requisições
   */
  private static getHeaders(): HeadersInit {
    return {
      'API-KEY': this.API_KEY,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Função auxiliar para fazer requisições HTTP
   */
  private static async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.BASE_URL}/public/v2${endpoint}`;
    
    console.log(`🚀 [BeSign] ${method} ${url}`);
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
      console.log('📤 [BeSign] Request body:', JSON.stringify(body, null, 2));
    }

    try {
      const response = await fetch(url, options);
      
      console.log(`📥 [BeSign] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [BeSign] API Error: ${errorText}`);
        throw new Error(`BeSign API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [BeSign] Success response:', result);
      return result;
    } catch (error) {
      console.error('❌ [BeSign] Request failed:', error);
      throw error;
    }
  }

  // ==================== DOCUMENTOS ====================

  /**
   * Inserir documento/contrato
   * POST /documentos
   */
  static async criarDocumento(documento: CreateDocumentRequest): Promise<BeSignDocument> {
    return this.makeRequest<BeSignDocument>('/documentos', 'POST', documento);
  }

  /**
   * Buscar documento único
   * GET /documentos/{identificador_documento}
   */
  static async buscarDocumento(identificadorDocumento: string): Promise<BeSignDocument> {
    return this.makeRequest<BeSignDocument>(`/documentos/${identificadorDocumento}`);
  }

  /**
   * Buscar todos documentos
   * GET /documentos?page=0&pageSize=400
   */
  static async buscarDocumentos(page = 0, pageSize = 400): Promise<{ content: BeSignDocument[]; totalElements: number }> {
    return this.makeRequest<{ content: BeSignDocument[]; totalElements: number }>(`/documentos?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Assinar documento
   * PUT /documentos/{identificador_documento}/assinar/signatario/{identificador_signatario}
   */
  static async assinarDocumento(
    identificadorDocumento: string,
    identificadorSignatario: string,
    dadosAssinatura: SignDocumentRequest
  ): Promise<any> {
    return this.makeRequest(
      `/documentos/${identificadorDocumento}/assinar/signatario/${identificadorSignatario}`,
      'PUT',
      dadosAssinatura
    );
  }

  /**
   * Formalizar documento
   * PUT /documentos/{identificador_documento}/versao/1/formalizar
   */
  static async formalizarDocumento(identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/documentos/${identificadorDocumento}/versao/1/formalizar`, 'PUT');
  }

  /**
   * Download documento (.zip)
   * GET /documentos/{identificador_documento}/versao/1/download
   */
  static async downloadDocumento(identificadorDocumento: string): Promise<Blob> {
    const url = `${this.BASE_URL}/public/v2/documentos/${identificadorDocumento}/versao/1/download`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro no download: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Download documento assinado (.pdf)
   * GET /documentos/{identificador_documento}/versao/1/download/assinado
   */
  static async downloadDocumentoAssinado(identificadorDocumento: string): Promise<Blob> {
    const url = `${this.BASE_URL}/public/v2/documentos/${identificadorDocumento}/versao/1/download/assinado`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro no download do documento assinado: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Download documento para impressão (.pdf)
   * GET /documentos/{identificador_documento}/versao/1/download/impressao
   */
  static async downloadDocumentoImpressao(identificadorDocumento: string): Promise<Blob> {
    const url = `${this.BASE_URL}/public/v2/documentos/${identificadorDocumento}/versao/1/download/impressao`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro no download do documento para impressão: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Arquivar documento
   * PATCH /documentos/{identificador_documento}/arquivar
   */
  static async arquivarDocumento(identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/documentos/${identificadorDocumento}/arquivar`, 'PATCH');
  }

  /**
   * Desarquivar documento
   * PATCH /documentos/{identificador_documento}/restaurar
   */
  static async desarquivarDocumento(identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/documentos/${identificadorDocumento}/restaurar`, 'PATCH');
  }

  /**
   * Cancelar documento
   * PUT /documentos/{identificador_documento}/cancelar
   */
  static async cancelarDocumento(identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/documentos/${identificadorDocumento}/cancelar`, 'PUT');
  }

  /**
   * Aditivar documento
   * PUT /documentos/{identificador_documento}/aditivar
   */
  static async aditivarDocumento(identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/documentos/${identificadorDocumento}/aditivar`, 'PUT');
  }

  /**
   * Remover documento
   * DELETE /documentos/{identificador_documento}/versao/1
   */
  static async removerDocumento(identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/documentos/${identificadorDocumento}/versao/1`, 'DELETE');
  }

  // ==================== SIGNATÁRIOS ====================

  /**
   * Buscar todos signatários de um documento
   * GET /signatarios/{identificador_documento}/versao/2?page=0&pageSize=400
   */
  static async buscarSignatarios(identificadorDocumento: string, page = 0, pageSize = 400): Promise<{ content: BeSignSignatario[]; totalElements: number }> {
    return this.makeRequest<{ content: BeSignSignatario[]; totalElements: number }>(`/signatarios/${identificadorDocumento}/versao/2?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Inserir signatário
   * POST /signatarios/{identificador_documento}
   */
  static async inserirSignatario(identificadorDocumento: string, signatarios: { signatarios: BeSignSignatario[] }): Promise<any> {
    return this.makeRequest(`/signatarios/${identificadorDocumento}`, 'POST', signatarios);
  }

  /**
   * Convidar signatário
   * PUT /signatarios/{identificador_signatario}/documento/{identificador_documento}/convidar
   */
  static async convidarSignatario(identificadorSignatario: string, identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/signatarios/${identificadorSignatario}/documento/${identificadorDocumento}/convidar`, 'PUT');
  }

  /**
   * Remover signatário
   * DELETE /signatarios/{identificador_signatario}/documento/{identificador_documento}
   */
  static async removerSignatario(identificadorSignatario: string, identificadorDocumento: string): Promise<any> {
    return this.makeRequest(`/signatarios/${identificadorSignatario}/documento/${identificadorDocumento}`, 'DELETE');
  }

  // ==================== PASTAS ====================

  /**
   * Buscar todas pastas
   * GET /pastas?page=0&pageSize=20
   */
  static async buscarPastas(page = 0, pageSize = 20): Promise<{ content: BeSignPasta[]; totalElements: number }> {
    return this.makeRequest<{ content: BeSignPasta[]; totalElements: number }>(`/pastas?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Inserir nova pasta
   * POST /pastas
   */
  static async criarPasta(pasta: { nome: string }): Promise<BeSignPasta> {
    return this.makeRequest<BeSignPasta>('/pastas', 'POST', pasta);
  }

  /**
   * Renomear pasta
   * PUT /pastas/{identificador_pasta}
   */
  static async renomearPasta(identificadorPasta: string, pasta: { nome: string }): Promise<BeSignPasta> {
    return this.makeRequest<BeSignPasta>(`/pastas/${identificadorPasta}`, 'PUT', pasta);
  }

  // ==================== USUÁRIOS ====================

  /**
   * Buscar todos usuários
   * GET /usuarios?page=0&pageSize=200
   */
  static async buscarUsuarios(page = 0, pageSize = 200): Promise<{ content: any[]; totalElements: number }> {
    return this.makeRequest<{ content: any[]; totalElements: number }>(`/usuarios?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Inserir novo usuário
   * POST /usuarios
   */
  static async criarUsuario(usuario: {
    nome_completo: string;
    email: string;
    cpf: string;
    senha: string;
    nivel_acesso: 'Gestor de Contratos' | 'Administrador da Organização';
  }): Promise<any> {
    return this.makeRequest('/usuarios', 'POST', usuario);
  }

  /**
   * Alterar nível de acesso do usuário
   * PUT /usuarios/{identificador_usuario}
   */
  static async alterarNivelAcesso(identificadorUsuario: string, nivelAcesso: {
    nivel_acesso: 'Gestor de Contratos' | 'Administrador da Organização';
  }): Promise<any> {
    return this.makeRequest(`/usuarios/${identificadorUsuario}`, 'PUT', nivelAcesso);
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Converte um arquivo para base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo data:application/pdf;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Converte um blob para base64
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo data:application/pdf;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Formata data para o padrão BeSign (DD-MM-AAAA)
   */
  static formatDateForBeSign(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}-${month}-${year}`;
  }

  /**
   * Converte data do formato BeSign (DD-MM-AAAA) para Date
   */
  static parseBeSignDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Processa webhook do BeSign
   */
  static async processWebhook(webhook: BeSignWebhook): Promise<void> {
    console.log('📥 [BeSign] Processando webhook:', webhook);
    
    // Aqui você pode implementar a lógica para processar os webhooks
    // Por exemplo: atualizar status no banco de dados, enviar notificações, etc.
    
    switch (webhook.contato.status) {
      case 'ASSINADO':
        console.log('✅ [BeSign] Documento assinado:', webhook.documento.identificador);
        // Implementar lógica para documento assinado
        break;
      case 'CANCELADO':
        console.log('❌ [BeSign] Documento cancelado:', webhook.documento.identificador);
        // Implementar lógica para documento cancelado
        break;
      case 'EXPIRADO':
        console.log('⏰ [BeSign] Documento expirado:', webhook.documento.identificador);
        // Implementar lógica para documento expirado
        break;
    }
  }
}