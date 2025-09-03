import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Send } from 'lucide-react';
import { PDFService } from '../../services/pdfService';
import { ContractTemplateService } from '../../services/contractTemplateService';
import { toast } from 'sonner';

interface TariffData {
  client_name: string;
  client_cpf: string;
  client_address: string;
  client_neighborhood: string;
  client_city: string;
  client_state: string;
  client_number: string;
  client_cep: string;
  motorcycle_model: string;
  motorcycle_brand: string;
  motorcycle_plate: string;
  contract_city: string;
  contract_date: string;
}

interface TariffGeneratorProps {
  tariffData: TariffData;
  cityId: string;
  rentalId?: string;
  onTariffGenerated?: (tariffUrl: string) => void;
}

export const TariffGenerator: React.FC<TariffGeneratorProps> = ({
  tariffData,
  cityId,
  rentalId,
  onTariffGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [existingTariff, setExistingTariff] = useState<any>(null);
  const [allTariffs, setAllTariffs] = useState<any[]>([]);

  useEffect(() => {
    if (rentalId) {
      checkExistingTariff();
      loadAllTariffs();
    }
  }, [rentalId]);

  const checkExistingTariff = async () => {
    if (rentalId) {
      try {
        // ID fixo do template Anexo IV
        const templateId = '1578a031-ff12-4a61-9905-0f5040653df9';
        const existing = await ContractTemplateService.checkExistingContract(
          templateId,
          rentalId
        );
        setExistingTariff(existing);
      } catch (error) {
        console.error('Erro ao verificar tarifário existente:', error);
      }
    }
  };

  const loadAllTariffs = async () => {
    if (rentalId) {
      try {
        const tariffs = await ContractTemplateService.getGeneratedAnnexes(
          rentalId,
          'Anexo IV'
        );
        setAllTariffs(tariffs || []);
      } catch (error) {
        console.error('Erro ao carregar tarifários:', error);
        setAllTariffs([]); // Fallback para array vazio
      }
    }
  };

  const generateTariff = async () => {
    // Verificar se já existe uma tarifa para esta locação
    if (existingTariff) {
      toast.error('Já existe um Anexo IV (Tarifário) para esta locação.');
      return;
    }

    try {
      setIsGenerating(true);

      // Buscar template do Anexo IV pelo ID específico
      const tariffTemplate = await ContractTemplateService.getTemplateById('1578a031-ff12-4a61-9905-0f5040653df9');

      if (!tariffTemplate) {
        throw new Error('Template do Anexo IV não encontrado');
      }

      // Preparar dados para o contrato
      const contractData = {
        contract_number: `TARIFF-${Date.now()}`,
        contract_date: new Date().toLocaleDateString('pt-BR'),
        contract_city: tariffData.contract_city || 'Salvador',

        // Dados do cliente
        client_name: tariffData.client_name,
        client_cpf: tariffData.client_cpf,
        client_address: tariffData.client_address,
        client_neighborhood: tariffData.client_neighborhood,
        client_city: tariffData.client_city,
        client_state: tariffData.client_state,
        client_number: tariffData.client_number,
        client_cep: tariffData.client_cep,

        // Dados da motocicleta
        motorcycle_model: tariffData.motorcycle_model,
        motorcycle_brand: tariffData.motorcycle_brand,
        motorcycle_plate: tariffData.motorcycle_plate,

        // Dados da franquia (placeholder)
        franchisee_name: 'LOCAGORA',
        franchisee_cnpj: '',
        franchisee_address: '',
        franchisee_city: tariffData.contract_city || 'Salvador',
        franchisee_state: 'BA'
      };

      // Gerar contrato no banco de dados
      const generatedContract = await ContractTemplateService.generateContract(
        tariffTemplate.id,
        contractData,
        cityId,
        rentalId
      );

      // Gerar PDF
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        tariffTemplate.id,
        contractData
      );

      // Simular upload do PDF
      const pdfBlob = pdfDoc.output('blob');
      const fileName = `anexo_iv_${generatedContract.contract_number}.pdf`;

      // Mock upload
      console.log('📄 [TariffGenerator] Mock upload:', fileName);
      const mockUrl = `https://mock-storage.com/tariffs/${fileName}`;

      // Atualizar contrato com URL do PDF
      await ContractTemplateService.updateContractStatus(
        generatedContract.id,
        'generated',
        { pdf_url: mockUrl }
      );

      // Criar URL para visualização
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);

      // Callback opcional
      if (onTariffGenerated) {
        onTariffGenerated(mockUrl);
      }

      toast.success('Anexo IV - Tarifário gerado com sucesso!');
      setIsDialogOpen(false);

    } catch (error) {
      console.error('Erro ao gerar Anexo IV:', error);
      toast.error('Erro ao gerar Anexo IV. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (generatedPdfUrl) {
      const link = document.createElement('a');
      link.href = generatedPdfUrl;
      link.download = `Anexo_IV_Tarifario_${tariffData.client_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      link.click();
    }
  };

  const viewPdf = () => {
    if (generatedPdfUrl) {
      window.open(generatedPdfUrl, '_blank');
    }
  };

  const sendForSignature = async () => {
    try {
      // Implementar lógica de envio para assinatura
      toast.success('Anexo IV enviado para assinatura digital!');
    } catch (error) {
      console.error('Erro ao enviar para assinatura:', error);
      toast.error('Não foi possível enviar para assinatura.');
    }
  };

  const deleteTariff = async () => {
    if (!existingTariff) return;

    try {
      await ContractTemplateService.deleteContract(existingTariff.id);

      toast.success('Anexo IV excluído com sucesso!');

      // Recarregar dados
      setExistingTariff(null);
      loadAllTariffs();
    } catch (error) {
      console.error('Erro ao excluir tarifário:', error);
      toast.error('Não foi possível excluir o tarifário.');
    }
  };

  const deleteTariffFromList = async (tariffId: string) => {
    try {
      await ContractTemplateService.deleteContract(tariffId);

      toast.success('Anexo IV excluído com sucesso!');

      // Recarregar dados
      loadAllTariffs();
      checkExistingTariff();
    } catch (error) {
      console.error('Erro ao excluir tarifário:', error);
      toast.error('Não foi possível excluir o tarifário.');
    }
  };

  const previewTariffDocument = async (tariff: any) => {
    try {
      // Buscar template do Anexo IV
      const tariffTemplate = await ContractTemplateService.getTemplateById('1578a031-ff12-4a61-9905-0f5040653df9');

      if (!tariffTemplate) {
        throw new Error('Template do Anexo IV não encontrado');
      }

      // Preparar dados do contrato usando os dados salvos
      const contractData = tariff.contract_data || {
        contract_number: tariff.contract_number,
        contract_date: new Date().toLocaleDateString('pt-BR'),
        contract_city: tariffData.contract_city || 'Salvador',
        client_name: tariffData.client_name,
        client_cpf: tariffData.client_cpf,
        client_address: tariffData.client_address,
        client_neighborhood: tariffData.client_neighborhood,
        client_city: tariffData.client_city,
        client_state: tariffData.client_state,
        client_number: tariffData.client_number,
        client_cep: tariffData.client_cep,
        motorcycle_model: tariffData.motorcycle_model,
        motorcycle_brand: tariffData.motorcycle_brand,
        motorcycle_plate: tariffData.motorcycle_plate,
      };

      // Gerar PDF
      const doc = await PDFService.generateTemplateBasedContract(
        tariffTemplate.id,
        contractData
      );

      // Abrir PDF em nova aba
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.success('PDF do Anexo IV aberto em nova aba!');
    } catch (error) {
      console.error('Erro ao visualizar tarifário:', error);
      toast.error('Não foi possível visualizar o tarifário.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Anexo IV - Tarifário LOCAGORA</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Anexo IV
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Anexo IV</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Anexo IV - Tarifário LOCAGORA</CardTitle>
                  <CardDescription>
                    Declaração de Conhecimento dos Valores Contratados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Cliente:</span> {tariffData.client_name}
                      </div>
                      <div>
                        <span className="font-medium">CPF:</span> {tariffData.client_cpf}
                      </div>
                      <div>
                        <span className="font-medium">Motocicleta:</span> {tariffData.motorcycle_brand} {tariffData.motorcycle_model}
                      </div>
                      <div>
                        <span className="font-medium">Placa:</span> {tariffData.motorcycle_plate}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {existingTariff ? (
                  <div className="flex gap-2 w-full">
                    <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Anexo IV já existe:</strong> {existingTariff.contract_number}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Criado em {new Date(existingTariff.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      onClick={deleteTariff}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={generateTariff}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Anexo IV'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Anexos IV gerados */}
      {allTariffs.length > 0 && (
        <div className="space-y-3">
          {allTariffs.map((tariff) => (
            <Card key={tariff.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{tariff.contract_number}</h4>
                      <Badge variant="default">Gerado</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {tariff.template?.name} - Criado em {new Date(tariff.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewTariffDocument(tariff)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadPdf}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sendForSignature}
                    >
                      <Send className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTariffFromList(tariff.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


    </div>
  );
};
