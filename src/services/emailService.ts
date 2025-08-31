
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
}

export interface EmailData {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html_content?: string;
  text_content?: string;
  attachments?: EmailAttachment[];
  template_id?: string;
  template_variables?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  type: string;
  disposition?: 'attachment' | 'inline';
}

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at?: string;
  error_message?: string;
  rental_id?: string;
  signature_request_id?: string;
}

export class EmailService {
  private static readonly API_KEY = import.meta.env.VITE_EMAIL_API_KEY || '';
  private static readonly FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@masterbrasil.com';
  private static readonly FROM_NAME = import.meta.env.VITE_FROM_NAME || 'Master Brasil';

  /**
   * Envia email usando Resend (ou outro provedor)
   */
  static async sendEmail(emailData: EmailData): Promise<{ id: string; success: boolean }> {
    try {
      // Se usar template, processar variáveis
      let finalHtmlContent = emailData.html_content;
      let finalTextContent = emailData.text_content;
      let finalSubject = emailData.subject;

      if (emailData.template_id && emailData.template_variables) {
        const template = await this.getTemplate(emailData.template_id);
        if (template) {
          finalHtmlContent = this.processTemplate(template.html_content, emailData.template_variables);
          finalTextContent = this.processTemplate(template.text_content, emailData.template_variables);
          finalSubject = this.processTemplate(template.subject, emailData.template_variables);
        }
      }

      // Preparar dados para o provedor de email
      const emailPayload = {
        from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
        to: [emailData.to],
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        subject: finalSubject,
        html: finalHtmlContent,
        text: finalTextContent,
        attachments: emailData.attachments || []
      };

      // Enviar via Resend (ou outro provedor)
      const response = await this.sendViaProvider(emailPayload);

      // Mock log do email
      console.log('📧 [EmailService] Mock email log:', {
        to_email: emailData.to,
        subject: finalSubject,
        status: response.success ? 'sent' : 'failed',
        sent_at: response.success ? new Date().toISOString() : undefined,
        error_message: response.success ? undefined : response.error
      });

      return response;

    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      
      // Mock log do erro
      console.log('❌ [EmailService] Mock email error log:', {
        to_email: emailData.to,
        subject: emailData.subject,
        status: 'failed',
        error_message: error.message
      });

      return { id: '', success: false };
    }
  }

  /**
   * Envia email via provedor (Resend, SendGrid, etc.)
   */
  private static async sendViaProvider(emailPayload: any): Promise<{ id: string; success: boolean; error?: string }> {
    try {
      // Implementação para Resend
      if (import.meta.env.VITE_EMAIL_PROVIDER === 'resend') {
        return await this.sendViaResend(emailPayload);
      }

      // Implementação para SendGrid
      if (import.meta.env.VITE_EMAIL_PROVIDER === 'sendgrid') {
        return await this.sendViaSendGrid(emailPayload);
      }

      // Mock para desenvolvimento
      console.log('📧 [EmailService] Mock - Email enviado:', emailPayload);
      return {
        id: `mock_${Date.now()}`,
        success: true
      };

    } catch (error: any) {
      return {
        id: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envio via Resend
   */
  private static async sendViaResend(emailPayload: any): Promise<{ id: string; success: boolean; error?: string }> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      success: true
    };
  }

  /**
   * Envio via SendGrid
   */
  private static async sendViaSendGrid(emailPayload: any): Promise<{ id: string; success: boolean; error?: string }> {
    const sgPayload = {
      personalizations: [{
        to: emailPayload.to.map((email: string) => ({ email })),
        cc: emailPayload.cc?.map((email: string) => ({ email })) || [],
        bcc: emailPayload.bcc?.map((email: string) => ({ email })) || [],
        subject: emailPayload.subject
      }],
      from: { email: this.FROM_EMAIL, name: this.FROM_NAME },
      content: [
        { type: 'text/plain', value: emailPayload.text },
        { type: 'text/html', value: emailPayload.html }
      ],
      attachments: emailPayload.attachments
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sgPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    return {
      id: response.headers.get('x-message-id') || `sg_${Date.now()}`,
      success: true
    };
  }

  /**
   * Processa template substituindo variáveis
   */
  private static processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    });

