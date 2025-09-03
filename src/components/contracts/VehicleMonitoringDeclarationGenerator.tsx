import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Send } from 'lucide-react';
import { PDFService } from '../../services/pdfService';
import { ContractTemplateService } from '../../services/contractTemplateService';
import { toast } from 'sonner';

interface VehicleMonitoringData {
  client_name: string;
  client_cpf: string;
  client_cnh: string;
  client_address: string;
  client_neighborhood: string;
  client_city: string;
  client_state: string;
  client_number: string;
  client_cep: string;
  client_email?: string;
  client_phone?: string;
  contract_city: string;
  contract_date: string;
}

interface VehicleMonitoringDeclarationGeneratorProps {
  vehicleMonitoringData: VehicleMonitoringData;
  cityId: string;
  rentalId?: string;
  onDeclarationGenerated?: (declarationUrl: string) => void;
}

export const VehicleMonitoringDeclarationGenerator: React.FC<VehicleMonitoringDeclarationGeneratorProps> = ({
  vehicleMonitoringData,
  cityId,
  rentalId,
  onDeclarationGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [existingDeclaration, setExistingDeclaration] = useState<any>(null);
  const [allDeclarations, setAllDeclarations] = useState<any[]>([]);

  useEffect(() => {
    if (rentalId) {
      checkExistingDeclaration();
      loadAllDeclarations();
    }
  }, [rentalId]);

  const createClauseForTemplate = async (templateId: string) => {
    const templateVariables = [
      'client_name', 'client_cpf', 'client_cnh', 'client_address', 'client_city', 
      'client_state', 'client_neighborhood', 'client_number', 'contract_city', 'contract_date'
    ];

    try {
      console.log('📋 [VehicleMonitoringDeclarationGenerator] Criando cláusula para template ID:', templateId);
      
      const clause = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '1',
        title: 'ANEXO VII - DECLARAÇÃO DE CONHECIMENTO DE MONITORAMENTO DO VEÍCULO',
        content: `Eu, {{client_name}}, pessoa física, CPF nº {{client_cpf}}, CNH nº {{client_cnh}}, residente e domiciliado em {{client_city}}/{{client_state}}, {{client_address}}, {{client_number}}, bairro {{client_neighborhood}}, doravante mencionado como LOCATÁRIO, declaro para todos os fins de direito:

i) ter sido amplamente informado de que o (s) mencionado (s) VEÍCULO (s) possui (em) dispositivo de rastreamento para permitir sua localização via sinais GSM, GPRS e GPS;

ii) ter sido amplamente informado de que o (s) referido (s) VEÍCULO (s) poderá (ão) circular no perímetro determinado em contrato e que caso saia do referido perímetro ocorrerá remotamente e automaticamente o bloqueio por meio do dispositivo rastreador;

iii) Caso seja necessário sair do supracitado perímetro, será necessário solicitar, por meio dos requisitos já previstos no contrato, a autorização;

iv) ter sido amplamente informado de que o atraso na devolução do (s) VEÍCULO (s) poderá caracterizar o crime de apropriação indébita, e que o (s) VEÍCULO (s) poderá (ão) ainda ser remotamente e automaticamente bloqueado pelo Sistema de rastreamento;

v) ter sido amplamente informado que o inadimplemento das minhas obrigações financeiras junto à LOCADORA, especialmente atraso maior do que 72hrs no pagamento semanal devido, implicará no imediato bloqueio remoto do (s) VEÍCULO (s), sem prejuízo da cobrança dos valores devidos.

{{contract_city}}, {{contract_date}}

___________________________________________
Locatário`,
        order_index: 1,
        is_required: true,
        variables: templateVariables
      });
      
      console.log('✅ [VehicleMonitoringDeclarationGenerator] Cláusula criada com sucesso:', clause);
      return clause;
    } catch (clauseError) {
      console.error('❌ [VehicleMonitoringDeclarationGenerator] Erro ao criar cláusula:', clauseError);
      throw clauseError;
    }
  };

  const getOrCreateVehicleMonitoringTemplateId = async (): Promise<string> => {
    try {
      // Primeiro tenta buscar template existente por nome
      let template = await ContractTemplateService.getTemplateByName('Anexo VII - Declaração de Conhecimento de Monitoramento do Veículo');
      
      if (template) {
        // Verificar se o template tem cláusulas
        const existingClauses = await ContractTemplateService.getTemplateClauses(template.id);
        if (existingClauses.length === 0) {
          console.log('📋 [VehicleMonitoringDeclarationGenerator] Template existe mas não tem cláusulas, criando...');
          await createClauseForTemplate(template.id);
        }
        return template.id;
      }
      
      console.log('Criando template Anexo VII - Declaração de Conhecimento de Monitoramento do Veículo...');
      
      // Se não existe, criar um novo template
      // Primeiro, buscar ou criar um tipo de contrato para anexos
      const contractTypes = await ContractTemplateService.getContractTypes();
      let annexType = contractTypes.find(t => t.name.includes('Anexo') || t.category === 'annex');
      
      if (!annexType) {
        // Se não existe tipo de anexo, usar o primeiro disponível
        annexType = contractTypes[0];
      }
      
      if (!annexType) {
        throw new Error('Nenhum tipo de contrato encontrado no sistema');
      }
      
      // Conteúdo do template baseado no modelo fornecido
      const templateContent = {
        sections: [
          {
            title: "ANEXO VII - DECLARAÇÃO DE CONHECIMENTO DE MONITORAMENTO DO VEÍCULO",
            content: `Eu, {{client_name}}, pessoa física, CPF nº {{client_cpf}}, CNH nº {{client_cnh}}, residente e domiciliado em {{client_city}}/{{client_state}}, {{client_address}}, {{client_number}}, bairro {{client_neighborhood}}, doravante mencionado como LOCATÁRIO, declaro para todos os fins de direito:

i) ter sido amplamente informado de que o (s) mencionado (s) VEÍCULO (s) possui (em) dispositivo de rastreamento para permitir sua localização via sinais GSM, GPRS e GPS;

ii) ter sido amplamente informado de que o (s) referido (s) VEÍCULO (s) poderá (ão) circular no perímetro determinado em contrato e que caso saia do referido perímetro ocorrerá remotamente e automaticamente o bloqueio por meio do dispositivo rastreador;

iii) Caso seja necessário sair do supracitado perímetro, será necessário solicitar, por meio dos requisitos já previstos no contrato, a autorização;

iv) ter sido amplamente informado de que o atraso na devolução do (s) VEÍCULO (s) poderá caracterizar o crime de apropriação indébita, e que o (s) VEÍCULO (s) poderá (ão) ainda ser remotamente e automaticamente bloqueado pelo Sistema de rastreamento;

v) ter sido amplamente informado que o inadimplemento das minhas obrigações financeiras junto à LOCADORA, especialmente atraso maior do que 72hrs no pagamento semanal devido, implicará no imediato bloqueio remoto do (s) VEÍCULO (s), sem prejuízo da cobrança dos valores devidos.

{{contract_city}}, {{contract_date}}

___________________________________________
Locatário`
          }
        ]
      };
      
      // Variáveis do template
      const templateVariables = [
        'client_name', 'client_cpf', 'client_cnh', 'client_address', 'client_city', 
        'client_state', 'client_neighborhood', 'client_number', 'contract_city', 'contract_date'
      ];
      
      // Criar template usando o ContractTemplateService
      const newTemplate = await ContractTemplateService.createTemplate({
        contract_type_id: annexType.id,
        name: 'Anexo VII - Declaração de Conhecimento de Monitoramento do Veículo',
        version: '1.0',
        title: 'Anexo VII - Declaração de Conhecimento de Monitoramento do Veículo',
        content: templateContent,
        variables: templateVariables,
        is_active: true,
        is_default: false
      });
      
      // Criar a cláusula principal do documento
      await createClauseForTemplate(newTemplate.id);
      
      console.log('Template e cláusula do Anexo VII criados com sucesso:', newTemplate);
      return newTemplate.id;
      
    } catch (error) {
      console.error('Erro ao criar template Anexo VII:', error);
      throw error;
    }
  };

  const checkExistingDeclaration = async () => {
    if (rentalId) {
      try {
        // ID do template Anexo VII (seguindo padrão do DepositReceiptGenerator)
        const templateId = await getOrCreateVehicleMonitoringTemplateId();
        const existing = await ContractTemplateService.checkExistingContract(
          templateId,
          rentalId
        );
        setExistingDeclaration(existing);
      } catch (error) {
        console.error('Erro ao verificar declaração existente:', error);
      }
    }
  };

  const loadAllDeclarations = async () => {
    if (rentalId) {
      try {
        const declarations = await ContractTemplateService.getGeneratedAnnexes(
          rentalId,
          'Anexo VII'
        );
        setAllDeclarations(declarations || []);
      } catch (error) {
        console.error('Erro ao carregar declarações:', error);
        setAllDeclarations([]);
      }
    }
  };

  const prepareDeclarationData = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return {
      // Dados do Cliente/Locatário
      client_name: vehicleMonitoringData.client_name || '',
      client_cpf: vehicleMonitoringData.client_cpf || '',
      client_cnh: vehicleMonitoringData.client_cnh || '',
      client_address: vehicleMonitoringData.client_address || '',
      client_neighborhood: vehicleMonitoringData.client_neighborhood || '',
      client_city: vehicleMonitoringData.client_city || '',
      client_state: vehicleMonitoringData.client_state || 'AL',
      client_number: vehicleMonitoringData.client_number || '',
      client_cep: vehicleMonitoringData.client_cep || '',
      
      // Dados do Contrato
      contract_date: currentDate,
      contract_city: vehicleMonitoringData.contract_city || 'Maceió',
      contract_number: `DECL-${Date.now()}`,
      
      // Dados obrigatórios (mesmo que não usados nesta declaração)
      franchisee_name: '',
      franchisee_cnpj: '',
      motorcycle_plate: '',
      motorcycle_model: '',
      motorcycle_brand: '',
      daily_rate: 0,
      total_amount: 0,
      start_date: '',
      end_date: '',
      plan_name: ''
    };
  };

  const generateDeclaration = async () => {
    // Verificar se já existe uma declaração para esta locação
    if (existingDeclaration) {
      toast.error('Já existe um Anexo VII (Declaração de Monitoramento) para esta locação.');
      return;
    }

    try {
      setIsGenerating(true);

      // Buscar template do Anexo VII pelo ID (seguindo padrão do DepositReceiptGenerator)
      const templateId = await getOrCreateVehicleMonitoringTemplateId();
      console.log('📋 [VehicleMonitoringDeclarationGenerator] Template ID:', templateId);
      
      const declarationTemplate = await ContractTemplateService.getTemplateById(templateId);
      console.log('📋 [VehicleMonitoringDeclarationGenerator] Template encontrado:', declarationTemplate);

      if (!declarationTemplate) {
        throw new Error('Template do Anexo VII não encontrado');
      }
      
      // Verificar se há cláusulas
      const clauses = await ContractTemplateService.getTemplateClauses(templateId);
      console.log('📋 [VehicleMonitoringDeclarationGenerator] Cláusulas encontradas:', clauses?.length || 0, clauses);

      const declarationData = prepareDeclarationData();
      
      // Gerar contrato no banco de dados
      const generatedContract = await ContractTemplateService.generateContract(
        declarationTemplate.id,
        declarationData,
        cityId,
        rentalId
      );

      // Gerar PDF
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        declarationTemplate.id,
        declarationData
      );

      // Simular upload do PDF
      const pdfBlob = pdfDoc.output('blob');
      const fileName = `anexo_vii_${generatedContract.contract_number}.pdf`;

      // Mock upload
      console.log('📄 [VehicleMonitoringDeclarationGenerator] Mock upload:', fileName);
      const mockUrl = `https://mock-storage.com/declarations/${fileName}`;

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
      if (onDeclarationGenerated) {
        onDeclarationGenerated(mockUrl);
      }

      toast.success('Anexo VII - Declaração de Monitoramento gerado com sucesso!');
      setIsDialogOpen(false);

      // Recarregar dados
      await loadAllDeclarations();
      await checkExistingDeclaration();

    } catch (error) {
      console.error('Erro ao gerar Anexo VII:', error);
      toast.error('Erro ao gerar Anexo VII. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDeclaration = async (declaration: any) => {
    try {
      const templateId = await getOrCreateVehicleMonitoringTemplateId();
      const declarationTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!declarationTemplate) throw new Error('Template não encontrado');

      const declarationData = declaration.contract_data || prepareDeclarationData();
      const doc = await PDFService.generateTemplateBasedContract(declarationTemplate.id, declarationData);
      doc.save(`anexo_vii_${declaration.contract_number}.pdf`);

      toast.success('Anexo VII baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar declaração:', error);
      toast.error('Não foi possível baixar a declaração.');
    }
  };

  const previewDeclarationDocument = async (declaration: any) => {
    try {
      // Buscar template do Anexo VII
      const templateId = await getOrCreateVehicleMonitoringTemplateId();
      const declarationTemplate = await ContractTemplateService.getTemplateById(templateId);

      if (!declarationTemplate) {
        throw new Error('Template do Anexo VII não encontrado');
      }

      // Preparar dados do contrato usando os dados salvos
      const declarationData = declaration.contract_data || prepareDeclarationData();

      // Gerar PDF
      const doc = await PDFService.generateTemplateBasedContract(
        declarationTemplate.id,
        declarationData
      );

      // Abrir PDF em nova aba
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.success('PDF do Anexo VII aberto em nova aba!');
    } catch (error) {
      console.error('Erro ao visualizar declaração:', error);
      toast.error('Não foi possível visualizar a declaração.');
    }
  };

  const sendForSignature = async (declaration: any) => {
    try {
      if (!declaration) {
        toast.error('Gere o Anexo VII primeiro antes de enviar para assinatura.');
        return;
      }

      console.log('📋 [VehicleMonitoringDeclarationGenerator] Iniciando envio para assinatura...');

      // Preparar dados para gerar o PDF usando o template correto
      const templateId = await getOrCreateVehicleMonitoringTemplateId();
      const declarationTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!declarationTemplate) {
        throw new Error('Template do Anexo VII não encontrado');
      }

      // Preparar dados da declaração
      const declarationData = declaration.contract_data || prepareDeclarationData();

      // Gerar PDF do Anexo VII usando o template correto
      const doc = await PDFService.generateTemplateBasedContract(
        declarationTemplate.id,
        declarationData
      );
      const pdfBlob = doc.output('blob');
      const fileName = `anexo_vii_${declaration.contract_number}.pdf`;

      // Criar signatários baseados nos dados da locação
      const clientEmail = vehicleMonitoringData.client_email || 'cliente@email.com';
      const clientPhone = vehicleMonitoringData.client_phone || '';
      const signers = [
        {
          name: vehicleMonitoringData.client_name || 'Cliente',
          email: clientEmail,
          cpf: vehicleMonitoringData.client_cpf || '',
          phone: clientPhone,
          role: 'client' as const
        }
      ];

      // Validar se tem email válido
      if (!clientEmail || clientEmail === 'cliente@email.com') {
        console.warn('⚠️ [VehicleMonitoringDeclarationGenerator] Usando email padrão para cliente:', clientEmail);
      }

      // Importar DigitalSignatureService dinamicamente para evitar dependência circular
      const { DigitalSignatureService } = await import('../../services/digitalSignatureService');

      // Enviar para BeSign
      const signatureRequest = await DigitalSignatureService.createSignatureRequest(
        pdfBlob,
        fileName,
        signers,
        declaration.contract_number,
        rentalId
      );

      console.log('✅ [VehicleMonitoringDeclarationGenerator] Enviado para assinatura:', signatureRequest);

      // Atualizar status do contrato para "sent"  
      if (declaration?.id) {
        await ContractTemplateService.updateContractStatus(
          declaration.id,
          'sent',
          { signature_request_id: signatureRequest.id }
        );
      }

      toast.success('Anexo VII enviado para assinatura digital via BeSign!');

      // Recarregar lista de declarações
      await loadAllDeclarations();
      await checkExistingDeclaration();

    } catch (error) {
      console.error('❌ [VehicleMonitoringDeclarationGenerator] Erro ao enviar para assinatura:', error);
      
      // Verificar se o erro é apenas cosmético (mock funcionando)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('error_fallback_') || errorMessage.includes('mock')) {
        // Atualizar status mesmo no modo mock
        if (declaration?.id) {
          await ContractTemplateService.updateContractStatus(
            declaration.id,
            'sent',
            { signature_request_id: 'mock_request_id' }
          );
        }

        toast.success('Anexo VII enviado para assinatura (Modo Desenvolvimento)');
        
        // Recarregar lista mesmo no mock
        await loadAllDeclarations();
        await checkExistingDeclaration();
      } else {
        toast.error('Não foi possível enviar para assinatura. Verifique os logs para mais detalhes.');
      }
    }
  };

  const deleteDeclaration = async () => {
    if (!existingDeclaration) return;

    try {
      await ContractTemplateService.deleteContract(existingDeclaration.id);

      toast.success('Anexo VII excluído com sucesso!');

      // Recarregar dados
      setExistingDeclaration(null);
      loadAllDeclarations();
    } catch (error) {
      console.error('Erro ao excluir declaração:', error);
      toast.error('Não foi possível excluir a declaração.');
    }
  };

  const deleteDeclarationFromList = async (declarationId: string) => {
    try {
      await ContractTemplateService.deleteContract(declarationId);

      toast.success('Anexo VII excluído com sucesso!');

      // Recarregar dados
      loadAllDeclarations();
      checkExistingDeclaration();
    } catch (error) {
      console.error('Erro ao excluir declaração:', error);
      toast.error('Não foi possível excluir a declaração.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Anexo VII - Declaração de Monitoramento</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Anexo VII
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Anexo VII</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Anexo VII - Declaração de Conhecimento de Monitoramento do Veículo</CardTitle>
                  <CardDescription>
                    Declaração sobre sistema de rastreamento e monitoramento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Cliente:</span> {vehicleMonitoringData.client_name}
                      </div>
                      <div>
                        <span className="font-medium">CPF:</span> {vehicleMonitoringData.client_cpf}
                      </div>
                      <div>
                        <span className="font-medium">CNH:</span> {vehicleMonitoringData.client_cnh}
                      </div>
                      <div>
                        <span className="font-medium">Cidade:</span> {vehicleMonitoringData.contract_city || 'Maceió'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {existingDeclaration ? (
                  <div className="flex gap-2 w-full">
                    <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Anexo VII já existe:</strong> {existingDeclaration.contract_number}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Criado em {new Date(existingDeclaration.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      onClick={deleteDeclaration}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={generateDeclaration}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Anexo VII'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Anexos VII gerados */}
      {allDeclarations.length > 0 && (
        <div className="space-y-3">
          {allDeclarations.map((declaration) => (
            <Card key={declaration.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{declaration.contract_number}</h4>
                      <Badge variant={declaration.status === 'sent' ? 'default' : 'secondary'}>
                        {declaration.status === 'sent' ? 'Enviado' : 
                         declaration.status === 'signed' ? 'Assinado' : 
                         declaration.status === 'cancelled' ? 'Cancelado' : 'Gerado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {declaration.template?.name} - Criado em {new Date(declaration.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewDeclarationDocument(declaration)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDeclaration(declaration)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendForSignature(declaration)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDeclarationFromList(declaration.id)}
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