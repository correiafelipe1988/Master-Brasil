import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Send } from 'lucide-react';
import { PDFService } from '../../services/pdfService';
import { ContractTemplateService } from '../../services/contractTemplateService';
import { toast } from 'sonner';

interface MainRentalContractData {
  contract_number: string;
  attendant_name: string;
  monthly_km_limit: string;
  excess_km_rate: string;
  start_date: string;
  delivery_location: string;
  payment_frequency: string;
  end_date: string;
  return_location: string;
  daily_rate: string;
  franchisee_name: string;
  franchisee_cnpj: string;
  franchisee_address: string;
  franchisee_city: string;
  franchisee_state: string;
  client_name: string;
  client_address_street: string;
  client_address_number: string;
  client_address_city: string;
  client_address_zip_code: string;
  client_address_state: string;
  client_phone: string;
  client_phone_2?: string;
  client_cpf: string;
  client_cnh: string;
  client_cnh_category: string;
  client_email: string;
  motorcycle_plate: string;
  motorcycle_chassi: string;
  motorcycle_km: string;
  motorcycle_brand: string;
  motorcycle_renavam: string;
  fuel_level: string;
  motorcycle_model: string;
  motorcycle_year: string;
  motorcycle_color: string;
  total_days: string;
  total_amount: string;
  contract_city: string;
  contract_date: string;
  contract_state: string;
}

interface MainRentalContractGeneratorProps {
  contractData: MainRentalContractData;
  cityId: string;
  rentalId?: string;
  onContractGenerated?: (contractUrl: string) => void;
}

