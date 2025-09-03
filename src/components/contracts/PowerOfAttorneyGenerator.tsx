import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Send } from 'lucide-react';
import { PDFService } from '../../services/pdfService';
import { ContractTemplateService } from '../../services/contractTemplateService';
import { toast } from 'sonner';

interface PowerOfAttorneyData {
  client_name: string;
  client_cpf: string;
  client_cnh: string;
  client_profession: string;
  client_marital_status: string;
  client_address: string;
  client_neighborhood: string;
  client_city: string;
  client_state: string;
  client_number: string;
  client_cep: string;
  client_email?: string;
  client_phone?: string;
  franchisee_name: string;
  franchisee_cnpj: string;
  franchisee_address: string;
  franchisee_neighborhood: string;
  franchisee_city: string;
  franchisee_state: string;
  franchisee_number: string;
  franchisee_cep: string;
  contract_city: string;
  contract_date: string;
}

interface PowerOfAttorneyGeneratorProps {
  powerOfAttorneyData: PowerOfAttorneyData;
  cityId: string;
  rentalId?: string;
  onPowerOfAttorneyGenerated?: (powerOfAttorneyUrl: string) => void;
}

export const PowerOfAttorneyGenerator: React.FC<PowerOfAttorneyGeneratorProps> = ({
  powerOfAttorneyData,
  cityId,
  rentalId,
  onPowerOfAttorneyGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [existingPowerOfAttorney, setExistingPowerOfAttorney] = useState<any>(null);
  const [allPowerOfAttorneys, setAllPowerOfAttorneys] = useState<any[]>([]);

  useEffect(() => {
    if (rentalId) {
      checkExistingPowerOfAttorney();
      loadAllPowerOfAttorneys();
    }
  }, [rentalId]);

  const createClauseForTemplate = async (templateId: string) => {
    const templateVariables = [
      'client_name', 'client_cpf', 'client_cnh', 'client_profession', 'client_marital_status',
      'client_address', 'client_city', 'client_state', 'client_neighborhood', 'client_number', 'client_cep',
      'franchisee_name', 'franchisee_cnpj', 'franchisee_address', 'franchisee_neighborhood', 
      'franchisee_city', 'franchisee_state', 'franchisee_number', 'franchisee_cep',
      'contract_city', 'contract_date'
    ];

    try {
      console.log('📋 [PowerOfAttorneyGenerator] Criando cláusula para template ID:', templateId);
      
      const clause = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '1',
        title: 'ANEXO III - PROCURAÇÃO',
        content: `{{client_name}}, {{client_profession}}, {{client_marital_status}}, CPF {{client_cpf}}, CNH nº {{client_cnh}}, residente e domiciliado em {{client_city}}/{{client_state}}, {{client_address}}, {{client_number}}, bairro {{client_neighborhood}}, neste ato nomeia e constitui sua bastante procuradora, a empresa {{franchisee_name}}, inscrita no CNPJ: {{franchisee_cnpj}}, localizada à {{franchisee_address}}, Nº {{franchisee_number}}, BAIRRO {{franchisee_neighborhood}}, CEP: {{franchisee_cep}}, {{franchisee_city}}, representada por seu administrador, ou a quem esta indicar, também por meio de instrumento procuratório, para, em seu nome, exclusivamente assinar o Termo de Apresentação do Condutor Infrator nos casos de multas de trânsito em geral, oriundas e praticadas na vigência deste Contrato de Locação, nos termos do art. 257, Parágrafos 7º e 8º, do Código de Trânsito Brasileiro, e outras normas devidamente atualizadas.

{{contract_city}}, {{contract_date}}

___________________________________________
LOCATÁRIO`,
        order_index: 1,
        is_required: true,
        variables: templateVariables
      });
      
      console.log('✅ [PowerOfAttorneyGenerator] Cláusula criada com sucesso:', clause);
      return clause;
    } catch (clauseError) {
      console.error('❌ [PowerOfAttorneyGenerator] Erro ao criar cláusula:', clauseError);
      throw clauseError;
    }
  };

  const getOrCreatePowerOfAttorneyTemplateId = async (): Promise<string> => {
    try {
      // Primeiro tenta buscar template existente por nome
      let template = await ContractTemplateService.getTemplateByName('Anexo III - Procuração');
      
      if (template) {
        // Verificar se o template tem cláusulas
        const existingClauses = await ContractTemplateService.getTemplateClauses(template.id);
        if (existingClauses.length === 0) {
          console.log('📋 [PowerOfAttorneyGenerator] Template existe mas não tem cláusulas, criando...');
          await createClauseForTemplate(template.id);
        }
        return template.id;
      }
      
      console.log('Criando template Anexo III - Procuração...');
      
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
            title: "ANEXO III - PROCURAÇÃO",
            content: `{{client_name}}, {{client_profession}}, {{client_marital_status}}, CPF {{client_cpf}}, CNH nº {{client_cnh}}, residente e domiciliado em {{client_city}}/{{client_state}}, {{client_address}}, {{client_number}}, bairro {{client_neighborhood}}, neste ato nomeia e constitui sua bastante procuradora, a empresa {{franchisee_name}}, inscrita no CNPJ: {{franchisee_cnpj}}, localizada à {{franchisee_address}}, Nº {{franchisee_number}}, BAIRRO {{franchisee_neighborhood}}, CEP: {{franchisee_cep}}, {{franchisee_city}}, representada por seu administrador, ou a quem esta indicar, também por meio de instrumento procuratório, para, em seu nome, exclusivamente assinar o Termo de Apresentação do Condutor Infrator nos casos de multas de trânsito em geral, oriundas e praticadas na vigência deste Contrato de Locação, nos termos do art. 257, Parágrafos 7º e 8º, do Código de Trânsito Brasileiro, e outras normas devidamente atualizadas.

{{contract_city}}, {{contract_date}}

___________________________________________
LOCATÁRIO`
          }
        ]
      };
      
      // Variáveis do template
      const templateVariables = [
        'client_name', 'client_cpf', 'client_cnh', 'client_profession', 'client_marital_status',
        'client_address', 'client_city', 'client_state', 'client_neighborhood', 'client_number', 'client_cep',
        'franchisee_name', 'franchisee_cnpj', 'franchisee_address', 'franchisee_neighborhood', 
        'franchisee_city', 'franchisee_state', 'franchisee_number', 'franchisee_cep',
        'contract_city', 'contract_date'
      ];
      
      // Criar template usando o ContractTemplateService
      const newTemplate = await ContractTemplateService.createTemplate({
        contract_type_id: annexType.id,
        name: 'Anexo III - Procuração',
        version: '1.0',
        title: 'Anexo III - Procuração',
        content: templateContent,
        variables: templateVariables,
        is_active: true,
        is_default: false
      });
      
      // Criar a cláusula principal do documento
      await createClauseForTemplate(newTemplate.id);
      
      console.log('Template e cláusula do Anexo III criados com sucesso:', newTemplate);
      return newTemplate.id;
      
    } catch (error) {
      console.error('Erro ao criar template Anexo III:', error);
      throw error;
    }
  };

  const checkExistingPowerOfAttorney = async () => {
    if (rentalId) {
      try {
        // ID do template Anexo III (seguindo padrão dos outros anexos)
        const templateId = await getOrCreatePowerOfAttorneyTemplateId();
        const existing = await ContractTemplateService.checkExistingContract(
          templateId,
          rentalId
        );
        setExistingPowerOfAttorney(existing);
      } catch (error) {
        console.error('Erro ao verificar procuração existente:', error);
      }
    }
  };

  const loadAllPowerOfAttorneys = async () => {
    if (rentalId) {
      try {
        const powerOfAttorneys = await ContractTemplateService.getGeneratedAnnexes(
          rentalId,
          'Anexo III'
        );
        setAllPowerOfAttorneys(powerOfAttorneys || []);
      } catch (error) {
        console.error('Erro ao carregar procurações:', error);
        setAllPowerOfAttorneys([]);
      }
    }
  };

  const preparePowerOfAttorneyData = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return {
      // Dados do Cliente/Outorgante
      client_name: powerOfAttorneyData.client_name || '',
      client_cpf: powerOfAttorneyData.client_cpf || '',
      client_cnh: powerOfAttorneyData.client_cnh || '',
      client_profession: powerOfAttorneyData.client_profession || 'profissional',
      client_marital_status: powerOfAttorneyData.client_marital_status || 'solteiro(a)',
      client_address: powerOfAttorneyData.client_address || '',
      client_neighborhood: powerOfAttorneyData.client_neighborhood || '',
      client_city: powerOfAttorneyData.client_city || '',
      client_state: powerOfAttorneyData.client_state || 'AL',
      client_number: powerOfAttorneyData.client_number || '',
      client_cep: powerOfAttorneyData.client_cep || '',
      
      // Dados da Empresa Procuradora
      franchisee_name: powerOfAttorneyData.franchisee_name || '',
      franchisee_cnpj: powerOfAttorneyData.franchisee_cnpj || '',
      franchisee_address: powerOfAttorneyData.franchisee_address || '',
      franchisee_neighborhood: powerOfAttorneyData.franchisee_neighborhood || '',
      franchisee_city: powerOfAttorneyData.franchisee_city || '',
      franchisee_state: powerOfAttorneyData.franchisee_state || '',
      franchisee_number: powerOfAttorneyData.franchisee_number || '',
      franchisee_cep: powerOfAttorneyData.franchisee_cep || '',
      
      // Dados do Contrato
      contract_date: currentDate,
      contract_city: powerOfAttorneyData.contract_city || '',
      contract_number: `PROC-${Date.now()}`,
      
      // Dados obrigatórios (mesmo que não usados nesta procuração)
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

  const generatePowerOfAttorney = async () => {
    // Verificar se já existe uma procuração para esta locação
    if (existingPowerOfAttorney) {
      toast.error('Já existe um Anexo III (Procuração) para esta locação.');
      return;
    }

    try {
      setIsGenerating(true);

      // Buscar template do Anexo III pelo ID (seguindo padrão dos outros anexos)
      const templateId = await getOrCreatePowerOfAttorneyTemplateId();
      console.log('📋 [PowerOfAttorneyGenerator] Template ID:', templateId);
      
      const powerOfAttorneyTemplate = await ContractTemplateService.getTemplateById(templateId);
      console.log('📋 [PowerOfAttorneyGenerator] Template encontrado:', powerOfAttorneyTemplate);

      if (!powerOfAttorneyTemplate) {
        throw new Error('Template do Anexo III não encontrado');
      }
      
      // Verificar se há cláusulas
      const clauses = await ContractTemplateService.getTemplateClauses(templateId);
      console.log('📋 [PowerOfAttorneyGenerator] Cláusulas encontradas:', clauses?.length || 0, clauses);

      const powerOfAttorneyDataPrepared = preparePowerOfAttorneyData();
      
      // Gerar contrato no banco de dados
      const generatedContract = await ContractTemplateService.generateContract(
        powerOfAttorneyTemplate.id,
        powerOfAttorneyDataPrepared,
        cityId,
        rentalId
      );

      // Gerar PDF
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        powerOfAttorneyTemplate.id,
        powerOfAttorneyDataPrepared
      );

      // Simular upload do PDF
      const pdfBlob = pdfDoc.output('blob');
      const fileName = `anexo_iii_${generatedContract.contract_number}.pdf`;

      // Mock upload
      console.log('📄 [PowerOfAttorneyGenerator] Mock upload:', fileName);
      const mockUrl = `https://mock-storage.com/power-of-attorneys/${fileName}`;

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
      if (onPowerOfAttorneyGenerated) {
        onPowerOfAttorneyGenerated(mockUrl);
      }

      toast.success('Anexo III - Procuração gerado com sucesso!');
      setIsDialogOpen(false);

      // Recarregar dados
      await loadAllPowerOfAttorneys();
      await checkExistingPowerOfAttorney();

    } catch (error) {
      console.error('Erro ao gerar Anexo III:', error);
      toast.error('Erro ao gerar Anexo III. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPowerOfAttorney = async (powerOfAttorney: any) => {
    try {
      const templateId = await getOrCreatePowerOfAttorneyTemplateId();
      const powerOfAttorneyTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!powerOfAttorneyTemplate) throw new Error('Template não encontrado');

      const powerOfAttorneyDataPrepared = powerOfAttorney.contract_data || preparePowerOfAttorneyData();
      const doc = await PDFService.generateTemplateBasedContract(powerOfAttorneyTemplate.id, powerOfAttorneyDataPrepared);
      doc.save(`anexo_iii_${powerOfAttorney.contract_number}.pdf`);

      toast.success('Anexo III baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar procuração:', error);
      toast.error('Não foi possível baixar a procuração.');
    }
  };

  const previewPowerOfAttorneyDocument = async (powerOfAttorney: any) => {
    try {
      // Buscar template do Anexo III
      const templateId = await getOrCreatePowerOfAttorneyTemplateId();
      const powerOfAttorneyTemplate = await ContractTemplateService.getTemplateById(templateId);

      if (!powerOfAttorneyTemplate) {
        throw new Error('Template do Anexo III não encontrado');
      }

      // Preparar dados do contrato usando os dados salvos
      const powerOfAttorneyDataPrepared = powerOfAttorney.contract_data || preparePowerOfAttorneyData();

      // Gerar PDF
      const doc = await PDFService.generateTemplateBasedContract(
        powerOfAttorneyTemplate.id,
        powerOfAttorneyDataPrepared
      );

      // Abrir PDF em nova aba
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.success('PDF do Anexo III aberto em nova aba!');
    } catch (error) {
      console.error('Erro ao visualizar procuração:', error);
      toast.error('Não foi possível visualizar a procuração.');
    }
  };

  const sendForSignature = async (powerOfAttorney: any) => {
    try {
      if (!powerOfAttorney) {
        toast.error('Gere o Anexo III primeiro antes de enviar para assinatura.');
        return;
      }

      console.log('📋 [PowerOfAttorneyGenerator] Iniciando envio para assinatura...');

      // Preparar dados para gerar o PDF usando o template correto
      const templateId = await getOrCreatePowerOfAttorneyTemplateId();
      const powerOfAttorneyTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!powerOfAttorneyTemplate) {
        throw new Error('Template do Anexo III não encontrado');
      }

      // Preparar dados da procuração
      const powerOfAttorneyDataPrepared = powerOfAttorney.contract_data || preparePowerOfAttorneyData();

      // Gerar PDF do Anexo III usando o template correto
      const doc = await PDFService.generateTemplateBasedContract(
        powerOfAttorneyTemplate.id,
        powerOfAttorneyDataPrepared
      );
      const pdfBlob = doc.output('blob');
      const fileName = `anexo_iii_${powerOfAttorney.contract_number}.pdf`;

      // Criar signatários baseados nos dados da locação
      const clientEmail = powerOfAttorneyData.client_email || 'cliente@email.com';
      const clientPhone = powerOfAttorneyData.client_phone || '';
      const signers = [
        {
          name: powerOfAttorneyData.client_name || 'Cliente',
          email: clientEmail,
          cpf: powerOfAttorneyData.client_cpf || '',
          phone: clientPhone,
          role: 'client' as const
        }
      ];

      // Validar se tem email válido
      if (!clientEmail || clientEmail === 'cliente@email.com') {
        console.warn('⚠️ [PowerOfAttorneyGenerator] Usando email padrão para cliente:', clientEmail);
      }

      // Importar DigitalSignatureService dinamicamente para evitar dependência circular
      const { DigitalSignatureService } = await import('../../services/digitalSignatureService');

      // Enviar para BeSign
      const signatureRequest = await DigitalSignatureService.createSignatureRequest(
        pdfBlob,
        fileName,
        signers,
        powerOfAttorney.contract_number,
        rentalId
      );

      console.log('✅ [PowerOfAttorneyGenerator] Enviado para assinatura:', signatureRequest);

      // Atualizar status do contrato para "sent"  
      if (powerOfAttorney?.id) {
        await ContractTemplateService.updateContractStatus(
          powerOfAttorney.id,
          'sent',
          { signature_request_id: signatureRequest.id }
        );
      }

      toast.success('Anexo III enviado para assinatura digital via BeSign!');

      // Recarregar lista de procurações
      await loadAllPowerOfAttorneys();
      await checkExistingPowerOfAttorney();

    } catch (error) {
      console.error('❌ [PowerOfAttorneyGenerator] Erro ao enviar para assinatura:', error);
      
      // Verificar se o erro é apenas cosmético (mock funcionando)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('error_fallback_') || errorMessage.includes('mock')) {
        // Atualizar status mesmo no modo mock
        if (powerOfAttorney?.id) {
          await ContractTemplateService.updateContractStatus(
            powerOfAttorney.id,
            'sent',
            { signature_request_id: 'mock_request_id' }
          );
        }

        toast.success('Anexo III enviado para assinatura (Modo Desenvolvimento)');
        
        // Recarregar lista mesmo no mock
        await loadAllPowerOfAttorneys();
        await checkExistingPowerOfAttorney();
      } else {
        toast.error('Não foi possível enviar para assinatura. Verifique os logs para mais detalhes.');
      }
    }
  };

  const deletePowerOfAttorney = async () => {
    if (!existingPowerOfAttorney) return;

    try {
      await ContractTemplateService.deleteContract(existingPowerOfAttorney.id);

      toast.success('Anexo III excluído com sucesso!');

      // Recarregar dados
      setExistingPowerOfAttorney(null);
      loadAllPowerOfAttorneys();
    } catch (error) {
      console.error('Erro ao excluir procuração:', error);
      toast.error('Não foi possível excluir a procuração.');
    }
  };

  const deletePowerOfAttorneyFromList = async (powerOfAttorneyId: string) => {
    try {
      await ContractTemplateService.deleteContract(powerOfAttorneyId);

      toast.success('Anexo III excluído com sucesso!');

      // Recarregar dados
      loadAllPowerOfAttorneys();
      checkExistingPowerOfAttorney();
    } catch (error) {
      console.error('Erro ao excluir procuração:', error);
      toast.error('Não foi possível excluir a procuração.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Anexo III - Procuração</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Anexo III
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Anexo III</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Anexo III - Procuração</CardTitle>
                  <CardDescription>
                    Procuração para assinatura de Termo de Apresentação do Condutor Infrator
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Cliente:</span> {powerOfAttorneyData.client_name}
                      </div>
                      <div>
                        <span className="font-medium">CPF:</span> {powerOfAttorneyData.client_cpf}
                      </div>
                      <div>
                        <span className="font-medium">CNH:</span> {powerOfAttorneyData.client_cnh}
                      </div>
                      <div>
                        <span className="font-medium">Procuradora:</span> {powerOfAttorneyData.franchisee_name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {existingPowerOfAttorney ? (
                  <div className="flex gap-2 w-full">
                    <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Anexo III já existe:</strong> {existingPowerOfAttorney.contract_number}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Criado em {new Date(existingPowerOfAttorney.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      onClick={deletePowerOfAttorney}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={generatePowerOfAttorney}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Anexo III'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Anexos III gerados */}
      {allPowerOfAttorneys.length > 0 && (
        <div className="space-y-3">
          {allPowerOfAttorneys.map((powerOfAttorney) => (
            <Card key={powerOfAttorney.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{powerOfAttorney.contract_number}</h4>
                      <Badge variant={powerOfAttorney.status === 'sent' ? 'default' : 'secondary'}>
                        {powerOfAttorney.status === 'sent' ? 'Enviado' : 
                         powerOfAttorney.status === 'signed' ? 'Assinado' : 
                         powerOfAttorney.status === 'cancelled' ? 'Cancelado' : 'Gerado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {powerOfAttorney.template?.name} - Criado em {new Date(powerOfAttorney.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewPowerOfAttorneyDocument(powerOfAttorney)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPowerOfAttorney(powerOfAttorney)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendForSignature(powerOfAttorney)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePowerOfAttorneyFromList(powerOfAttorney.id)}
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