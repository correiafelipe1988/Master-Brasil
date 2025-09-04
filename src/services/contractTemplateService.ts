import { supabase } from '@/lib/supabase';

// Interfaces para o sistema de templates
export interface ContractType {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  contract_type_id: string;
  name: string;
  version: string;
  title: string;
  content: Record<string, any>;
  variables: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  contract_type?: ContractType;
}

export interface ContractClause {
  id: string;
  template_id: string;
  clause_number: string;
  title: string;
  content: string;
  order_index: number;
  is_required: boolean;
  variables: string[];
  created_at: string;
}

export interface GeneratedContract {
  id: string;
  template_id: string;
  rental_id?: string;
  contract_number: string;
  contract_data: Record<string, any>;
  pdf_url?: string;
  status: 'draft' | 'generated' | 'sent' | 'signed' | 'cancelled';
  signature_request_id?: string;
  signed_at?: string;
  expires_at?: string;
  city_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  template?: ContractTemplate;
}

export interface ContractVariableData {
  // Dados do Franqueado
  franchisee_name: string;
  franchisee_cnpj: string;
  franchisee_address?: string;
  franchisee_phone?: string;
  
  // Dados do Cliente
  client_name: string;
  client_cpf: string;
  client_rg?: string;
  client_address?: string;
  client_phone?: string;
  client_email?: string;
  client_cnh?: string;
  client_cnh_category?: string;
  client_cnh_expiry?: string;
  
  // Dados da Motocicleta
  motorcycle_model: string;
  motorcycle_plate: string;
  motorcycle_year?: string;
  motorcycle_color?: string;
  motorcycle_chassi?: string;
  motorcycle_renavam?: string;
  
  // Dados da Locação
  start_date: string;
  end_date?: string;
  daily_rate: number;
  total_amount: number;
  deposit_value?: number;
  plan_name: string;
  km_inicial?: number;
  km_final?: number;
  observations?: string;
  
  // Dados do Contrato
  contract_number: string;
  contract_date: string;
  
  // Valores por extenso (gerados automaticamente)
  daily_rate_written?: string;
  total_amount_written?: string;
  deposit_value_written?: string;
}

export class ContractTemplateService {
  
  /**
   * Busca todos os tipos de contratos ativos
   */
  static async getContractTypes(): Promise<ContractType[]> {
    try {
      const { data, error } = await supabase
        .from('contract_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar tipos de contratos:', error);
      throw error;
    }
  }

