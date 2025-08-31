import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export class PDFService {
  private static addHeader(doc: jsPDF, title: string) {
    // Logo/Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('VISIUM - SISTEMA DE LOCAÇÃO', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 105, 30, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    return 45; // Retorna a posição Y para continuar o conteúdo
  }

  private static addFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento foi gerado automaticamente pelo sistema Visium', 105, pageHeight - 20, { align: 'center' });
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, pageHeight - 15, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 25, 190, pageHeight - 25);
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
}