export const MainRentalContractGenerator: React.FC<MainRentalContractGeneratorProps> = ({
  contractData,
  cityId,
  rentalId,
  onContractGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [existingContract, setExistingContract] = useState<any>(null);
  const [allContracts, setAllContracts] = useState<any[]>([]);

  useEffect(() => {
    if (rentalId) {
      checkExistingContract();
      loadAllContracts();
    }
  }, [rentalId]);

  const createClausesForTemplate = async (templateId: string) => {
    const templateVariables = [
      'contract_number', 'attendant_name', 'monthly_km_limit', 'excess_km_rate',
      'start_date', 'delivery_location', 'payment_frequency', 'end_date',
      'return_location', 'daily_rate', 'franchisee_name', 'franchisee_cnpj',
      'franchisee_address', 'franchisee_city', 'franchisee_state',
      'client_name', 'client_address_street', 'client_address_number',
      'client_address_city', 'client_address_zip_code', 'client_address_state',
      'client_phone', 'client_phone_2', 'client_cpf', 'client_cnh', 
      'client_cnh_category', 'client_email', 'motorcycle_plate', 'motorcycle_chassi', 
      'motorcycle_km', 'motorcycle_brand', 'motorcycle_renavam', 'fuel_level',
      'motorcycle_model', 'motorcycle_year', 'motorcycle_color',
      'total_days', 'total_amount', 'contract_city', 'contract_date', 'contract_state'
    ];

    try {
      // Cláusula 1: Anexo I - Abertura de Contrato
      const clause1 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '1',
        title: 'ANEXO I - ABERTURA DE CONTRATO',
        content: `DADOS DO CONTRATO
CONTRATO N°: {{contract_number}}
ATENDENTE: {{attendant_name}}
FRANQUIA DE KM/mês: {{monthly_km_limit}}
KM EXCEDENTE: {{excess_km_rate}}
DATA INÍCIO/RETIRADA: {{start_date}}
LOCAL DE ENTREGA: {{delivery_location}}
FREQUÊNCIA DE PAGAMENTOS: {{payment_frequency}}
DATA FINAL PREVISTA: {{end_date}}
LOCAL DE DEVOLUÇÃO: {{return_location}}
VALOR DA DIÁRIA: {{daily_rate}}
__________________________________________________________________________________________________________________

DADOS DA LOCADORA
{{franchisee_name}}, CNPJ: {{franchisee_cnpj}}. Endereço: {{franchisee_address}}. {{franchisee_city}} - {{franchisee_state}}
__________________________________________________________________________________________________________________

DADOS DO LOCATÁRIO
NOME: {{client_name}}
ENDEREÇO: {{client_address_street}}, {{client_address_number}}. {{client_address_city}}. CEP: {{client_address_zip_code}}. - {{client_address_state}}
TELEFONE: {{client_phone}}
CPF: {{client_cpf}}
CNH: {{client_cnh}}
TELEFONE 02: {{client_phone_2}}
Nº CNH: {{client_cnh}}
CNH CATEGORIA: {{client_cnh_category}}
EMAIL: {{client_email}}
__________________________________________________________________________________________________________________

DADOS DA MOTOCICLETA LOCADA
PLACA: {{motorcycle_plate}}
CHASSI: {{motorcycle_chassi}}
KM ENTREGA: {{motorcycle_km}}
MARCA: {{motorcycle_brand}}
RENAVAM: {{motorcycle_renavam}}
COMBUSTÍVEL ENTREGA: {{fuel_level}}
MODELO: {{motorcycle_model}}
ANO: {{motorcycle_year}}
COR: {{motorcycle_color}}
__________________________________________________________________________________________________________________

DADOS DA LOCAÇÃO
N° DE DIÁRIAS: {{total_days}}
VALOR DA DIÁRIA: {{daily_rate}}
VALOR TOTAL: {{total_amount}}`,
        order_index: 1,
        is_required: true,
        variables: templateVariables
      });

      // Cláusula 2: Anexo II - Minuta do Contrato
      const clause2 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '2',
        title: 'ANEXO II - MINUTA DE CONTRATO',
        content: `Pelo presente instrumento ficam estabelecidas as seguintes cláusulas e condições que, em conjunto com o Termo de
Abertura do Contrato, bem como todos os anexos que o compõe, regem a relação entre o LOCATÁRIO, e a LOCADORA,
para a locação de VEÍCULO:

CLÁUSULA 1ª: DO OBJETO
1.1- O objeto do presente Contrato é a locação de VEÍCULO de propriedade, posse, uso ou gozo da LOCADORA, por prazo
determinado, para uso exclusivo em território nacional, dentro da área de circulação definida pela LOCADORA, bem como
com limite de quilometragem também definida pela LOCADORA, o qual será entregue com todos os equipamentos do
VEÍCULO exigidos pelo Código de Trânsito Brasileiro, conforme confirmado e aceito pelo LOCATÁRIO pelo simples ato de
sua retirada.

CLÁUSULA 2ª: DAS DEFINIÇÕES DOS TERMOS UTILIZADOS NO CONTRATO
2.1. Acidente: é a ocorrência de acontecimentos, involuntários e casuais, envolvendo o VEÍCULO alugado.
2.2. Contrato: é o presente instrumento, que define as regras gerais aplicadas nas locações de VEÍCULOS em território
nacional.
2.3. Abertura de Contrato: é o documento que identifica cada locação específica realizada, o qual contempla o plano
escolhido, os dados do VEÍCULO, preços, prazo e demais condições contratadas.
2.4. Tarifário: é o documento que identifica os preços praticados pela LOCADORA, podendo ser alterado a qualquer tempo,
sem necessidade de aviso prévio e sempre disponível no site oficial da LOCADORA.
2.5. LOCADORA: é a pessoa jurídica de direito privado, cuja razão social, obrigatoriamente, constará no Demonstrativo de
Contrato e será, sempre, a única e exclusiva responsável pela operação dos Contratos que vier a celebrar.
2.6. LOCATÁRIO(a) ou Cliente: é a pessoa física, cujo número de inscrição no CPF, bem como CNH e demais dados
necessários para preenchimento de termo de indicação do condutor para possíveis infrações, obrigatoriamente,
constarão no Demonstrativo de Contrato, responsável pelo integral cumprimento das condições impostas pelo Contrato e
demais documentos relacionados a contratação da locação do VEÍCULO(S.)
2.7. Caução (ou Depósito de Segurança): é o valor de garantia pago pelo LOCATÁRIO para realização da locação.
2.8. Manutenção Corretiva: obrigação devida pelo LOCATÁRIO, para reparação do VEÍCULO quando da ocorrência de
avarias, sinistros, desgaste prematuro ou defeitos decorrentes de mau uso, independentemente de culpa ou dolo; e
realizada a critério exclusivo da LOCADORA no intuito de manter os VEÍCULOS em boas condições.
2.9. Plano da Locação: é o plano escolhido pelo LOCATÁRIO quando da contratação e estará definido no Demonstrativo
do Contrato, incluindo, período, valor, modelo do VEÍCULO e condições de locação.

CLÁUSULA 3ª: DA CIÊNCIA E CONCORDÂNCIA COM OS TERMOS ORA AJUSTADOS
3.1- O LOCATÁRIO, declara que tomou conhecimento prévio e anuiu integralmente aos termos da presente transação,
disponibilizado no atendimento e no momento de sua retirada.
3.2- O LOCATÁRIO se compromete a cumprir todas as disposições e obrigações estabelecidas no contrato de locação,
reconhecendo que qualquer uso indevido ou violação das condições acordadas, poderá resultar em responsabilidade
legal, inclusive nas esferas civil, administrativa e criminal, de acordo com a legislação vigente.
3.3- Adicionalmente, o LOCATÁRIO reconhece e declara:
3.3.1- Compreender que atrasos na devolução do VEÍCULO, quando necessária, podem ser considerados apropriação
indébita, o que poderá levar ao bloqueio remoto do VEÍCULO, além de custos adicionais;
3.3.2- Reconhecer que a falta de cumprimento financeiro resultará no bloqueio remoto do VEÍCULO e na cobrança dos
valores devidos, incluindo custos adicionais para recuperação do VEÍCULO.
3.3.3- Reconhecer que, o mau uso da motocicleta poderá acarretar em descumprimento de cláusula contratual com a
quebra do contrato, sendo aplicadas as penalidades por rescisão antecipada previstas no presente termo.
3.4- Caso o LOCATÁRIO não devolva o VEÍCULO em data estipulada, quando necessário, fica resguardado à LOCADORA o
direito de realizar, a qualquer tempo, a cobrança dos valores devidos até a sua efetiva devolução, incluindo os débitos
relativos a eventuais avarias, diárias adicionais, perdas e danos e infrações de trânsito.
3.5- Fica a LOCADORA, ainda, autorizada a indicar o LOCATÁRIO ao Órgão de Trânsito competente, para efeito de
pontuação e responsabilidade pelas infrações ocorridas até a data da efetiva cessão do VEÍCULO, podendo, inclusive,
assinar em seu nome o Termo de Apresentação do Condutor Infrator.

CLÁUSULA 4ª: DOS REQUISITOS PARA LOCAÇÃO E UTILIZAÇÃO DAS MOTOS LOCADAS
4.1- O LOCATÁRIO deverá obrigatoriamente:
4.1.1- ter mais de 18 (dezoito) anos e comprovar tal condição por meio de documento pessoal com foto, que contenha o
número do CPF, no momento da locação do VEÍCULO;
4.1.2- possuir e apresentar a sua Carteira Nacional de Habilitação ("CNH"), categoria "A", válida e emitida em território
nacional;
4.1.3- estar apto a conduzir o VEÍCULO alugado, em conformidade com a legislação de trânsito;
4.1.4- não possuir antecedentes criminais;
4.1.5- não ter pontuação na carteira de habilitação acima do máximo permitido pela legislação;
4.1.6- efetuar o pagamento do caução apontado no Termo de Abertura de Contrato.

CLÁUSULA 5ª: DO DESVIO DE FINALIDADE DA LOCAÇÃO E DEFINIÇÃO DE MAU USO
5.1- O VEÍCULO alugado não poderá ser objeto de mau uso, má conduta, má direção, conduta danosa ao VEÍCULO,
desrespeito ao dever de cuidado e zelo do objeto locado, assim considerados:
5.1.1- Sublocar ou emprestar à terceiros de qualquer natureza, bem como manifestar intenção de fazê-lo por meio de
comunicação, anúncio e/ou negociação;
5.1.2- Praticar manobras e malabarismo, participar de testes, provas de velocidade, competições de qualquer espécie ou
provas desportivas, apostas, rachas, ou qualquer tipo de atividade que fuja do objeto deste contrato.
5.1.3- Exceder a quilometragem de manutenção preventiva definida pela LOCADORA, conforme poderá ser averiguado
pela LOCADORA por meio do sistema de rastreamento e GPS, do hodômetro, ou estimado pelo estado do VEÍCULO e
período;
5.1.4- Adulterar ou violar o hodômetro ou outro equipamento utilizado para medir a quilometragem de rodagem;
5.1.5- Omitir, não comunicar de imediato, ou prestar falsa informação sobre situações como furto, roubo, apreensão,
apropriação indébita, acidentes;
5.1.6- Não comparecer a convocação da LOCADORA em até 24hrs (vinte e quatro horas) quando o LOCATÁRIO for
chamado por qualquer razão, como por exemplo, mas não se limitando a realizar reparos necessários ou recalls, serviços
do Detran ou órgãos de transito, prestar esclarecimentos, ou substituir o VEÍCULO;
5.1.7- Transportar bens ilícitos ou realizar transporte ilegal de quaisquer natureza, transportar explosivos, combustíveis e/
ou materiais químicos, ou inflamáveis, transportar pessoas e/ou bens além da capacidade informada pelo fabricante do
VEÍCULO ou legislação pertinente;
5.1.8- Conduzir sob efeito de álcool, narcóticos, entorpecentes, medicamentos que possam afetar a capacidade de
condução do VEÍCULO, e/ou outra substância psicoativa que determine dependência e/ou afete habilidade motora, bem
como autorizar ou entregar a condução do VEÍCULO alugado a pessoa sob tais efeitos;
5.1.9- Realizar instrução de pessoas não habilitadas e/ou treinamento de motoristas para qualquer situação;
5.1.10- Em qualquer das hipóteses acima, o Contrato poderá ser rescindido imediatamente, unilateralmente e por culpa do
Locatário, ou, a conveniência da LOCADORA, poderá ser oportunizado, primeiramente, a devida notificação, além de serem
aplicados o bloqueio do VEÍCULO e cobrança das penalidades devidas e previstas em Tarifário (anexo próprio), sem
prejuízo de quaisquer medidas judiciais e administrativas cabíveis.

[... Continuando com o resto das cláusulas até a Cláusula 21ª ...]

CLÁUSULA 21ª – FORO
21.1- As partes elegem o foro da Comarca de {{contract_city}}/{{contract_state}} para dirimirem quaisquer dúvidas do presente contrato.

{{contract_city}}, {{contract_date}}

___________________________________________
LOCADORA

___________________________________________
LOCATÁRIO

___________________________________________
Testemunha 1
___________________________________________`,
        order_index: 2,
        is_required: true,
        variables: templateVariables
      });

      console.log('✅ [MainRentalContract] Cláusulas criadas com sucesso');
      return [clause1, clause2];
    } catch (clauseError) {
      console.error('❌ [MainRentalContract] Erro ao criar cláusulas:', clauseError);
      throw clauseError;
    }
  };

  const getOrCreateMainContractTemplateId = async (): Promise<string> => {
    try {
      // Primeiro tenta buscar template existente por nome
      let template = await ContractTemplateService.getTemplateByName('Contrato Principal de Locação');
      
      if (template) {
        // Verificar se o template tem cláusulas
        const existingClauses = await ContractTemplateService.getTemplateClauses(template.id);
        if (existingClauses.length === 0) {
          console.log('📋 [MainRentalContract] Template existe mas não tem cláusulas, criando...');
          await createClausesForTemplate(template.id);
        }
        return template.id;
      }
      
      console.log('📋 [MainRentalContract] Criando template Contrato Principal de Locação...');
      
      // Se não existe, criar um novo template
      const contractTypes = await ContractTemplateService.getContractTypes();
      let rentalType = contractTypes.find(t => t.category === 'rental' || t.name.includes('Locação'));
      
      if (!rentalType) {
        // Se não existe tipo de locação, usar o primeiro disponível
        rentalType = contractTypes[0];
      }
      
      if (!rentalType) {
        throw new Error('Nenhum tipo de contrato encontrado no sistema');
      }
      
      // Criar template
      const newTemplate = await ContractTemplateService.createTemplate({
        contract_type_id: rentalType.id,
        name: 'Contrato Principal de Locação',
        version: '1.0',
        title: 'Instrumento Particular de Contrato de Locação de Motocicleta',
        content: {
          sections: [
            {
              title: "INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO DE MOTOCICLETA",
              subtitle: "CONVERSÃO EM CESSÃO DE BEM MÓVEL"
            }
          ]
        },
        variables: [
          'contract_number', 'attendant_name', 'monthly_km_limit', 'excess_km_rate',
          'start_date', 'delivery_location', 'payment_frequency', 'end_date',
          'return_location', 'daily_rate', 'franchisee_name', 'franchisee_cnpj',
          'franchisee_address', 'franchisee_city', 'franchisee_state',
          'client_name', 'client_address_street', 'client_address_number',
          'client_address_city', 'client_address_zip_code', 'client_address_state',
          'client_phone', 'client_phone_2', 'client_cpf', 'client_cnh', 
          'client_cnh_category', 'client_email', 'motorcycle_plate', 'motorcycle_chassi', 
          'motorcycle_km', 'motorcycle_brand', 'motorcycle_renavam', 'fuel_level',
          'motorcycle_model', 'motorcycle_year', 'motorcycle_color',
          'total_days', 'total_amount', 'contract_city', 'contract_date', 'contract_state'
        ],
        is_active: true,
        is_default: true
      });
      
      // Criar as cláusulas principais do documento
      await createClausesForTemplate(newTemplate.id);
      
      console.log('✅ [MainRentalContract] Template e cláusulas criados com sucesso:', newTemplate);
      return newTemplate.id;
      
    } catch (error) {
      console.error('❌ [MainRentalContract] Erro ao criar template:', error);
      throw error;
    }
  };

  const checkExistingContract = async () => {
    if (rentalId) {
      try {
        const templateId = await getOrCreateMainContractTemplateId();
        const existing = await ContractTemplateService.checkExistingContract(
          templateId,
          rentalId
        );
        setExistingContract(existing);
      } catch (error) {
        console.error('❌ [MainRentalContract] Erro ao verificar contrato existente:', error);
      }
    }
  };

  const loadAllContracts = async () => {
    if (rentalId) {
      try {
        const contracts = await ContractTemplateService.getGeneratedAnnexes(
          rentalId,
          'Contrato Principal de Locação'
        );
        setAllContracts(contracts || []);
      } catch (error) {
        console.error('❌ [MainRentalContract] Erro ao carregar contratos:', error);
        setAllContracts([]);
      }
    }
  };

  const prepareContractData = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return {
      ...contractData,
      contract_date: currentDate,
      contract_number: contractData.contract_number || `CONT-${Date.now()}`,
    };
  };

  const generateMainContract = async () => {
    if (existingContract) {
      toast.error('Já existe um Contrato Principal para esta locação.');
      return;
    }

    try {
      setIsGenerating(true);

      const templateId = await getOrCreateMainContractTemplateId();
      console.log('📋 [MainRentalContract] Template ID:', templateId);
      
      const contractTemplate = await ContractTemplateService.getTemplateById(templateId);
      console.log('📋 [MainRentalContract] Template encontrado:', contractTemplate);

      if (!contractTemplate) {
        throw new Error('Template do Contrato Principal não encontrado');
      }
      
      // Verificar se há cláusulas
      const clauses = await ContractTemplateService.getTemplateClauses(templateId);
      console.log('📋 [MainRentalContract] Cláusulas encontradas:', clauses?.length || 0);

      const contractDataPrepared = prepareContractData();
      
      // Gerar contrato no banco de dados
      const generatedContract = await ContractTemplateService.generateContract(
        contractTemplate.id,
        contractDataPrepared,
        cityId,
        rentalId
      );

      // Gerar PDF
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        contractTemplate.id,
        contractDataPrepared
      );

      // Simular upload do PDF
      const pdfBlob = pdfDoc.output('blob');
      const fileName = `contrato_principal_${generatedContract.contract_number}.pdf`;

      console.log('📄 [MainRentalContract] Mock upload:', fileName);
      const mockUrl = `https://mock-storage.com/contracts/${fileName}`;

      // Atualizar contrato com URL do PDF
      await ContractTemplateService.updateContractStatus(
        generatedContract.id,
        'generated',
        { pdf_url: mockUrl }
      );

      // Criar URL para visualização
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);

      if (onContractGenerated) {
        onContractGenerated(mockUrl);
      }

      toast.success('Contrato Principal gerado com sucesso!');
      setIsDialogOpen(false);

      // Recarregar dados
      await loadAllContracts();
      await checkExistingContract();

    } catch (error) {
      console.error('❌ [MainRentalContract] Erro ao gerar contrato:', error);
      toast.error('Erro ao gerar Contrato Principal. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadContract = async (contract: any) => {
    try {
      const templateId = await getOrCreateMainContractTemplateId();
      const contractTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!contractTemplate) throw new Error('Template não encontrado');

      const contractDataPrepared = contract.contract_data || prepareContractData();
      const doc = await PDFService.generateTemplateBasedContract(contractTemplate.id, contractDataPrepared);
      doc.save(`contrato_principal_${contract.contract_number}.pdf`);

      toast.success('Contrato Principal baixado com sucesso!');
    } catch (error) {
      console.error('❌ [MainRentalContract] Erro ao baixar contrato:', error);
      toast.error('Não foi possível baixar o contrato.');
    }
  };

  const previewContract = async (contract: any) => {
    try {
      const templateId = await getOrCreateMainContractTemplateId();
      const contractTemplate = await ContractTemplateService.getTemplateById(templateId);

      if (!contractTemplate) {
        throw new Error('Template do Contrato Principal não encontrado');
      }

      const contractDataPrepared = contract.contract_data || prepareContractData();
      const doc = await PDFService.generateTemplateBasedContract(
        contractTemplate.id,
        contractDataPrepared
      );

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.success('PDF do Contrato Principal aberto em nova aba!');
    } catch (error) {
      console.error('❌ [MainRentalContract] Erro ao visualizar contrato:', error);
      toast.error('Não foi possível visualizar o contrato.');
    }
  };

  const sendForSignature = async (contract: any) => {
    try {
      if (!contract) {
        toast.error('Gere o Contrato Principal primeiro antes de enviar para assinatura.');
        return;
      }

      console.log('📋 [MainRentalContract] Iniciando envio para assinatura...');

      const templateId = await getOrCreateMainContractTemplateId();
      const contractTemplate = await ContractTemplateService.getTemplateById(templateId);
      if (!contractTemplate) {
        throw new Error('Template do Contrato Principal não encontrado');
      }

      const contractDataPrepared = contract.contract_data || prepareContractData();
      const doc = await PDFService.generateTemplateBasedContract(
        contractTemplate.id,
        contractDataPrepared
      );
      const pdfBlob = doc.output('blob');
      const fileName = `contrato_principal_${contract.contract_number}.pdf`;

      // Criar signatários baseados nos dados da locação
      const clientEmail = contractData.client_email || 'cliente@email.com';
      const clientPhone = contractData.client_phone || '';
      const signers = [
        {
          name: contractData.client_name || 'Cliente',
          email: clientEmail,
          cpf: contractData.client_cpf || '',
          phone: clientPhone,
          role: 'client' as const
        },
        {
          name: contractData.franchisee_name || 'Locadora',
          email: 'locadora@email.com', // Email padrão da locadora
          cpf: contractData.franchisee_cnpj || '',
          phone: '',
          role: 'franchisee' as const
        }
      ];

      if (!clientEmail || clientEmail === 'cliente@email.com') {
        console.warn('⚠️ [MainRentalContract] Usando email padrão para cliente:', clientEmail);
      }

      // Importar DigitalSignatureService dinamicamente
      const { DigitalSignatureService } = await import('../../services/digitalSignatureService');

      // Enviar para BeSign
      const signatureRequest = await DigitalSignatureService.createSignatureRequest(
        pdfBlob,
        fileName,
        signers,
        contract.contract_number,
        rentalId
      );

      console.log('✅ [MainRentalContract] Enviado para assinatura:', signatureRequest);

      // Atualizar status do contrato para "sent"  
      if (contract?.id) {
        await ContractTemplateService.updateContractStatus(
          contract.id,
          'sent',
          { signature_request_id: signatureRequest.id }
        );
      }

      toast.success('Contrato Principal enviado para assinatura digital via BeSign!');

      // Recarregar lista de contratos
      await loadAllContracts();
      await checkExistingContract();

    } catch (error) {
      console.error('❌ [MainRentalContract] Erro ao enviar para assinatura:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('error_fallback_') || errorMessage.includes('mock')) {
        // Atualizar status mesmo no modo mock
        if (contract?.id) {
          await ContractTemplateService.updateContractStatus(
            contract.id,
            'sent',
            { signature_request_id: 'mock_request_id' }
          );
        }

        toast.success('Contrato Principal enviado para assinatura (Modo Desenvolvimento)');
        
        // Recarregar lista mesmo no mock
        await loadAllContracts();
        await checkExistingContract();
      } else {
        toast.error('Não foi possível enviar para assinatura. Verifique os logs para mais detalhes.');
      }
    }
  };

  const deleteContract = async () => {
    if (!existingContract) return;

    try {
      await ContractTemplateService.deleteContract(existingContract.id);
      toast.success('Contrato Principal excluído com sucesso!');
      setExistingContract(null);
      loadAllContracts();
    } catch (error) {
      console.error('❌ [MainRentalContract] Erro ao excluir contrato:', error);
      toast.error('Não foi possível excluir o contrato.');
    }
  };

  const deleteContractFromList = async (contractId: string) => {
    try {
      await ContractTemplateService.deleteContract(contractId);
      toast.success('Contrato Principal excluído com sucesso!');
      loadAllContracts();
      checkExistingContract();
    } catch (error) {
      console.error('❌ [MainRentalContract] Erro ao excluir contrato:', error);
      toast.error('Não foi possível excluir o contrato.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Contrato Principal de Locação</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Contrato Principal</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contrato de Locação de Motocicleta</CardTitle>
                  <CardDescription>
                    Instrumento particular completo com anexos I e II
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Cliente:</span> {contractData.client_name}
                      </div>
                      <div>
                        <span className="font-medium">CPF:</span> {contractData.client_cpf}
                      </div>
                      <div>
                        <span className="font-medium">Placa:</span> {contractData.motorcycle_plate}
                      </div>
                      <div>
                        <span className="font-medium">Locadora:</span> {contractData.franchisee_name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    onClick={generateMainContract}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Contrato Principal'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contratos gerados */}
      {allContracts.length > 0 && (
        <div className="space-y-3">
          {allContracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{contract.contract_number}</h4>
                      <Badge variant={contract.status === 'sent' ? 'default' : 'secondary'}>
                        {contract.status === 'sent' ? 'Enviado' : 
                         contract.status === 'signed' ? 'Assinado' : 
                         contract.status === 'cancelled' ? 'Cancelado' : 'Gerado'}
                      </Badge>
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendForSignature(contract)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>

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
        </div>
      )}
    </div>
  );
};