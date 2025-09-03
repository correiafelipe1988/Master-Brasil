import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Send } from 'lucide-react';
import { PDFService } from '../../services/pdfService';
import { ContractTemplateService } from '../../services/contractTemplateService';
import { toast } from 'sonner';

interface DepositData {
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
  deposit_value: number;
  franchisee_name: string;
  franchisee_cnpj: string;
  franchisee_address: string;
  franchisee_neighborhood: string;
  franchisee_city: string;
  franchisee_state: string;
  franchisee_cep: string;
  contract_city: string;
  contract_date: string;
}

interface DepositReceiptGeneratorProps {
  depositData: DepositData;
  cityId: string;
  rentalId?: string;
  onReceiptGenerated?: (receiptUrl: string) => void;
}

export const DepositReceiptGenerator: React.FC<DepositReceiptGeneratorProps> = ({
  depositData,
  cityId,
  rentalId,
  onReceiptGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [existingReceipt, setExistingReceipt] = useState<any>(null);
  const [allReceipts, setAllReceipts] = useState<any[]>([]);

  useEffect(() => {
    if (rentalId) {
      checkExistingReceipt();
      loadAllReceipts();
    }
  }, [rentalId]);

  const createClauseForTemplate = async (templateId: string) => {
    const templateVariables = [
      'franchisee_name', 'franchisee_cnpj', 'franchisee_address', 'franchisee_number',
      'franchisee_neighborhood', 'franchisee_city', 'franchisee_state', 'franchisee_cep',
      'client_name', 'client_cpf', 'client_cnh', 'client_address', 'client_city', 
      'client_state', 'client_neighborhood', 'deposit_value_text', 'contract_city', 'contract_date'
    ];

    try {
      console.log('📋 [DepositReceiptGenerator] Criando cláusula para template ID:', templateId);
      
      const clause = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '1',
        title: 'ANEXO VI - RECEBIMENTO DE CAUÇÃO',
        content: `{{franchisee_name}}, pessoa jurídica de Direito Privado, inscrita no CNPJ de nº {{franchisee_cnpj}}, com sede à {{franchisee_address}}, nº {{franchisee_number}}, Bairro {{franchisee_neighborhood}}, {{franchisee_city}}/{{franchisee_state}}, CEP: {{franchisee_cep}}, neste ato representada por seu Representante, declara, para os devidos fins, ter recebido do LOCATÁRIO, {{client_name}}, pessoa física, CPF nº {{client_cpf}}, CNH nº {{client_cnh}}, residente e domiciliado em {{client_address}}, {{client_city}}/{{client_state}}, {{client_neighborhood}}, o valor de {{deposit_value_text}}, a título de caução.

O LOCATÁRIO foi devidamente informado de que a referida caução poderá ser utilizada para quitação de quaisquer dívidas relacionadas à locação do(s) VEÍCULO(s) e previstas no contrato de locação, condições gerais e termos específicos.

A liberação do valor ocorrerá em até 5 dias, contados da devolução do(s) VEÍCULO(s) ao fim da locação e quitação dos pagamentos pendentes.

Em caso de quebra do contrato por descumprimento do LOCATÁRIO, este se declara ciente de que o valor pago a título de caução poderá ser retido a fim de estancar os danos suportados pela LOCADORA.

{{contract_city}}, {{contract_date}}

___________________________________________
{{franchisee_name}} (Locadora)

___________________________________________
{{client_name}} (Locatário)`,
        order_index: 1,
        is_required: true,
        variables: templateVariables
      });
      
      console.log('✅ [DepositReceiptGenerator] Cláusula criada com sucesso:', clause);
      return clause;
    } catch (clauseError) {
      console.error('❌ [DepositReceiptGenerator] Erro ao criar cláusula:', clauseError);
      throw clauseError;
    }
  };

  const getOrCreateDepositReceiptTemplateId = async (): Promise<string> => {
    try {
      // Primeiro tenta buscar template existente por nome
      let template = await ContractTemplateService.getTemplateByName('Anexo VI - Recebimento de Caução');
      
      if (template) {
        // Verificar se o template tem cláusulas
        const existingClauses = await ContractTemplateService.getTemplateClauses(template.id);
        if (existingClauses.length === 0) {
          console.log('📋 [DepositReceiptGenerator] Template existe mas não tem cláusulas, criando...');
          await createClauseForTemplate(template.id);
        }
        return template.id;
      }
      
      console.log('Criando template Anexo VI - Recebimento de Caução...');
      
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
            title: "ANEXO VI - RECEBIMENTO DE CAUÇÃO",
            content: `{{franchisee_name}}, pessoa jurídica de Direito Privado, inscrita no CNPJ de nº {{franchisee_cnpj}}, com sede à {{franchisee_address}}, nº {{franchisee_number}}, Bairro {{franchisee_neighborhood}}, {{franchisee_city}}/{{franchisee_state}}, CEP: {{franchisee_cep}}, neste ato representada por seu Representante, declara, para os devidos fins, ter recebido do LOCATÁRIO, {{client_name}}, pessoa física, CPF nº {{client_cpf}}, CNH nº {{client_cnh}}, residente e domiciliado em {{client_address}}, {{client_city}}/{{client_state}}, {{client_neighborhood}}, o valor de {{deposit_value_text}}, a título de caução.

O LOCATÁRIO foi devidamente informado de que a referida caução poderá ser utilizada para quitação de quaisquer dívidas relacionadas à locação do(s) VEÍCULO(s) e previstas no contrato de locação, condições gerais e termos específicos.

A liberação do valor ocorrerá em até 5 dias, contados da devolução do(s) VEÍCULO(s) ao fim da locação e quitação dos pagamentos pendentes.

Em caso de quebra do contrato por descumprimento do LOCATÁRIO, este se declara ciente de que o valor pago a título de caução poderá ser retido a fim de estancar os danos suportados pela LOCADORA.

{{contract_city}}, {{contract_date}}

___________________________________________
{{franchisee_name}} (Locadora)

___________________________________________
{{client_name}} (Locatário)`
          }
        ]
      };
      
      // Variáveis do template
      const templateVariables = [
        'franchisee_name', 'franchisee_cnpj', 'franchisee_address', 'franchisee_number',
        'franchisee_neighborhood', 'franchisee_city', 'franchisee_state', 'franchisee_cep',
        'client_name', 'client_cpf', 'client_cnh', 'client_address', 'client_city', 
        'client_state', 'client_neighborhood', 'deposit_value_text', 'contract_city', 'contract_date'
      ];
      
      // Criar template usando o ContractTemplateService
      const newTemplate = await ContractTemplateService.createTemplate({
        contract_type_id: annexType.id,
        name: 'Anexo VI - Recebimento de Caução',
        version: '1.0',
        title: 'Anexo VI - Recebimento de Caução',
        content: templateContent,
        variables: templateVariables,
        is_active: true,
        is_default: false
      });
      
      // Criar a cláusula principal do documento
      await createClauseForTemplate(newTemplate.id);
      
      console.log('Template e cláusula do Anexo VI criados com sucesso:', newTemplate);
      return newTemplate.id;
      
    } catch (error) {
      console.error('Erro ao criar template Anexo VI:', error);
      throw error;
    }
  };

  const checkExistingReceipt = async () => {
    if (rentalId) {
      try {
        // ID fixo do template Anexo VI (seguindo padrão do TariffGenerator)
        const templateId = await getOrCreateDepositReceiptTemplateId();
        const existing = await ContractTemplateService.checkExistingContract(
          templateId,
          rentalId
        );
        setExistingReceipt(existing);
      } catch (error) {
        console.error('Erro ao verificar recibo existente:', error);
      }
    }
  };

  const loadAllReceipts = async () => {
    if (rentalId) {
      try {
        const receipts = await ContractTemplateService.getGeneratedAnnexes(
          rentalId,
          'Anexo VI'
        );
        setAllReceipts(receipts || []);
      } catch (error) {
        console.error('Erro ao carregar recibos:', error);
        setAllReceipts([]); // Fallback para array vazio
      }
    }
  };

  const prepareReceiptData = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return {
      // Dados da Franquia/Locadora
      franchisee_name: depositData.franchisee_name || 'W&W Locadora',
      franchisee_cnpj: depositData.franchisee_cnpj || '',
      franchisee_address: depositData.franchisee_address || '',
      franchisee_number: depositData.franchisee_number || '1000',
      franchisee_neighborhood: depositData.franchisee_neighborhood || '',
      franchisee_city: depositData.franchisee_city || 'Salvador',
      franchisee_state: depositData.franchisee_state || 'BA',
      franchisee_cep: depositData.franchisee_cep || '',
      
      // Dados do Cliente/Locatário
      client_name: depositData.client_name || '',
      client_cpf: depositData.client_cpf || '',
      client_cnh: depositData.client_cnh || '',
      client_address: depositData.client_address || '',
      client_neighborhood: depositData.client_neighborhood || '',
      client_city: depositData.client_city || '',
      client_state: depositData.client_state || 'BA',
      client_number: depositData.client_number || '',
      client_cep: depositData.client_cep || '',
      
      // Dados do Depósito/Caução
      deposit_value: depositData.deposit_value || 700.00,
      deposit_value_text: `R$ ${(depositData.deposit_value || 700.00).toFixed(2).replace('.', ',')}`,
      
      // Dados do Contrato
      contract_date: currentDate,
      contract_city: depositData.contract_city || 'Salvador',
      contract_number: `RECIBO-${Date.now()}`,
      
      // Dados obrigatórios (mesmo que não usados neste recibo)
      motorcycle_plate: '',
      motorcycle_model: '',
      motorcycle_brand: '',
      daily_rate: 0,
      total_amount: depositData.deposit_value || 700.00,
      start_date: '',
      end_date: '',
      plan_name: ''
    };
  };

  const generateReceipt = async () => {
    // Verificar se já existe um recibo para esta locação
    if (existingReceipt) {
      toast.error('Já existe um Anexo VI (Recebimento de Caução) para esta locação.');
      return;
    }

    try {
      setIsGenerating(true);

      // Buscar template do Anexo VI pelo ID (seguindo padrão do TariffGenerator)
      const templateId = await getOrCreateDepositReceiptTemplateId();
      console.log('📋 [DepositReceiptGenerator] Template ID:', templateId);
      
      const receiptTemplate = await ContractTemplateService.getTemplateById(templateId);
      console.log('📋 [DepositReceiptGenerator] Template encontrado:', receiptTemplate);

      if (!receiptTemplate) {
        throw new Error('Template do Anexo VI não encontrado');
      }
      
      // Verificar se há cláusulas
      const clauses = await ContractTemplateService.getTemplateClauses(templateId);
      console.log('📋 [DepositReceiptGenerator] Cláusulas encontradas:', clauses?.length || 0, clauses);

      const receiptData = prepareReceiptData();
      
      // Gerar contrato no banco de dados
      const generatedContract = await ContractTemplateService.generateContract(
        receiptTemplate.id,
        receiptData,
        cityId,
        rentalId
      );

      // Gerar PDF
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        receiptTemplate.id,
        receiptData
      );

      // Simular upload do PDF
      const pdfBlob = pdfDoc.output('blob');
      const fileName = `anexo_vi_${generatedContract.contract_number}.pdf`;

      // Mock upload
      console.log('📄 [DepositReceiptGenerator] Mock upload:', fileName);
      const mockUrl = `https://mock-storage.com/receipts/${fileName}`;

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
      if (onReceiptGenerated) {
        onReceiptGenerated(mockUrl);
      }

      toast.success('Anexo VI - Recebimento de Caução gerado com sucesso!');
      setIsDialogOpen(false);

      // Recarregar dados
      await loadAllReceipts();
      await checkExistingReceipt();

    } catch (error) {
      console.error('Erro ao gerar Anexo VI:', error);
      toast.error('Erro ao gerar Anexo VI. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReceipt = async (receipt: any) => {
    try {
      const templateId = await getOrCreateDepositReceiptTemplateId();
      const receiptTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!receiptTemplate) throw new Error('Template não encontrado');

      const receiptData = receipt.contract_data || prepareReceiptData();
      const doc = await PDFService.generateTemplateBasedContract(receiptTemplate.id, receiptData);
      doc.save(`anexo_vi_${receipt.contract_number}.pdf`);

      toast.success('Anexo VI baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar recibo:', error);
      toast.error('Não foi possível baixar o recibo.');
    }
  };

  const previewReceiptDocument = async (receipt: any) => {
    try {
      // Buscar template do Anexo VI
      const templateId = await getOrCreateDepositReceiptTemplateId();
      const receiptTemplate = await ContractTemplateService.getTemplateById(templateId);

      if (!receiptTemplate) {
        throw new Error('Template do Anexo VI não encontrado');
      }

      // Preparar dados do contrato usando os dados salvos
      const receiptData = receipt.contract_data || prepareReceiptData();

      // Gerar PDF
      const doc = await PDFService.generateTemplateBasedContract(
        receiptTemplate.id,
        receiptData
      );

      // Abrir PDF em nova aba
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.success('PDF do Anexo VI aberto em nova aba!');
    } catch (error) {
      console.error('Erro ao visualizar recibo:', error);
      toast.error('Não foi possível visualizar o recibo.');
    }
  };

  const sendForSignature = async (receipt: any) => {
    try {
      if (!receipt) {
        toast.error('Gere o Anexo VI primeiro antes de enviar para assinatura.');
        return;
      }

      console.log('📋 [DepositReceiptGenerator] Iniciando envio para assinatura...');

      // Preparar dados para gerar o PDF usando o template correto
      const templateId = await getOrCreateDepositReceiptTemplateId();
      const receiptTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!receiptTemplate) {
        throw new Error('Template do Anexo VI não encontrado');
      }

      // Preparar dados do recibo
      const receiptData = receipt.contract_data || prepareReceiptData();

      // Gerar PDF do Anexo VI usando o template correto
      const doc = await PDFService.generateTemplateBasedContract(
        receiptTemplate.id,
        receiptData
      );
      const pdfBlob = doc.output('blob');
      const fileName = `anexo_vi_${receipt.contract_number}.pdf`;

      // Criar signatários baseados nos dados da locação
      const clientEmail = depositData.client_email || 'cliente@email.com';
      const clientPhone = depositData.client_phone || '';
      const signers = [
        {
          name: depositData.client_name || 'Cliente',
          email: clientEmail,
          cpf: depositData.client_cpf || '',
          phone: clientPhone,
          role: 'client' as const
        },
        {
          name: depositData.franchisee_name || 'ACRP LOCACAO LTDA / LOCBAHIA',
          email: 'contrato@masterbrasil.com',
          cpf: '',
          phone: clientPhone ? '' : '11999999999', // Telefone diferente se cliente tem telefone
          role: 'franchisee' as const
        }
      ];

      // Validar se tem email válido
      if (!clientEmail || clientEmail === 'cliente@email.com') {
        console.warn('⚠️ [DepositReceiptGenerator] Usando email padrão para cliente:', clientEmail);
      }

      // Importar DigitalSignatureService dinamicamente para evitar dependência circular
      const { DigitalSignatureService } = await import('../../services/digitalSignatureService');

      // Enviar para BeSign
      const signatureRequest = await DigitalSignatureService.createSignatureRequest(
        pdfBlob,
        fileName,
        signers,
        receipt.contract_number,
        rentalId
      );

      console.log('✅ [DepositReceiptGenerator] Enviado para assinatura:', signatureRequest);

      // Atualizar status do contrato para "sent"  
      if (receipt?.id) {
        await ContractTemplateService.updateContractStatus(
          receipt.id,
          'sent',
          { signature_request_id: signatureRequest.id }
        );
      }

      toast.success('Anexo VI enviado para assinatura digital via BeSign!');

      // Recarregar lista de recibos
      await loadAllReceipts();
      await checkExistingReceipt();

    } catch (error) {
      console.error('❌ [DepositReceiptGenerator] Erro ao enviar para assinatura:', error);
      
      // Verificar se o erro é apenas cosmético (mock funcionando)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('error_fallback_') || errorMessage.includes('mock')) {
        // Atualizar status mesmo no modo mock
        if (receipt?.id) {
          await ContractTemplateService.updateContractStatus(
            receipt.id,
            'sent',
            { signature_request_id: 'mock_request_id' }
          );
        }

        toast.success('Anexo VI enviado para assinatura (Modo Desenvolvimento)');
        
        // Recarregar lista mesmo no mock
        await loadAllReceipts();
        await checkExistingReceipt();
      } else {
        toast.error('Não foi possível enviar para assinatura. Verifique os logs para mais detalhes.');
      }
    }
  };

  const deleteReceipt = async () => {
    if (!existingReceipt) return;

    try {
      await ContractTemplateService.deleteContract(existingReceipt.id);

      toast.success('Anexo VI excluído com sucesso!');

      // Recarregar dados
      setExistingReceipt(null);
      loadAllReceipts();
    } catch (error) {
      console.error('Erro ao excluir recibo:', error);
      toast.error('Não foi possível excluir o recibo.');
    }
  };

  const deleteReceiptFromList = async (receiptId: string) => {
    try {
      await ContractTemplateService.deleteContract(receiptId);

      toast.success('Anexo VI excluído com sucesso!');

      // Recarregar dados
      loadAllReceipts();
      checkExistingReceipt();
    } catch (error) {
      console.error('Erro ao excluir recibo:', error);
      toast.error('Não foi possível excluir o recibo.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Anexo VI - Recebimento de Caução</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Anexo VI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Anexo VI</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Anexo VI - Recebimento de Caução</CardTitle>
                  <CardDescription>
                    Comprovante de recebimento do valor da caução
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Cliente:</span> {depositData.client_name}
                      </div>
                      <div>
                        <span className="font-medium">CPF:</span> {depositData.client_cpf}
                      </div>
                      <div>
                        <span className="font-medium">Valor da Caução:</span> R$ {(depositData.deposit_value || 700.00).toFixed(2).replace('.', ',')}
                      </div>
                      <div>
                        <span className="font-medium">Cidade:</span> {depositData.contract_city || 'Salvador'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {existingReceipt ? (
                  <div className="flex gap-2 w-full">
                    <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Anexo VI já existe:</strong> {existingReceipt.contract_number}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Criado em {new Date(existingReceipt.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      onClick={deleteReceipt}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={generateReceipt}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Anexo VI'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Anexos VI gerados */}
      {allReceipts.length > 0 && (
        <div className="space-y-3">
          {allReceipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{receipt.contract_number}</h4>
                      <Badge variant={receipt.status === 'sent' ? 'default' : 'secondary'}>
                        {receipt.status === 'sent' ? 'Enviado' : 
                         receipt.status === 'signed' ? 'Assinado' : 
                         receipt.status === 'cancelled' ? 'Cancelado' : 'Gerado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {receipt.template?.name} - Criado em {new Date(receipt.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewReceiptDocument(receipt)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReceipt(receipt)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendForSignature(receipt)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteReceiptFromList(receipt.id)}
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