  /**
   * Busca templates por tipo de contrato
   */
  static async getTemplatesByType(contractTypeId: string): Promise<ContractTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select(`
          *,
          contract_type:contract_types(*)
        `)
        .eq('contract_type_id', contractTypeId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      throw error;
    }
  }

  /**
   * Busca template padrão por categoria
   */
  static async getDefaultTemplate(category: string): Promise<ContractTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select(`
          *,
          contract_type:contract_types(*)
        `)
        .eq('is_active', true)
        .eq('is_default', true)
        .eq('contract_type.category', category)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar template padrão:', error);
      return null;
    }
  }

  /**
   * Busca template por nome específico
   */
  static async getTemplateByName(templateName: string): Promise<ContractTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select(`
          *,
          contract_type:contract_types(*)
        `)
        .eq('name', templateName)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar template por nome:', error);
      return null;
    }
  }

  /**
   * Busca cláusulas de um template
   */
  static async getTemplateClauses(templateId: string): Promise<ContractClause[]> {
    try {
      const { data, error } = await supabase
        .from('contract_clauses')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar cláusulas:', error);
      throw error;
    }
  }

  /**
   * Gera um novo contrato baseado em template
   */
  static async generateContract(
    templateId: string,
    contractData: ContractVariableData,
    cityId: string,
    rentalId?: string
  ): Promise<GeneratedContract> {
    try {
      // Verificar se já existe um contrato para este template e rental
      if (rentalId) {
        const { data: existingContract, error: checkError } = await supabase
          .from('generated_contracts')
          .select(`
            *,
            template:contract_templates(*)
          `)
          .eq('template_id', templateId)
          .eq('rental_id', rentalId)
          .single();

        if (existingContract && !checkError) {
          const templateName = existingContract.template?.name || 'Contrato';
          throw new Error(`${templateName} já foi gerado para esta locação. Número: ${existingContract.contract_number}`);
        }
      }

      // Buscar template e cláusulas
      const template = await this.getTemplateById(templateId);
      if (!template) throw new Error('Template não encontrado');

      const clauses = await this.getTemplateClauses(templateId);

      // Gerar número do contrato
      const contractNumber = await this.generateContractNumber();

      // Processar dados do contrato
      const processedData = this.processContractData(contractData);

      // Criar registro do contrato gerado
      const { data, error } = await supabase
        .from('generated_contracts')
        .insert({
          template_id: templateId,
          rental_id: rentalId,
          contract_number: contractNumber,
          contract_data: processedData,
          status: 'draft',
          city_id: cityId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
        })
        .select(`
          *,
          template:contract_templates(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      throw error;
    }
  }

  /**
   * Busca template por ID
   */
  static async getTemplateById(templateId: string): Promise<ContractTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select(`
          *,
          contract_type:contract_types(*)
        `)
        .eq('id', templateId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      return null;
    }
  }

  /**
   * Gera número único do contrato
   */
  private static async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    return `CONT-${year}-${timestamp}`;
  }

  /**
   * Processa dados do contrato, incluindo valores por extenso
   */
  private static processContractData(data: ContractVariableData): ContractVariableData {
    return {
      ...data,
      daily_rate_written: this.numberToWords(data.daily_rate),
      total_amount_written: this.numberToWords(data.total_amount),
      deposit_value_written: data.deposit_value ? this.numberToWords(data.deposit_value) : undefined
    };
  }

  /**
   * Converte número para extenso (implementação básica)
   */
  private static numberToWords(value: number): string {
    // Implementação básica - pode ser expandida com biblioteca específica
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    
    return formatter.format(value).replace('R$', '').trim();
  }

  /**
   * Substitui variáveis no texto
   */
  static replaceVariables(text: string, data: Record<string, any>): string {
    let result = text;
    
    Object.keys(data).forEach(key => {
      const value = data[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });
    
    return result;
  }

  /**
   * Verifica se já existe um contrato gerado para um template e rental específicos
   */
  static async checkExistingContract(
    templateId: string,
    rentalId: string
  ): Promise<GeneratedContract | null> {
    try {
      const { data, error } = await supabase
        .from('generated_contracts')
        .select(`
          *,
          template:contract_templates(*)
        `)
        .eq('template_id', templateId)
        .eq('rental_id', rentalId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Erro ao verificar contrato existente:', error);
      return null;
    }
  }

  /**
   * Busca anexos gerados por rental_id e template name
   */
  static async getGeneratedAnnexes(
    rentalId: string,
    templateName: string
  ): Promise<GeneratedContract[]> {
    try {
      const { data, error } = await supabase
        .from('generated_contracts')
        .select(`
          *,
          template:contract_templates(*)
        `)
        .eq('rental_id', rentalId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar por nome exato do template (evitar mistura entre Anexo V, VI, VII)
      const filtered = (data || []).filter(contract => {
        const templateNameLower = contract.template?.name?.toLowerCase();
        const searchNameLower = templateName.toLowerCase();
        
        // Verificar correspondência exata ou que comece com o nome procurado seguido de espaço/hífen
        return templateNameLower === searchNameLower ||
               templateNameLower?.startsWith(`${searchNameLower} -`) ||
               (searchNameLower === 'anexo v' && templateNameLower === 'anexo v - termo de responsabilidade civil') ||
               (searchNameLower === 'anexo vi' && templateNameLower === 'anexo vi - recebimento de caução') ||
               (searchNameLower === 'anexo vii' && templateNameLower === 'anexo vii - declaração de conhecimento de monitoramento do veículo') ||
               (searchNameLower === 'anexo iii' && templateNameLower === 'anexo iii - procuração') ||
               (searchNameLower === 'contrato principal de locação' && templateNameLower === 'contrato principal de locação') ||
               (searchNameLower === 'contrato principal' && templateNameLower === 'contrato principal de locação') ||
               (searchNameLower === 'contrato principal de locação - silvio roberto' && templateNameLower?.startsWith('contrato principal de locação - silvio roberto'));
      });

      return filtered;
    } catch (error) {
      console.error('Erro ao buscar anexos gerados:', error);
      return []; // Retornar array vazio em caso de erro
    }
  }

  /**
   * Busca contratos gerados por cidade
   */
  static async getGeneratedContracts(cityId?: string): Promise<GeneratedContract[]> {
    try {
      let query = supabase
        .from('generated_contracts')
        .select(`
          *,
          template:contract_templates(*)
        `)
        .order('created_at', { ascending: false });

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contratos gerados:', error);
      throw error;
    }
  }

  /**
   * Atualiza status do contrato
   */
  static async updateContractStatus(
    contractId: string,
    status: GeneratedContract['status'],
    additionalData?: Partial<GeneratedContract>
  ): Promise<void> {
    try {
      const updateData = {
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('generated_contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status do contrato:', error);
      throw error;
    }
  }

  /**
   * Exclui um contrato gerado
   */
  static async deleteContract(contractId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      throw error;
    }
  }

  /**
   * Cria um novo template de contrato
   */
  static async createTemplate(templateData: {
    contract_type_id: string;
    name: string;
    version: string;
    title: string;
    content: Record<string, any>;
    variables: string[];
    is_active?: boolean;
    is_default?: boolean;
  }): Promise<ContractTemplate> {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          contract_type_id: templateData.contract_type_id,
          name: templateData.name,
          version: templateData.version,
          title: templateData.title,
          content: templateData.content,
          variables: templateData.variables,
          is_active: templateData.is_active ?? true,
          is_default: templateData.is_default ?? false
        })
        .select(`
          *,
          contract_type:contract_types(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar template:', error);
      throw error;
    }
  }

  /**
   * Cria uma cláusula para um template
   */
  static async createClause(clauseData: {
    template_id: string;
    clause_number: string;
    title: string;
    content: string;
    order_index: number;
    is_required?: boolean;
    variables: string[];
  }): Promise<ContractClause> {
    try {
      const { data, error } = await supabase
        .from('contract_clauses')
        .insert({
          template_id: clauseData.template_id,
          clause_number: clauseData.clause_number,
          title: clauseData.title,
          content: clauseData.content,
          order_index: clauseData.order_index,
          is_required: clauseData.is_required ?? true,
          variables: clauseData.variables
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar cláusula:', error);
      throw error;
    }
  }
}
