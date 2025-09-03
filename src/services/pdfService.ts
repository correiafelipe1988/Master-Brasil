import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ContractTemplateService,
  ContractTemplate,
  ContractClause,
  ContractVariableData,
  GeneratedContract
} from './contractTemplateService';

export interface ContractData {
  // Dados do Cliente
  client_name: string;
  client_cpf: string;
  client_email: string;
  client_phone: string;
  client_address?: string;

  // Dados da Motocicleta
  motorcycle_model: string;
  motorcycle_plate: string;
  motorcycle_year?: string;
  motorcycle_color?: string;

  // Dados do Franqueado
  franchisee_name: string;
  franchisee_cnpj: string;
  franchisee_address?: string;
  franchisee_phone?: string;

  // Dados da Locação
  plan_name: string;
  plan_price: number;
  start_date: string;
  end_date?: string;
  km_inicial: number;
  km_final?: number;
  deposit_value?: number;
  observations?: string;

  // Dados do Contrato
  contract_number: string;
  created_at: string;
}

export interface TemplateBasedContractData extends ContractVariableData {
  template_id?: string;
  clauses?: ContractClause[];
}

export class PDFService {
  private static addHeader(doc: jsPDF, title: string) {
    // Título principal centralizado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 20, { align: 'center' });

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    return 35; // Retorna a posição Y para continuar o conteúdo
  }