    return processed;
  }

  /**
   * Busca template por ID
   */
  private static async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      // Mock template - usar templates padrão
      const defaultTemplates = this.getDefaultTemplates();
      const template = defaultTemplates[templateId];

      if (template) {
        console.log('📧 [EmailService] Mock template found:', templateId);
        return template;
      }

      console.log('❌ [EmailService] Mock template not found:', templateId);
      return null;

    } catch (error) {
      console.error('Erro ao buscar template:', error);
      return null;
    }
  }


  /**
   * Templates pré-definidos para o sistema
   */
  static getDefaultTemplates(): Record<string, EmailTemplate> {
    return {
      'rental_created': {
        id: 'rental_created',
        name: 'Locação Criada',
        subject: 'Confirmação de Locação - {{contract_number}}',
        html_content: `
          <h2>Olá {{client_name}},</h2>
          <p>Sua locação foi criada com sucesso!</p>
          
          <h3>Detalhes da Locação:</h3>
          <ul>
            <li><strong>Contrato:</strong> {{contract_number}}</li>
            <li><strong>Veículo:</strong> {{motorcycle_model}} - {{motorcycle_plate}}</li>
            <li><strong>Período:</strong> {{start_date}} até {{end_date}}</li>
            <li><strong>Valor Total:</strong> R$ {{total_amount}}</li>
          </ul>
          
          <p>Em breve você receberá o contrato para assinatura eletrônica.</p>
          
          <p>Atenciosamente,<br>Equipe Master Brasil</p>
        `,
        text_content: `
          Olá {{client_name}},
          
          Sua locação foi criada com sucesso!
          
          Detalhes da Locação:
          - Contrato: {{contract_number}}
          - Veículo: {{motorcycle_model}} - {{motorcycle_plate}}
          - Período: {{start_date}} até {{end_date}}
          - Valor Total: R$ {{total_amount}}
          
          Em breve você receberá o contrato para assinatura eletrônica.
          
          Atenciosamente,
          Equipe Master Brasil
        `,
        variables: ['client_name', 'contract_number', 'motorcycle_model', 'motorcycle_plate', 'start_date', 'end_date', 'total_amount']
      },

      'signature_requested': {
        id: 'signature_requested',
        name: 'Solicitação de Assinatura',
        subject: 'Assinatura Eletrônica - Contrato {{contract_number}}',
        html_content: `
          <h2>Olá {{signer_name}},</h2>
          <p>Você tem um documento aguardando sua assinatura eletrônica.</p>
          
          <h3>Detalhes do Documento:</h3>
          <ul>
            <li><strong>Documento:</strong> {{document_name}}</li>
            <li><strong>Contrato:</strong> {{contract_number}}</li>
            <li><strong>Cliente:</strong> {{client_name}}</li>
          </ul>
          
          <p><a href="{{signing_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Assinar Documento</a></p>
          
          <p><strong>Importante:</strong> Este link expira em 7 dias.</p>
          
          <p>Atenciosamente,<br>Equipe Master Brasil</p>
        `,
        text_content: `
          Olá {{signer_name}},
          
          Você tem um documento aguardando sua assinatura eletrônica.
          
          Detalhes do Documento:
          - Documento: {{document_name}}
          - Contrato: {{contract_number}}
          - Cliente: {{client_name}}
          
          Link para assinatura: {{signing_url}}
          
          Importante: Este link expira em 7 dias.
          
          Atenciosamente,
          Equipe Master Brasil
        `,
        variables: ['signer_name', 'document_name', 'contract_number', 'client_name', 'signing_url']
      },

      'document_signed': {
        id: 'document_signed',
        name: 'Documento Assinado',
        subject: 'Contrato Assinado - {{contract_number}}',
        html_content: `
          <h2>Olá {{client_name}},</h2>
          <p>Seu contrato foi assinado com sucesso por todas as partes!</p>
          
          <h3>Detalhes:</h3>
          <ul>
            <li><strong>Contrato:</strong> {{contract_number}}</li>
            <li><strong>Data de Assinatura:</strong> {{signed_at}}</li>
            <li><strong>Status:</strong> Ativo</li>
          </ul>
          
          <p>Sua locação está agora oficialmente ativa. Você pode retirar o veículo conforme combinado.</p>
          
          <p>Atenciosamente,<br>Equipe Master Brasil</p>
        `,
        text_content: `
          Olá {{client_name}},
          
          Seu contrato foi assinado com sucesso por todas as partes!
          
          Detalhes:
          - Contrato: {{contract_number}}
          - Data de Assinatura: {{signed_at}}
          - Status: Ativo
          
          Sua locação está agora oficialmente ativa. Você pode retirar o veículo conforme combinado.
          
          Atenciosamente,
          Equipe Master Brasil
        `,
        variables: ['client_name', 'contract_number', 'signed_at']
      }
    };
  }

  /**
   * Envia notificação de locação criada
   */
  static async sendRentalCreatedNotification(rentalData: any): Promise<void> {
    const template = this.getDefaultTemplates()['rental_created'];
    
    await this.sendEmail({
      to: rentalData.client_email,
      template_id: 'rental_created',
      template_variables: {
        client_name: rentalData.client_name,
        contract_number: rentalData.id,
        motorcycle_model: rentalData.motorcycle_model,
        motorcycle_plate: rentalData.motorcycle_plate,
        start_date: new Date(rentalData.start_date).toLocaleDateString('pt-BR'),
        end_date: new Date(rentalData.end_date).toLocaleDateString('pt-BR'),
        total_amount: rentalData.total_amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      },
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content
    });
  }

  /**
   * Envia notificação de solicitação de assinatura
   */
  static async sendSignatureRequestNotification(signerEmail: string, signerName: string, documentData: any): Promise<void> {
    const template = this.getDefaultTemplates()['signature_requested'];
    
    await this.sendEmail({
      to: signerEmail,
      template_id: 'signature_requested',
      template_variables: {
        signer_name: signerName,
        document_name: documentData.document_name,
        contract_number: documentData.contract_number,
        client_name: documentData.client_name,
        signing_url: documentData.signing_url || '#'
      },
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content
    });
  }

  /**
   * Envia notificação de documento assinado
   */
  static async sendDocumentSignedNotification(clientEmail: string, clientName: string, contractData: any): Promise<void> {
    const template = this.getDefaultTemplates()['document_signed'];
    
    await this.sendEmail({
      to: clientEmail,
      template_id: 'document_signed',
      template_variables: {
        client_name: clientName,
        contract_number: contractData.contract_number,
        signed_at: new Date().toLocaleDateString('pt-BR')
      },
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content
    });
  }
}
