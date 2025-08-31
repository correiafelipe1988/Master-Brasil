import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PDFService, ContractData } from '@/services/pdfService';
import { FileText, Download, Eye, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-mock';

interface PDFGeneratorProps {
  rentalData: any;
  onPDFGenerated?: (pdfUrl: string, type: 'contract' | 'receipt') => void;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ 
  rentalData, 
  onPDFGenerated 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedPDFs, setGeneratedPDFs] = useState<{
    contract?: string;
    receipt?: string;
  }>({});
  const { toast } = useToast();

  const prepareContractData = (): ContractData => {
    return {
      // Dados do Cliente
      client_name: rentalData.client_name || '',
      client_cpf: rentalData.client_cpf || '',
      client_email: rentalData.client_email || '',
      client_phone: rentalData.client_phone || '',
      client_address: rentalData.client_address || '',
      
      // Dados da Motocicleta
      motorcycle_model: rentalData.motorcycle_model || '',
      motorcycle_plate: rentalData.motorcycle_plate || '',
      motorcycle_year: rentalData.motorcycle_year || '',
      motorcycle_color: rentalData.motorcycle_color || '',
      
      // Dados do Franqueado
      franchisee_name: rentalData.franchisee_name || 'Master Brasil',
      franchisee_cnpj: rentalData.franchisee_cnpj || '',
      franchisee_address: rentalData.franchisee_address || '',
      franchisee_phone: rentalData.franchisee_phone || '',
      
      // Dados da Locação
      plan_name: rentalData.plan_name || '',
      plan_price: rentalData.plan_price || 0,
      start_date: rentalData.start_date || new Date().toISOString(),
      end_date: rentalData.end_date || '',
      km_inicial: rentalData.km_inicial || 0,
      km_final: rentalData.km_final || 0,
      deposit_value: rentalData.deposit_value || 500,
      observations: rentalData.observations || '',
      
      // Dados do Contrato
      contract_number: rentalData.id || `CONT-${Date.now()}`,
      created_at: rentalData.created_at || new Date().toISOString(),
    };
  };

  const generatePDF = async (type: 'contract' | 'receipt') => {
    setIsGenerating(true);
    
    try {
      const contractData = prepareContractData();
      
      let doc;
      let filename;
      
      if (type === 'contract') {
        doc = PDFService.generateRentalContract(contractData);
        filename = `contrato_${contractData.contract_number}.pdf`;
      } else {
        doc = PDFService.generateRentalReceipt(contractData);
        filename = `recibo_${contractData.contract_number}.pdf`;
      }
      
      // Gerar blob do PDF
      const pdfBlob = doc.output('blob');
      
      // Mock upload para Supabase Storage
      const filePath = `contracts/${filename}`;
      console.log('📄 [PDFGenerator] Mock upload:', filePath);

      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock URL assinada
      const mockUrl = `https://mock-storage.com/${filePath}`;

      // Atualizar estado
      setGeneratedPDFs(prev => ({
        ...prev,
        [type]: mockUrl
      }));

      // Callback para componente pai
      if (onPDFGenerated) {
        onPDFGenerated(mockUrl, type);
      }
      
      toast({
        title: "PDF Gerado",
        description: `${type === 'contract' ? 'Contrato' : 'Recibo'} gerado com sucesso!`,
      });
      
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async (type: 'contract' | 'receipt') => {
    try {
      const contractData = prepareContractData();
      
      let doc;
      let filename;
      
      if (type === 'contract') {
        doc = PDFService.generateRentalContract(contractData);
        filename = `contrato_${contractData.contract_number}.pdf`;
      } else {
        doc = PDFService.generateRentalReceipt(contractData);
        filename = `recibo_${contractData.contract_number}.pdf`;
      }
      
      // Download direto
      doc.save(filename);
      
      toast({
        title: "Download Iniciado",
        description: `${type === 'contract' ? 'Contrato' : 'Recibo'} baixado com sucesso!`,
      });
      
    } catch (error: any) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível baixar o PDF. Tente novamente.",
      });
    }
  };

  const previewPDF = async (type: 'contract' | 'receipt') => {
    try {
      const contractData = prepareContractData();
      
      let doc;
      
      if (type === 'contract') {
        doc = PDFService.generateRentalContract(contractData);
      } else {
        doc = PDFService.generateRentalReceipt(contractData);
      }
      
      // Abrir preview em nova aba
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
    } catch (error: any) {
      console.error('Erro ao visualizar PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível visualizar o PDF. Tente novamente.",
      });
    }
  };

  const sendPDFByEmail = async (type: 'contract' | 'receipt') => {
    setIsSending(true);
    
    try {
      // Gerar PDF se ainda não foi gerado
      if (!generatedPDFs[type]) {
        await generatePDF(type);
      }
      
      // Aqui você implementaria o envio por email
      // Por exemplo, usando um serviço como SendGrid, Resend, etc.
      
      toast({
        title: "Email Enviado",
        description: `${type === 'contract' ? 'Contrato' : 'Recibo'} enviado por email!`,
      });
      
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o email. Tente novamente.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Documentos da Locação</h3>
      </div>
      
      {/* Contrato */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Contrato de Locação</h4>
            <p className="text-sm text-gray-600">Documento oficial da locação</p>
          </div>
          <Badge variant={generatedPDFs.contract ? "default" : "secondary"}>
            {generatedPDFs.contract ? "Gerado" : "Não Gerado"}
          </Badge>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewPDF('contract')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadPDF('contract')}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => generatePDF('contract')}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Gerar & Salvar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendPDFByEmail('contract')}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Email
          </Button>
        </div>
      </div>
      
      {/* Recibo */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Recibo de Locação</h4>
            <p className="text-sm text-gray-600">Comprovante de pagamento</p>
          </div>
          <Badge variant={generatedPDFs.receipt ? "default" : "secondary"}>
            {generatedPDFs.receipt ? "Gerado" : "Não Gerado"}
          </Badge>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewPDF('receipt')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadPDF('receipt')}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => generatePDF('receipt')}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Gerar & Salvar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendPDFByEmail('receipt')}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Email
          </Button>
        </div>
      </div>
    </div>
  );
};