  private static addFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, pageHeight - 15, { align: 'center' });

    // Linha separadora
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 20, 190, pageHeight - 20);
  }

  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private static formatDate(dateString: string): string {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  }

  /**
   * Gera contrato baseado em template
   */
  static async generateTemplateBasedContract(
    templateId: string,
    contractData: ContractVariableData
  ): Promise<jsPDF> {
    try {
      // Buscar template e cláusulas
      const template = await ContractTemplateService.getTemplateById(templateId);
      if (!template) throw new Error('Template não encontrado');

      const clauses = await ContractTemplateService.getTemplateClauses(templateId);

      // Verificar se é um documento simples (como Anexo V)
      const isSimpleDocument = template.contract_type?.category === 'responsibility';

      // Gerar PDF
      const doc = new jsPDF();
      let yPosition = 20;

      if (isSimpleDocument) {
        // Layout específico para cada tipo de documento
        if (template.name.includes('Anexo IV')) {
          yPosition = this.addTariffDocumentLayout(doc, template, clauses, contractData, yPosition);
        } else {
          // Layout simples para outros documentos como Anexo V
          yPosition = this.addSimpleDocumentHeader(doc, template.title, yPosition);
          yPosition = this.addSimpleDocumentContent(doc, clauses, contractData, yPosition);
        }
      } else {
        // Layout completo para contratos
        yPosition = this.addHeader(doc, template.title);
        yPosition = this.addContractInfo(doc, contractData, yPosition);
        yPosition = this.addContractParties(doc, contractData, yPosition);
        yPosition = this.addContractClauses(doc, clauses, contractData, yPosition);
        this.addSignatures(doc, contractData);
        this.addFooter(doc);
      }

      return doc;
    } catch (error) {
      console.error('Erro ao gerar contrato baseado em template:', error);
      throw error;
    }
  }

  /**
   * Gera contrato a partir de um contrato já gerado
   */
  static async generateFromGeneratedContract(generatedContract: GeneratedContract): Promise<jsPDF> {
    if (!generatedContract.template_id) {
      throw new Error('Template ID não encontrado no contrato gerado');
    }

    return this.generateTemplateBasedContract(
      generatedContract.template_id,
      generatedContract.contract_data as ContractVariableData
    );
  }

  /**
   * Adiciona informações básicas do contrato
   */
  private static addContractInfo(doc: jsPDF, data: ContractVariableData, yPosition: number): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CONTRATO', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Número do Contrato: ${data.contract_number}`, 20, yPosition);
    doc.text(`Data: ${this.formatDate(data.contract_date)}`, 120, yPosition);
    yPosition += 15;

    return yPosition;
  }

  /**
   * Adiciona informações das partes (locador e locatário)
   */
  private static addContractParties(doc: jsPDF, data: ContractVariableData, yPosition: number): number {
    // Dados do Locador
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LOCADOR', 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${data.franchisee_name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`CNPJ: ${data.franchisee_cnpj}`, 20, yPosition);
    yPosition += 5;
    if (data.franchisee_address) {
      doc.text(`Endereço: ${data.franchisee_address}`, 20, yPosition);
      yPosition += 5;
    }
    yPosition += 10;

    // Dados do Locatário
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LOCATÁRIO', 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${data.client_name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`CPF: ${data.client_cpf}`, 20, yPosition);
    yPosition += 5;
    if (data.client_rg) {
      doc.text(`RG: ${data.client_rg}`, 20, yPosition);
      yPosition += 5;
    }
    if (data.client_address) {
      doc.text(`Endereço: ${data.client_address}`, 20, yPosition);
      yPosition += 5;
    }
    yPosition += 15;

    return yPosition;
  }

  /**
   * Adiciona cláusulas do contrato
   */
  private static addContractClauses(
    doc: jsPDF,
    clauses: ContractClause[],
    data: ContractVariableData,
    yPosition: number
  ): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULAS CONTRATUAIS', 20, yPosition);
    yPosition += 15;

    clauses.forEach((clause, index) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Título da cláusula
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`CLÁUSULA ${clause.clause_number}ª - ${clause.title}`, 20, yPosition);
      yPosition += 8;

      // Conteúdo da cláusula com substituição de variáveis
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const processedContent = ContractTemplateService.replaceVariables(clause.content, data);
      const splitContent = doc.splitTextToSize(processedContent, 170);

      doc.text(splitContent, 20, yPosition);
      yPosition += splitContent.length * 4 + 8;
    });

    return yPosition;
  }

  /**
   * Adiciona cabeçalho simples para documentos como Anexo V
   */
  private static addSimpleDocumentHeader(doc: jsPDF, title: string, yPosition: number): number {
    // Título centralizado
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.width;
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, yPosition);

    // Linha horizontal
    yPosition += 10;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    return yPosition + 15;
  }

  /**
   * Layout específico para Anexo IV - Tarifário
   */
  private static addTariffDocumentLayout(
    doc: jsPDF,
    template: ContractTemplate,
    clauses: ContractClause[],
    data: ContractVariableData,
    yPosition: number
  ): number {
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.width;
    const titleWidth = doc.getTextWidth(template.title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(template.title, titleX, yPosition);

    // Linha horizontal
    yPosition += 10;
    doc.setLineWidth(0.8);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const subtitle = 'DECLARAÇÃO DE CONHECIMENTO DOS VALORES CONTRATADOS';
    const subtitleWidth = doc.getTextWidth(subtitle);
    const subtitleX = (pageWidth - subtitleWidth) / 2;
    doc.text(subtitle, subtitleX, yPosition);
    yPosition += 20;

    // Dados do locatário
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const clientInfo = `Eu, ${data.client_name}, pessoa física, CPF nº ${data.client_cpf}, residente e domiciliado em ${data.client_address || '[Endereço]'}, ${data.client_city || 'Salvador'}, doravante mencionado como LOCATÁRIO do veículo modelo ${data.motorcycle_model} marca ${data.motorcycle_brand}, placa ${data.motorcycle_plate}, declaro expressamente ter sido informado a respeito dos valores de cada um dos itens abaixo:`;

    const clientInfoLines = doc.splitTextToSize(clientInfo, 170);
    doc.text(clientInfoLines, 20, yPosition);
    yPosition += clientInfoLines.length * 5 + 15;

    // Itens 1 e 2
    this.addTariffItem(doc, '1)', 'Combustível: O VEÍCULO poderá ser entregue com o tanque em qualquer nível de combustível (1/1, ½, ¼, etc). Na devolução, caso o veículo não seja devolvido nas mesmas condições com o mesmo nível da retirada, será cobrado o valor de R$ 7,50 por litro de combustível;', yPosition);
    yPosition += 20;

    this.addTariffItem(doc, '2)', 'Lavagem do Veículo: O VEÍCULO deve ser devolvido limpo. Caso seja devolvido sujo, será cobrada taxa de lavagem no valor de R$ 30,00;', yPosition);
    yPosition += 25;

    // Tabela de tarifário
    yPosition = this.addTariffTable(doc, yPosition);

    // Itens 3, 4 e 5
    yPosition += 15;
    this.addTariffItem(doc, '3)', 'Caso ocorra a devolução antecipada do VEÍCULO, seja por vontade do LOCATÁRIO ou caso ele tenha dado causa conforme previsões contratuais, será cobrada uma multa no percentual de 10% (dez por cento) do saldo residual, além de retenção integral da caução, sem prejuízo das medidas judicias cabíveis;', yPosition);
    yPosition += 25;

    this.addTariffItem(doc, '4)', 'Fica completamente vedada a realização de alterações estéticas no VEÍCULO alugado pelo LOCATÁRIO (retirada de adesivos originais da moto, plotagem), devendo o VEÍCULO ser entregue em seu estado estético original, sob pena de incidência de multa de R$ 5.000,00 em caso de descumprimento;', yPosition);
    yPosition += 25;

    this.addTariffItem(doc, '5)', 'Equipe para retomada do VEÍCULO: Em caso de bloqueio do VEÍCULO, por qualquer motivo, o LOCATÁRIO deverá arcar com uma taxa de R$ 250,00 para disponibilização de equipe para localização e restituição do VEÍCULO. Na hipótese de ser necessária a utilização de reboque/guincho, incidirão, também, as respectivas despesas.', yPosition);
    yPosition += 30;

    // Verificar se precisa de nova página para assinatura
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 30;
    }

    // Data e local
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`${data.contract_city || 'Salvador'}, ${data.contract_date || new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
    yPosition += 30;

    // Campo de assinatura
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('_________________________________________________', 20, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURA DO LOCATÁRIO', 20, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.client_name || '[Nome do Cliente]'}`, 20, yPosition);

    return yPosition;
  }

  /**
   * Adiciona conteúdo simples para documentos como Anexo V
   */
  private static addSimpleDocumentContent(
    doc: jsPDF,
    clauses: ContractClause[],
    data: ContractVariableData,
    yPosition: number
  ): number {
    clauses.forEach((clause) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Conteúdo da cláusula com substituição de variáveis
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      const processedContent = ContractTemplateService.replaceVariables(clause.content, data);
      const splitContent = doc.splitTextToSize(processedContent, 170);

      doc.text(splitContent, 20, yPosition);
      yPosition += splitContent.length * 5 + 15;
    });

    return yPosition;
  }

  /**
   * Adiciona seção de assinaturas
   */
  private static addSignatures(doc: jsPDF, data: ContractVariableData): void {
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = pageHeight - 80;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURAS', 20, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Linha para assinatura do locatário
    doc.text('_________________________________', 30, yPosition);
    doc.text('_________________________________', 130, yPosition);
    yPosition += 5;
    doc.text('Assinatura do Locatário', 30, yPosition);
    doc.text('Assinatura do Locador', 130, yPosition);
    yPosition += 5;
    doc.text(data.client_name, 30, yPosition);
    doc.text(data.franchisee_name, 130, yPosition);
  }

  static generateRentalContract(data: ContractData): jsPDF {
    const doc = new jsPDF();

    // Header
    let yPosition = this.addHeader(doc, 'CONTRATO DE LOCAÇÃO DE MOTOCICLETA');

    // Informações do Contrato
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CONTRATO', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Número do Contrato: ${data.contract_number}`, 20, yPosition);
    doc.text(`Data de Criação: ${this.formatDate(data.created_at)}`, 120, yPosition);
    yPosition += 15;
    
    // Dados do Cliente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO LOCATÁRIO', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${data.client_name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`CPF: ${data.client_cpf}`, 20, yPosition);
    doc.text(`Telefone: ${data.client_phone}`, 120, yPosition);
    yPosition += 5;
    doc.text(`E-mail: ${data.client_email}`, 20, yPosition);
    if (data.client_address) {
      yPosition += 5;
      doc.text(`Endereço: ${data.client_address}`, 20, yPosition);
    }
    yPosition += 15;
    
    // Dados do Franqueado
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO LOCADOR', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Empresa: ${data.franchisee_name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`CNPJ: ${data.franchisee_cnpj}`, 20, yPosition);
    if (data.franchisee_phone) {
      doc.text(`Telefone: ${data.franchisee_phone}`, 120, yPosition);
    }
    if (data.franchisee_address) {
      yPosition += 5;
      doc.text(`Endereço: ${data.franchisee_address}`, 20, yPosition);
    }
    yPosition += 15;
    
    // Dados da Motocicleta
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO VEÍCULO', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Modelo: ${data.motorcycle_model}`, 20, yPosition);
    doc.text(`Placa: ${data.motorcycle_plate}`, 120, yPosition);
    yPosition += 5;
    if (data.motorcycle_year) {
      doc.text(`Ano: ${data.motorcycle_year}`, 20, yPosition);
    }
    if (data.motorcycle_color) {
      doc.text(`Cor: ${data.motorcycle_color}`, 120, yPosition);
    }
    yPosition += 5;
    doc.text(`KM Inicial: ${data.km_inicial.toLocaleString('pt-BR')}`, 20, yPosition);
    yPosition += 15;
    
    // Dados da Locação
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DA LOCAÇÃO', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Plano: ${data.plan_name}`, 20, yPosition);
    doc.text(`Valor: ${this.formatCurrency(data.plan_price)}`, 120, yPosition);
    yPosition += 5;
    doc.text(`Data de Início: ${this.formatDate(data.start_date)}`, 20, yPosition);
    if (data.end_date) {
      doc.text(`Data de Fim: ${this.formatDate(data.end_date)}`, 120, yPosition);
    }
    yPosition += 5;
    if (data.deposit_value) {
      doc.text(`Valor do Depósito: ${this.formatCurrency(data.deposit_value)}`, 20, yPosition);
      yPosition += 5;
    }
    
    if (data.observations) {
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      
      // Quebrar texto longo em múltiplas linhas
      const splitText = doc.splitTextToSize(data.observations, 170);
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 5;
    }
    
    // Termos e Condições
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMOS E CONDIÇÕES', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const terms = [
      '1. O locatário se compromete a utilizar o veículo de forma responsável e dentro das normas de trânsito.',
      '2. Qualquer dano ao veículo será de responsabilidade do locatário.',
      '3. O veículo deve ser devolvido nas mesmas condições em que foi entregue.',
      '4. O pagamento deve ser efetuado conforme acordado no plano selecionado.',
      '5. Em caso de atraso na devolução, será cobrada taxa adicional.',
      '6. O locatário deve possuir CNH válida durante todo o período de locação.',
      '7. É proibido o uso do veículo para atividades ilegais.',
      '8. O locador não se responsabiliza por objetos deixados no veículo.'
    ];
    
    terms.forEach(term => {
      const splitTerm = doc.splitTextToSize(term, 170);
      doc.text(splitTerm, 20, yPosition);
      yPosition += splitTerm.length * 4 + 2;
    });
    
    // Assinaturas
    yPosition += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text('_________________________________', 30, yPosition);
    doc.text('_________________________________', 130, yPosition);
    yPosition += 5;
    doc.text('Assinatura do Locatário', 30, yPosition);
    doc.text('Assinatura do Locador', 130, yPosition);
    yPosition += 5;
    doc.text(data.client_name, 30, yPosition);
    doc.text(data.franchisee_name, 130, yPosition);
    
    // Footer
    this.addFooter(doc);
    
    return doc;
  }

  static generateRentalReceipt(data: ContractData): jsPDF {
    const doc = new jsPDF();
    
    // Header
    let yPosition = this.addHeader(doc, 'RECIBO DE LOCAÇÃO');
    
    // Informações do Recibo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`RECIBO Nº ${data.contract_number}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Recebi de ${data.client_name}, CPF ${data.client_cpf},`, 20, yPosition);
    yPosition += 8;
    doc.text(`a quantia de ${this.formatCurrency(data.plan_price)} (${this.numberToWords(data.plan_price)}),`, 20, yPosition);
    yPosition += 8;
    doc.text(`referente à locação da motocicleta ${data.motorcycle_model}, placa ${data.motorcycle_plate},`, 20, yPosition);
    yPosition += 8;
    doc.text(`conforme plano ${data.plan_name}, com início em ${this.formatDate(data.start_date)}.`, 20, yPosition);
    
    yPosition += 20;
    
    // Detalhes
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHES DA LOCAÇÃO:', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`• Veículo: ${data.motorcycle_model} - ${data.motorcycle_plate}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Plano: ${data.plan_name}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Valor: ${this.formatCurrency(data.plan_price)}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Data de Início: ${this.formatDate(data.start_date)}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• KM Inicial: ${data.km_inicial.toLocaleString('pt-BR')}`, 25, yPosition);
    
    if (data.deposit_value) {
      yPosition += 6;
      doc.text(`• Depósito: ${this.formatCurrency(data.deposit_value)}`, 25, yPosition);
    }
    
    // Data e Local
    yPosition += 30;
    doc.text(`Local e Data: _________________, ${this.formatDate(new Date().toISOString())}`, 20, yPosition);
    
    // Assinatura
    yPosition += 30;
    doc.text('_________________________________', 105, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(data.franchisee_name, 105, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text('Assinatura do Responsável', 105, yPosition, { align: 'center' });
    
    // Footer
    this.addFooter(doc);
    
    return doc;
  }

  private static numberToWords(value: number): string {
    // Implementação simplificada - em produção, usar biblioteca específica
    const integerPart = Math.floor(value);
    const decimalPart = Math.round((value - integerPart) * 100);

    if (decimalPart === 0) {
      return `${integerPart} reais`;
    } else {
      return `${integerPart} reais e ${decimalPart} centavos`;
    }
  }

  /**
   * Adiciona item do tarifário com formatação
   */
  private static addTariffItem(doc: jsPDF, number: string, text: string, yPosition: number): void {
    doc.setFont('helvetica', 'bold');
    doc.text(number, 20, yPosition);

    doc.setFont('helvetica', 'normal');
    const itemText = doc.splitTextToSize(text, 160);
    doc.text(itemText, 30, yPosition);
  }

  /**
   * Adiciona tabela de tarifário
   */
  private static addTariffTable(doc: jsPDF, yPosition: number): number {
    const pageWidth = doc.internal.pageSize.width;
    const tableWidth = 170;
    const startX = 20;

    // Título da tabela
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TARIFÁRIO LOCAGORA', startX, yPosition);
    yPosition += 10;

    // Cabeçalho da tabela
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(startX, yPosition, tableWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('SERVIÇO', startX + 2, yPosition + 6);
    doc.text('VALOR', startX + 120, yPosition + 6);
    yPosition += 8;

    // Itens da tabela
    const tariffItems = [
      { service: 'Bloqueio por inadimplência', value: 'R$ 700,00 por ocorrência' },
      { service: 'Substituição de chave ou miolo', value: 'R$ 150,00 por ocorrência' },
      { service: 'Participação furto, roubo e acidente de veículo', value: 'A partir de R$ 500,00 por ocorrência' },
      { service: 'Valor da franquia do veículo', value: 'R$ 700,00 por ocorrência' },
      { service: 'Manutenção sem agendamento', value: 'R$ 50,00 por ocorrência' },
      { service: 'Mau uso ou conduta', value: 'R$ 300,00 por ocorrência' },
      { service: 'Não comparecimento da convocação da LOCAGORA', value: 'R$ 50,00 por ocorrência' },
      { service: 'Não comparecimento à manutenção preventiva', value: 'R$ 20,00 por ocorrência' },
      { service: 'Valor da franquia do veículo', value: 'R$ 200,00 por ocorrência' },
      { service: 'Diária aluguel motocicleta (plano mensal - limite 5 mil Km)', value: 'A partir de R$ 500,00' },
      { service: 'Diária aluguel motocicleta (plano anual - limite 5 mil Km)', value: 'A partir de R$ 35,90 por moto' },
      { service: 'Downgrade', value: 'R$ 0,39/Km' },
      { service: 'Devolução antecipada', value: 'R$ 1.000,00 por contrato' },
    ];

    doc.setFont('helvetica', 'normal');
    tariffItems.forEach((item, index) => {
      // Alternar cor de fundo
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(startX, yPosition, tableWidth, 8, 'F');
      }

      const serviceText = doc.splitTextToSize(item.service, 115);
      const valueText = doc.splitTextToSize(item.value, 45);

      doc.text(serviceText, startX + 2, yPosition + 6);
      doc.text(valueText, startX + 120, yPosition + 6);

      yPosition += Math.max(serviceText.length * 4, valueText.length * 4, 8);
    });

    // Borda da tabela
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(startX, yPosition - (tariffItems.length * 8) - 8, tableWidth, (tariffItems.length * 8) + 8);

    return yPosition;
  }
}
