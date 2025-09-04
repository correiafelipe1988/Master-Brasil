// Script para criar template de contrato de locação
import { createClient } from '@supabase/supabase-js';

// Configurar Supabase (usar as mesmas configurações do projeto)
const supabaseUrl = 'https://your-project-id.supabase.co'; // Será substituído pelos valores do .env
const supabaseKey = 'your-anon-key'; // Será substituído pelos valores do .env

const supabase = createClient(supabaseUrl, supabaseKey);

const rentalContractContent = {
  sections: [
    {
      title: "INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO DE MOTOCICLETA",
      subtitle: "CONVERSÃO EM CESSÃO DE BEM MÓVEL",
      content: ""
    },
    {
      title: "ANEXO I - ABERTURA DE CONTRATO",
      content: `
DADOS DO CONTRATO
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

DADOS DA LOCADORA
{{franchisee_name}}, CNPJ: {{franchisee_cnpj}}. Endereço: {{franchisee_address}}. {{franchisee_city}} - {{franchisee_state}}

DADOS DO LOCATÁRIO
NOME: {{client_name}}
ENDEREÇO: {{client_address_street}}, {{client_address_number}}. {{client_address_city}}. CEP: {{client_address_zip_code}}. - {{client_address_state}}
TELEFONE: {{client_phone}}
CPF: {{client_cpf}}
CNH: {{client_cnh}}
EMAIL: {{client_email}}

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

DADOS DA LOCAÇÃO
N° DE DIÁRIAS: {{total_days}}
VALOR DA DIÁRIA: {{daily_rate}}
VALOR TOTAL: {{total_amount}}
      `
    },
    {
      title: "ANEXO II - MINUTA DE CONTRATO",
      content: `
Pelo presente instrumento ficam estabelecidas as seguintes cláusulas e condições que, em conjunto com o Termo de
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

[Continuar com todas as outras cláusulas...]

{{contract_city}}, {{contract_date}}

___________________________________________
LOCADORA

___________________________________________
LOCATÁRIO

___________________________________________
Testemunha 1
      `
    }
  ]
};

const templateVariables = [
  'contract_number', 'attendant_name', 'monthly_km_limit', 'excess_km_rate',
  'start_date', 'delivery_location', 'payment_frequency', 'end_date',
  'return_location', 'daily_rate', 'franchisee_name', 'franchisee_cnpj',
  'franchisee_address', 'franchisee_city', 'franchisee_state',
  'client_name', 'client_address_street', 'client_address_number',
  'client_address_city', 'client_address_zip_code', 'client_address_state',
  'client_phone', 'client_cpf', 'client_cnh', 'client_email',
  'motorcycle_plate', 'motorcycle_chassi', 'motorcycle_km',
  'motorcycle_brand', 'motorcycle_renavam', 'fuel_level',
  'motorcycle_model', 'motorcycle_year', 'motorcycle_color',
  'total_days', 'total_amount', 'contract_city', 'contract_date'
];

async function createRentalTemplate() {
  try {
    // 1. Buscar ou criar tipo de contrato 'rental'
    let { data: contractTypes, error: typesError } = await supabase
      .from('contract_types')
      .select('*')
      .eq('category', 'rental');

    if (typesError) throw typesError;

    let rentalTypeId;
    if (!contractTypes || contractTypes.length === 0) {
      // Criar tipo de contrato
      const { data: newType, error: createTypeError } = await supabase
        .from('contract_types')
        .insert({
          name: 'Contrato de Locação',
          category: 'rental',
          description: 'Contrato principal de locação de motocicletas'
        })
        .select()
        .single();
      
      if (createTypeError) throw createTypeError;
      rentalTypeId = newType.id;
    } else {
      rentalTypeId = contractTypes[0].id;
    }

    // 2. Verificar se já existe template padrão
    const { data: existingTemplate, error: existingError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('name', 'Contrato de Locação - Principal')
      .eq('is_default', true);

    if (existingError) throw existingError;

    if (existingTemplate && existingTemplate.length > 0) {
      // Atualizar template existente
      const { data: updatedTemplate, error: updateError } = await supabase
        .from('contract_templates')
        .update({
          content: rentalContractContent,
          variables: templateVariables,
          version: '2.0',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemplate[0].id)
        .select()
        .single();

      if (updateError) throw updateError;
      console.log('✅ Template atualizado:', updatedTemplate);
      return updatedTemplate;
    } else {
      // Criar novo template
      const { data: newTemplate, error: createError } = await supabase
        .from('contract_templates')
        .insert({
          contract_type_id: rentalTypeId,
          name: 'Contrato de Locação - Principal',
          version: '1.0',
          title: 'Instrumento Particular de Contrato de Locação de Motocicleta',
          content: rentalContractContent,
          variables: templateVariables,
          is_active: true,
          is_default: true
        })
        .select()
        .single();

      if (createError) throw createError;
      console.log('✅ Novo template criado:', newTemplate);
      return newTemplate;
    }

  } catch (error) {
    console.error('❌ Erro ao criar template:', error);
    throw error;
  }
}

// Executar função
createRentalTemplate()
  .then(() => console.log('Template de contrato de locação criado/atualizado com sucesso!'))
  .catch(console.error);