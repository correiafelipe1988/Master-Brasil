import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ContractTemplateService, 
  ContractTemplate, 
  GeneratedContract,
  ContractVariableData 
} from '@/services/contractTemplateService';
import { PDFService } from '@/services/pdfService';
import { DigitalSignatureService } from '@/services/digitalSignatureService';
import { FileText, Download, Send, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TemplateBasedContractProps {
  rentalData: any;
  cityId: string;
  onContractGenerated?: (contract: GeneratedContract) => void;
  onSignatureRequested?: (signatureRequest: any) => void;
}

export const TemplateBasedContract: React.FC<TemplateBasedContractProps> = ({
  rentalData,
  cityId,
  onContractGenerated,
  onSignatureRequested
}) => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [generatedContracts, setGeneratedContracts] = useState<GeneratedContract[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [existingContract, setExistingContract] = useState<GeneratedContract | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadGeneratedContracts();
  }, []);

  useEffect(() => {
    if (selectedTemplate?.id && rentalData?.id) {
      checkExistingContract();
    }
  }, [selectedTemplate?.id, rentalData?.id]);

  const checkExistingContract = async () => {
    if (selectedTemplate && rentalData.id) {
      try {
        const existing = await ContractTemplateService.checkExistingContract(
          selectedTemplate.id,
          rentalData.id
        );
        setExistingContract(existing);
      } catch (error) {
        console.error('Erro ao verificar contrato existente:', error);
        setExistingContract(null);
      }
    }
  };

  const loadTemplates = async () => {
    try {
      // Buscar template padrão de locação
      const defaultTemplate = await ContractTemplateService.getDefaultTemplate('rental');
      if (defaultTemplate) {
        setTemplates([defaultTemplate]);
        setSelectedTemplate(defaultTemplate);
      } else {
        // Se não encontrar template padrão, buscar todos os templates de locação
        const contractTypes = await ContractTemplateService.getContractTypes();
        const rentalType = contractTypes.find(t => t.category === 'rental');
        if (rentalType) {
          const rentalTemplates = await ContractTemplateService.getTemplatesByType(rentalType.id);
          if (rentalTemplates.length > 0) {
            setTemplates(rentalTemplates);
            setSelectedTemplate(rentalTemplates[0]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os templates de contrato. Verifique se o sistema foi configurado corretamente.",
      });
    }
  };

  const loadGeneratedContracts = async () => {
    try {
      const contracts = await ContractTemplateService.getGeneratedContracts(cityId);
      // Filtrar contratos relacionados a esta locação E que não sejam anexos
      const rentalContracts = contracts.filter(c =>
        c.rental_id === rentalData.id &&
        c.template?.name &&
        !c.template.name.includes('Anexo')
      );
      setGeneratedContracts(rentalContracts);
    } catch (error) {
      console.error('Erro ao carregar contratos gerados:', error);
    }
  };

  const prepareContractData = (): ContractVariableData => {
    return {
      // Dados do Franqueado
      franchisee_name: rentalData.franchisee_name || 'Master Brasil',
      franchisee_cnpj: rentalData.franchisee_cnpj || '',
      franchisee_address: rentalData.franchisee_address || '',
      franchisee_phone: rentalData.franchisee_phone || '',
      
      // Dados do Cliente
      client_name: rentalData.client_name || '',
      client_cpf: rentalData.client_cpf || rentalData.client_document || '',
      client_rg: rentalData.client_rg || '',
      client_address: rentalData.client_address || '',
      client_phone: rentalData.client_phone || '',
      client_email: rentalData.client_email || '',
      client_cnh: rentalData.client_cnh || '',
      client_cnh_category: rentalData.client_cnh_category || '',
      client_cnh_expiry: rentalData.client_cnh_expiry || '',
      
      // Dados da Motocicleta
      motorcycle_model: rentalData.motorcycle_model || '',
      motorcycle_plate: rentalData.motorcycle_plate || '',
      motorcycle_year: rentalData.motorcycle_year || '',
      motorcycle_color: rentalData.motorcycle_color || '',
      motorcycle_chassi: rentalData.motorcycle_chassi || '',
      motorcycle_renavam: rentalData.motorcycle_renavam || '',
      
      // Dados da Locação
      start_date: rentalData.start_date || '',
      end_date: rentalData.end_date || '',
      daily_rate: rentalData.daily_rate || 0,
      total_amount: rentalData.total_amount || 0,
      deposit_value: rentalData.deposit_value || 500,
      plan_name: rentalData.plan_name || '',
      km_inicial: rentalData.km_inicial || 0,
      km_final: rentalData.km_final || 0,
      observations: rentalData.observations || '',
      
      // Dados do Contrato
      contract_number: `CONT-${Date.now()}`,
      contract_date: new Date().toISOString()
    };
  };

  const generateContract = async () => {
    if (!selectedTemplate) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um template de contrato.",
      });
      return;
    }

    // Verificar se já existe um contrato para este template e locação
    if (existingContract) {
      toast({
        variant: "destructive",
        title: "Contrato já existe",
        description: "Já existe um contrato deste tipo para esta locação.",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const contractData = prepareContractData();
      
      // Gerar contrato no banco de dados
      const generatedContract = await ContractTemplateService.generateContract(
        selectedTemplate.id,
        contractData,
        cityId,
        rentalData.id
      );

      // Gerar PDF
      const doc = await PDFService.generateTemplateBasedContract(
        selectedTemplate.id,
        contractData
      );

      // Simular upload do PDF (em produção, usar Supabase Storage)
      const pdfBlob = doc.output('blob');
      const fileName = `contrato_${generatedContract.contract_number}.pdf`;
      
      // Mock upload
      console.log('📄 [TemplateContract] Mock upload:', fileName);
      const mockUrl = `https://mock-storage.com/contracts/${fileName}`;

      // Atualizar contrato com URL do PDF
      await ContractTemplateService.updateContractStatus(
        generatedContract.id,
        'generated',
        { pdf_url: mockUrl }
      );

      toast({
        title: "Contrato Gerado",
        description: "Contrato gerado com sucesso!",
      });

      // Atualizar lista
      await loadGeneratedContracts();
      
      // Callback para componente pai
      if (onContractGenerated) {
        onContractGenerated({ ...generatedContract, pdf_url: mockUrl });
      }

      setIsDialogOpen(false);
      
    } catch (error: any) {
      console.error('Erro ao gerar contrato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o contrato. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadContract = async (contract: GeneratedContract) => {
    try {
      const doc = await PDFService.generateFromGeneratedContract(contract);
      doc.save(`contrato_${contract.contract_number}.pdf`);

      toast({
        title: "Download Iniciado",
        description: "Contrato baixado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível baixar o contrato.",
      });
    }
  };

  const deleteContract = async () => {
    if (!existingContract) return;

    try {
      await ContractTemplateService.deleteContract(existingContract.id);

      toast({
        title: "Contrato excluído",
        description: "Contrato excluído com sucesso!",
      });

      // Recarregar dados
      setExistingContract(null);
      loadGeneratedContracts();
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
      });
    }
  };

  const deleteContractFromList = async (contractId: string) => {
    try {
      await ContractTemplateService.deleteContract(contractId);

      toast({
        title: "Contrato excluído",
        description: "Contrato excluído com sucesso!",
      });

      // Recarregar dados
      loadGeneratedContracts();
      checkExistingContract();
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
      });
    }
  };

  const previewContract = async (contract: GeneratedContract) => {
    try {
      const doc = await PDFService.generateFromGeneratedContract(contract);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar contrato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível visualizar o contrato.",
      });
    }
  };

  const sendForSignature = async (contract: GeneratedContract) => {
    try {
      // Implementar envio para assinatura digital
      const signers = [
        {
          name: contract.contract_data.client_name,
          email: contract.contract_data.client_email,
          cpf: contract.contract_data.client_cpf,
          phone: contract.contract_data.client_phone
        }
      ];

      // Gerar PDF para envio
      const doc = await PDFService.generateFromGeneratedContract(contract);
      const pdfBlob = doc.output('blob');
      const fileName = `contrato_${contract.contract_number}.pdf`;

      // Criar solicitação de assinatura
      const signatureRequest = await DigitalSignatureService.createSignatureRequest(
        pdfBlob,
        fileName,
        signers,
        rentalData.id
      );

      // Atualizar status do contrato
      await ContractTemplateService.updateContractStatus(
        contract.id,
        'sent',
        { signature_request_id: signatureRequest.id }
      );

      toast({
        title: "Enviado para Assinatura",
        description: "Contrato enviado para assinatura digital!",
      });

      // Atualizar lista
      await loadGeneratedContracts();

      // Callback para componente pai
      if (onSignatureRequested) {
        onSignatureRequested(signatureRequest);
      }

    } catch (error) {
      console.error('Erro ao enviar para assinatura:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar para assinatura.",
      });
    }
  };

  const getStatusBadge = (status: GeneratedContract['status']) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, icon: Clock },
      generated: { label: 'Gerado', variant: 'default' as const, icon: FileText },
      sent: { label: 'Enviado', variant: 'default' as const, icon: Send },
      signed: { label: 'Assinado', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Contratos da Locação</h3>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Novo Contrato</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{selectedTemplate.name}</CardTitle>
                    <CardDescription>
                      Versão {selectedTemplate.version} - {selectedTemplate.contract_type?.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
              
              <div className="flex gap-2">
                {existingContract ? (
                  <div className="flex gap-2 w-full">
                    <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Contrato já existe:</strong> {existingContract.contract_number}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Criado em {new Date(existingContract.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      onClick={deleteContract}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={generateContract}
                    disabled={isGenerating || !selectedTemplate}
                    className="flex-1"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Contrato'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de contratos gerados */}
      <div className="space-y-3">
        {generatedContracts.map((contract) => (
          <Card key={contract.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{contract.contract_number}</h4>
                    {getStatusBadge(contract.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {contract.template?.name} - Criado em {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewContract(contract)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadContract(contract)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {contract.status === 'generated' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => sendForSignature(contract)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteContractFromList(contract.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {generatedContracts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum contrato gerado ainda</p>
              <p className="text-sm text-gray-500">Clique em "Gerar Contrato" para começar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
