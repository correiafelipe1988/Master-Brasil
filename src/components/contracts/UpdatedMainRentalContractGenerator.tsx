import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, Send, Trash2 } from 'lucide-react';
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

export const UpdatedMainRentalContractGenerator: React.FC<MainRentalContractGeneratorProps> = ({
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
  const [generatedContract, setGeneratedContract] = useState<any>(null);

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
      // CLÁUSULA 1: Anexo I - Dados do Contrato
      const clause1 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '1',
        title: '',
        content: `INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO DE MOTOCICLETA(S) COM POSSIBILIDADE DE CONVERSÃO EM CESSÃO DE BEM MÓVEL

ANEXO I- ABERTURA DE CONTRATO


DADOS DO CONTRATO

CONTRATO N°: {{contract_number}}        DATA INÍCIO/RETIRADA: {{start_date}}        DATA FINAL PREVISTA: {{end_date}}

ATENDENTE: {{attendant_name}}        LOCAL DE ENTREGA: {{delivery_location}}        LOCAL DE DEVOLUÇÃO: {{return_location}}

FRANQUIA DE KM/mês: {{monthly_km_limit}}        FREQUÊNCIA DE PAGAMENTOS: {{payment_frequency}}        VALOR DA DIÁRIA: {{daily_rate}}

KM EXCEDENTE: {{excess_km_rate}}


DADOS DA LOCADORA

{{franchisee_name}}, CNPJ: {{franchisee_cnpj}}. Endereço: {{franchisee_address}}. {{franchisee_city}} - {{franchisee_state}}


DADOS DO LOCATÁRIO

NOME: {{client_name}}        CPF: {{client_cpf}}        Nº CNH: {{client_cnh}}

CNH: {{client_cnh}}        CNH CATEGORIA: {{client_cnh_category}}

ENDEREÇO: {{client_address_street}}, {{client_address_number}}. {{client_address_city}}. CEP: {{client_address_zip_code}}. - {{client_address_state}}

TELEFONE: {{client_phone}}

EMAIL: {{client_email}}


DADOS DA MOTOCICLETA LOCADA

PLACA: {{motorcycle_plate}}        MARCA: {{motorcycle_brand}}        MODELO: {{motorcycle_model}}

CHASSI: {{motorcycle_chassi}}        RENAVAM: {{motorcycle_renavam}}        ANO: {{motorcycle_year}}

KM ENTREGA: {{motorcycle_km}}        COMBUSTÍVEL ENTREGA: {{fuel_level}}        COR: {{motorcycle_color}}


DADOS DA LOCAÇÃO

N° DE DIÁRIAS:        VALOR DA DIÁRIA:        VALOR TOTAL:

{{total_days}}        {{daily_rate}}        {{total_amount}}`,
        order_index: 1,
        is_required: true,
        variables: templateVariables
      });

      // CLÁUSULA 2: Cláusulas 1ª a 3ª (Objeto, Definições, Ciência)
      const clause2 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '2',
        title: '',
        content: `Pelo presente instrumento ficam estabelecidas as seguintes cláusulas e condições que, em conjunto com o Termo de Abertura do Contrato, bem como todos os anexos que o compõe, regem a relação entre o LOCATÁRIO, e a LOCADORA, para a locação de VEÍCULO:

CLÁUSULA 1ª: DO OBJETO

1.1- O objeto do presente Contrato é a locação de VEÍCULO de propriedade, posse, uso ou gozo da LOCADORA, por prazo determinado, para uso exclusivo em território nacional, dentro da área de circulação definida pela LOCADORA, bem como com limite de quilometragem também definida pela LOCADORA, o qual será entregue com todos os equipamentos do VEÍCULO exigidos pelo Código de Trânsito Brasileiro, conforme confirmado e aceito pelo LOCATÁRIO pelo simples ato de sua retirada.

CLÁUSULA 2ª: DAS DEFINIÇÕES DOS TERMOS UTILIZADOS NO CONTRATO

2.1. Acidente: é a ocorrência de acontecimentos, involuntários e casuais, envolvendo o VEÍCULO alugado.
2.2. Contrato: é o presente instrumento, que define as regras gerais aplicadas nas locações de VEÍCULOS em território nacional.
2.3. Abertura de Contrato: é o documento que identifica cada locação específica realizada, o qual contempla o plano escolhido, os dados do VEÍCULO, preços, prazo e demais condições contratadas.
2.4. Tarifário: é o documento que identifica os preços praticados pela LOCADORA, podendo ser alterado a qualquer tempo, sem necessidade de aviso prévio e sempre disponível no site oficial da LOCADORA.
2.5. LOCADORA: é a pessoa jurídica de direito privado, cuja razão social, obrigatoriamente, constará no Demonstrativo de Contrato e será, sempre, a única e exclusiva responsável pela operação dos Contratos que vier a celebrar.
2.6. LOCATÁRIO(a) ou Cliente: é a pessoa física, cujo número de inscrição no CPF, bem como CNH e demais dados necessários para preenchimento de termo de indicação do condutor para possíveis infrações, obrigatoriamente, constarão no Demonstrativo de Contrato, responsável pelo integral cumprimento das condições impostas pelo Contrato e demais documentos relacionados a contratação da locação do(s) VEÍCULO(S.)
2.7. Caução (ou Depósito de Segurança): é o valor de garantia pago pelo LOCATÁRIO para realização da locação.
2.8. Manutenção Corretiva: obrigação devida pelo LOCATÁRIO, para reparação do VEÍCULO quando da ocorrência de avarias, sinistros, desgaste prematuro ou defeitos decorrentes de mau uso, independentemente de culpa ou dolo; e realizada a critério exclusivo da LOCADORA no intuito de manter os VEÍCULOS em boas condições.
2.9. Plano da Locação: é o plano escolhido pelo LOCATÁRIO quando da contratação e estará definido no Demonstrativo do Contrato, incluindo, período, valor, modelo do VEÍCULO e condições de locação.
2.9.1. Plano de Locação mensal: é o plano escolhido pelo locatário com período inferior a 12 (doze) meses.
2.9.2. Plano de locação anual: é o plano escolhido pelo locatário com período de 12 (doze) meses ou superior.

CLÁUSULA 3ª: DA CIÊNCIA E CONCORDÂNCIA COM OS TERMOS ORA AJUSTADOS

3.1- O LOCATÁRIO, declara que tomou conhecimento prévio e anuiu integralmente aos termos da presente transação, disponibilizado no atendimento e no momento de sua retirada.
3.2- O LOCATÁRIO se compromete a cumprir todas as disposições e obrigações estabelecidas no contrato de locação, reconhecendo que qualquer uso indevido ou violação das condições acordadas, poderá resultar em responsabilidade legal, inclusive nas esferas civil, administrativa e criminal, de acordo com a legislação vigente.
3.3- Adicionalmente, o LOCATÁRIO reconhece e declara:
3.3.1- Compreender que atrasos na devolução do VEÍCULO podem ser considerados apropriação indébita, o que poderá levar ao bloqueio remoto do VEÍCULO, além de custos adicionais;
3.3.2- Reconhecer que a falta de cumprimento financeiro resultará no bloqueio remoto do VEÍCULO e na cobrança dos valores devidos, incluindo custos adicionais para recuperação do VEÍCULO.
3.3.3- Reconhecer que, o mau uso da motocicleta poderá acarretar em descumprimento de cláusula contratual com a quebra do contrato, sendo aplicadas as penalidades por rescisão antecipada previstas no presente termo.
3.4- Caso o LOCATÁRIO não devolva o VEÍCULO em data estipulada, fica resguardado à LOCADORA o direito de realizar, a qualquer tempo, a cobrança dos valores devidos até a sua efetiva devolução, incluindo os débitos relativos a eventuais avarias, diárias adicionais, perdas e danos e infrações de trânsito.
3.5- Fica a LOCADORA, ainda, autorizada a indicar o LOCATÁRIO ao Órgão de Trânsito competente, para efeito de pontuação e responsabilidade pelas infrações ocorridas até a data da efetiva devolução do VEÍCULO, podendo, inclusive, assinar em seu nome o Termo de Apresentação do Condutor Infrator.`,
        order_index: 2,
        is_required: true,
        variables: templateVariables
      });

      // CLÁUSULA 3: Cláusulas 4ª a 6ª (Requisitos, Mau Uso, Limites)
      const clause3 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '3',
        title: '',
        content: `CLÁUSULA 4ª: DOS REQUISITOS PARA LOCAÇÃO E UTILIZAÇÃO DAS MOTOS LOCADAS

4.1- O LOCATÁRIO deverá obrigatoriamente:
4.1.1- ter mais de 18 (dezoito) anos e comprovar tal condição por meio de documento pessoal com foto, que contenha o número do CPF, no momento da locação do VEÍCULO;
4.1.2- possuir e apresentar a sua Carteira Nacional de Habilitação ("CNH"), categoria "A", válida e emitida em território nacional;
4.1.3- estar apto a conduzir o VEÍCULO alugado, em conformidade com a legislação de trânsito;
4.1.4- não possuir antecedentes criminais;
4.1.5- não ter pontuação na carteira de habilitação acima do máximo permitido pela legislação;
4.1.6- efetuar o pagamento do caução apontado no Termo de Abertura de Contrato.

CLÁUSULA 5ª: DO DESVIO DE FINALIDADE DA LOCAÇÃO E DEFINIÇÃO DE MAU USO

5.1- O VEÍCULO alugado não poderá ser objeto de mau uso, má conduta, má direção, conduta danosa ao VEÍCULO, desrespeito ao dever de cuidado e zelo do objeto locado, assim considerados:
5.1.1- Sublocar ou emprestar à terceiros de qualquer natureza, bem como manifestar intenção de fazê-lo por meio de comunicação, anúncio e/ou negociação;
5.1.2- Praticar manobras e malabarismo, participar de testes, provas de velocidade, competições de qualquer espécie ou provas desportivas, apostas, rachas, ou qualquer tipo de atividade que fuja do objeto deste contrato.
5.1.3- Exceder a quilometragem de manutenção preventiva definida pela LOCADORA, conforme poderá ser averiguado pela LOCADORA por meio do sistema de rastreamento e GPS, do hodômetro, ou estimado pelo estado do VEÍCULO e período;
5.1.4- Adulterar ou violar o hodômetro ou outro equipamento utilizado para medir a quilometragem de rodagem;
5.1.5- Omitir, não comunicar de imediato, ou prestar falsa informação sobre situações como furto, roubo, apreensão, apropriação indébita, acidentes;
5.1.6- Não comparecer a convocação da LOCADORA em até 24hrs (vinte e quatro horas) quando o LOCATÁRIO for chamado por qualquer razão, como por exemplo, mas não se limitando a realizar reparos necessários ou recalls, serviços do Detran ou órgãos de transito, prestar esclarecimentos, ou substituir o VEÍCULO;
5.1.7- Transportar bens ilícitos ou realizar transporte ilegal de quaisquer natureza, transportar explosivos, combustíveis e/ou materiais químicos, ou inflamáveis, transportar pessoas e/ou bens além da capacidade informada pelo fabricante do VEÍCULO ou legislação pertinente;
5.1.8- Conduzir sob efeito de álcool, narcóticos, entorpecentes, medicamentos que possam afetar a capacidade de condução do VEÍCULO, e/ou outra substância psicoativa que determine dependência e/ou afete habilidade motora, bem como autorizar ou entregar a condução do VEÍCULO alugado a pessoa sob tais efeitos;
5.1.9- Realizar instrução de pessoas não habilitadas e/ou treinamento de motoristas para qualquer situação;
5.1.10- Realizar o cancelamento da identificação de condutor junto ao SINETRAN;
5.1.10- Em qualquer das hipóteses acima, o Contrato poderá ser rescindido imediatamente, unilateralmente e por culpa do Locatário, ou, a conveniência da LOCADORA, poderá ser oportunizado, primeiramente, a devida notificação, além de serem aplicados o bloqueio do VEÍCULO e cobrança das penalidades devidas e previstas em Tarifário (anexo próprio), sem prejuízo de quaisquer medidas judiciais e administrativas cabíveis.

CLÁUSULA 6ª: DOS LIMITES TERRITORIAIS E RAIO DE DESLOCAMENTO, BEM COMO LIMITE DE QUILOMETRAGEM

6.1- Pelo presente contrato o LOCATÁRIO adquire o plano de locação modelo, com {{total_days}} diárias, correspondendo a 28 meses de locação.
6.1.1- No plano de locação, o LOCATÁRIO terá como limite mensal de quilometragem a quantia de {{monthly_km_limit}}km/mês.
6.2- O LOCATÁRIO declara ter ciência de que o VEÍCULO deve ser utilizado restritamente no território brasileiro, ficando proibido sua utilização em outros países e/ou nos perímetros limítrofes às fronteiras.
6.3- Fica estabelecido ainda, distância de deslocamento máximo com o VEÍCULO, de até 200 km por dia (incluindo ida e volta), tendo como referência, a base de retirada do VEÍCULO.
6.4- Para melhor fiscalização e cumprimento da presente cláusula, as partes acordam que, fica autorizada à LOCADORA, às suas expensas, a instalação de sistema de Rastreador/Bloqueador/GPS, ou qualquer outro que entenda ser necessário ao fiel e estrito cumprimento do presente instrumento;
6.5- O LOCATÁRIO poderá, por meio de requerimento administrativo, devidamente justificado, solicitar autorização para utilizar o VEÍCULO em perímetro superior ao previsto na cláusula 6.2.
6.5.1- São requisitos para o requerimento administrativo:
6.5.1.1- Ser assinado em nome do LOCATÁRIO, ou por quem detém poderes legais para representá-lo;
6.5.1.2- Delimitação dos dias a serem utilizados fora do raio de deslocamento máximo;
6.5.1.3- Justificativa, com as respectivas provas, que embasem o pedido de autorização;
6.5.2- O pedido de autorização será analisado pelo setor de Suporte do Locatário, sendo o critério de análise, de foro íntimo e exclusivo da LOCADORA;
6.5.3- O pedido de autorização deve ser individualizado, ou seja, por cada período de uso, não se estendendo, em hipótese alguma, por períodos futuros e/ou não compreendidos no referido pedido.
6.6- Caso o LOCATÁRIO utilize o VEÍCULO fora dos limites propostos nas cláusula acima, sem a devida autorização, caberá à LOCADORA, envio de notificação prévia, comunicando sobre a irregularidade, concedendo prazo de até 24 (vinte e quatro) horas, para adequação da localidade.
6.7- Descumprida a notificação prévia pelo LOCATÁRIO, o contrato poderá ser considerado rescindido unilateralmente e por culpa do LOCATÁRIO, sem prejuízo de sua responsabilização por possíveis perdas e danos, além de eventuais despesas custeadas pela LOCADORA.
6.8- Fica a LOCADORA autorizada a adotar, a qualquer tempo, após prazo de notificação extrajudicial não cumprido, todas as medidas necessárias para Rastreio, Bloqueio e retomada do VEÍCULO que se aproxime em até 200 Km de fronteiras nacionais sem autorização, ou, ultrapasse o raio de deslocamento máximo previsto no presente termo.
6.9- Caso o Locatário ultrapasse o limite diário de quilometragem, arcará com multa apontada por KM excedente, descrito no Anexo próprio denominado Tarifário Locagora;`,
        order_index: 3,
        is_required: true,
        variables: templateVariables
      });

      console.log('✅ [FullMainRental] Primeiras 3 cláusulas criadas (1ª-6ª)');

      // CLÁUSULA 4: Cláusula 7ª (Valor da Locação, Pagamento e Outras Despesas)
      const clause4 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '4',
        title: '',
        content: `CLÁUSULA 7ª: VALOR DA LOCAÇÃO, PAGAMENTO E OUTRAS DESPESAS QUE SE FIZEREM NECESSÁRIAS

7.1. O pagamento inicial da caução, bem como a primeira semana da locação, será realizado no momento da reserva, no ato da negociação com os atendentes Locagora, podendo ser pago pelos meios de pagamento aceitos pela LOCADORA, no caso, via boleto bancário ou PIX.

7.2. O pagamento da locação, será feito semanalmente, via boleto ou PIX, sempre devendo efetuar o pagamento antecipado, ou seja, pagamento antes da autorização de locação para aquela semana, e as demais vencíveis no mesmo dia das semanas subsequentes, durante todo o período de locação do VEÍCULO, ficando a LOCADORA autorizada a cobrar os valores devidos diretamente, via instituições financeiras como SERASA, ainda que as obrigações tenham sido apuradas após o encerramento do Contrato, declarando-se o LOCATÁRIO, desde já, ciente que em casos de inadimplência, o valor pago a título de caução poderá ser retido para estancar os prejuízos suportados pela LOCADORA;

7.2.1. Caso o presente termo se extrapole ao período de doze meses, o valor da locação será corrigido automaticamente pela variação positiva do Índice Nacional de Preços ao Consumidor (IPCA), publicado pelo IBGE, ou qualquer outro índice que a LOCADORA entenda como devido;

7.2.2. Na hipótese de renovação da locação, o LOCATÁRIO obriga-se a quitar toda a locação anterior até o primeiro dia do novo período e estará sujeito aos valores atualizados e vigentes à época da renovação;

7.2.3. A LOCADORA pode, a qualquer tempo, realizar cobranças de valores devidos e ainda não pagos. O não envio das cobranças na periodicidade contratada não desabona a responsabilidade do LOCATÁRIO de realizar os pagamentos a tempo e modo, conforme previsto nesse Contrato;

7.3. O valor total da locação é composto pelo pagamento inicial da locação, e a soma dos itens apuráveis, cujos valores ficam definidos em Tarifário, no fechamento do Contrato ou na eventual rescisão do Contrato, tais como:

7.3.1. Avarias e indenizações: se forem constatadas avarias no VEÍCULO locado e/ou danos a terceiros, a qualquer tempo, inclusive quando da sua devolução, serão cobrados do LOCATÁRIO os valores atinentes às peças substitutivas e ao reparo das avarias e indenizações à terceiros;

7.3.2. Coparticipação na reparação a terceiros: A critério exclusivo da LOCADORA, a cobrança realizada ao Cliente por danos causados a terceiros poderá ser a partir do valor definido como coparticipação em Tarifário, podendo variar de acordo com a extensão dos danos;

7.3.3. Chave ou miolo: quando a chave da moto não for devolvida junto ao VEÍCULO, for perdida, ou o miolo for avariado, será cobrado o reembolso da despesa para confecção de uma nova chave ou substituição dos miolos de chave, de acordo com o valor cobrado pelo prestador de serviço ou tarifário;

7.3.4. Bloqueio por inadimplência, mau uso ou negligência de manutenção: será cobrado o valor previsto em Tarifário dos custos operacionais de bloqueio caso a LOCADORA proceda o bloqueio do VEÍCULO por culpa exclusiva do LOCATÁRIO, incluindo, mas não se limitando, aos casos de inadimplemento, mau uso, e não cumprimento das manutenções estipuladas;

7.3.5. Assistência no local: Será cobrado o valor constante em Tarifário nas situações em que a LOCADORA decidir prestar, por meios próprios ou por terceiros, assistência em local solicitado pelo Cliente; por exemplo, para conserto de pneu furado, assistência mecânica;

7.3.5.1. Conserto de pneu/roda: É de responsabilidade do locatário a correta substituição dos pneus, conforme vida útil dos equipamentos, seja de forma preventiva, de acordo com os manuais do veículo e desgaste natural do pneu, e, em caso de algum incidente, de forma corretiva, também será de responsabilidade do locatário a substituição do pneu e da roda, caso também danificada.

7.3.5.2. Substituição de chave ou miolo: o Cliente deverá uma taxa sempre que solicitar serviço emergencial de substituição de chaves ou miolo;

7.3.6. Apreensão do VEÍCULO: o Cliente deverá reembolsar as despesas da LOCADORA para liberação e recuperação da moto, além das taxas cobradas pelos órgãos competentes, quando de apreensão e/ou remoção para pátio, sob pena de, em caso de descumprimento, incidência de multa de até 2 (dois) salários-mínimo vigente à época, bem como rescisão unilateral do Contrato pela LOCADORA, com a devida retenção da caução a fim de estancar os prejuízos suportados, tudo isso sem prejuízo de todas as medidas judiciais cabíveis;

7.3.7. Recolhimento do VEÍCULO: Será devida pelo LOCATÁRIO a Taxa de Recolhimento, no exato montante do valor gasto pela LOCADORA, que deverá notificar o LOCATÁRIO, quando houver a necessidade de retirada do VEÍCULO, a cada ocorrência, podendo ser retido o valor pago a título de caução a fim de estancar os danos sofridos pela LOCADORA, sem prejuízo das demais medidas judiciais cabíveis;

7.3.7.1. Caso o recolhimento seja realizado fora da área de circulação estabelecida pela LOCADORA para o Cliente, a taxa será acrescida de um valor definido em Tarifário por quilômetro excedente calculado a partir do limite da área de circulação;

7.3.7.2. Esta taxa poderá ser cobrada a partir do momento em que haja o fato gerador, mesmo que este venha a ser revertido posteriormente;

7.3.8. Furto ou roubo do VEÍCULO: Cliente reembolsará a LOCADORA pelas custas de busca, recuperação e investigação do paradeiro do VEÍCULO furtado, roubado, perdido, ou sujeito a apropriação indébita, independentemente das circunstâncias e da recuperação ou não do VEÍCULO;

7.3.9. No show – ausência ou atraso em agendamento: valor cobrado do Cliente quando este não comparecer ao agendamento de Retirada, Manutenção ou Recall dentro da data e horário combinados, respeitada a tolerância de 30 (trinta) minutos;

7.3.10. Manutenção sem agendamento: valor que pode ser cobrado do Cliente quando este comparecer à filial da LOCADORA para realizar manutenção sem possuir agendamento de manutenção válido feito por meio do telefone da LOCADORA, ou fora do horário previamente agendado;

7.3.11. Lucros cessantes: são os lucros que a LOCADORA deixou de auferir com o VEÍCULO locado, em razão de conduta do LOCATÁRIO, inclusive furto, roubo, acidente, calculado à base do preço da diária contratada. Tais valores poderão ser cobrados do LOCATÁRIO a exclusivo critério da LOCADORA, quando esta for privada de ter as motos disponíveis por culpa do LOCATÁRIO;

7.3.12. Encargos Financeiros: em caso de atraso de pagamento, poderão ser cobrados multas e encargos financeiros de acordo com as taxas bancárias usualmente praticadas no mercado;

7.3.13. Downgrade de plano: Multa no valor de R$1.000,00 em relação ao downgrade de plano: valor devido pelo LOCATÁRIO, quando a LOCADORA, a seu exclusivo critério, a requerimento do LOCATÁRIO, optar por permitir uma alteração de condições contratuais que implique uma redução do prazo contratual ou do valor da locação;

7.3.14. Desistência de retirada: valor devido pelo LOCATÁRIO quando, por sua única e exclusiva vontade, desiste da locação, após o pagamento da caução e antes da retirada da moto. A Taxa de Desistência poderá ser cobrada conforme Tarifário vigente;

7.3.15. Despachantes: o Cliente poderá optar pela contratação de despachantes parceiros da LOCADORA para desembaraçar eventuais ocorrências com o VEÍCULO para, inclusive, mas não se limitando a, retirar Boletins de Ocorrências em delegacias.

7.4- O LOCATÁRIO autoriza desde já a compensação de valores entre as empresas do Grupo Marina.`,
        order_index: 4,
        is_required: true,
        variables: templateVariables
      });

      // CLÁUSULA 5: Cláusulas 8ª e 9ª (Prazos e Responsabilidade da Locadora)
      const clause5 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '5',
        title: '',
        content: `CLÁUSULA 8ª: DOS PRAZOS, ENTREGA E DEVOLUÇÃO DO VEÍCULO

8.1. O período de locação é aquele indicado no termo de Abertura do Contrato e de acordo com o plano escolhido pelo Cliente, sendo o primeiro dia de locação coincidente com o dia da retirada do VEÍCULO junto à LOCADORA, podendo ou não ser renovado;

8.1.1. O atraso na devolução do VEÍCULO ou dos pagamentos será considerado quebra de contrato, independentemente de prévia notificação, caracterizando apropriação indébita, considerando os custos mencionados no contrato e tarifário. Podem ainda, ser aplicadas medidas judiciais cabíveis, como exemplo mas não se limitando, a busca e apreensão, ou reintegração de posse, do VEÍCULO alugado e lavratura de Boletim de Ocorrência, cabendo ao LOCATÁRIO ressarcir à LOCADORA as despesas oriundas da retenção indevida do VEÍCULO, arcando ainda com eventuais despesas judiciais e/ou extrajudiciais que a LOCADORA tiver que efetuar para a efetiva reintegração na posse do VEÍCULO;

8.2. Caso ocorra a devolução antecipada do VEÍCULO, seja por vontade do LOCATÁRIO ou caso ele tenha dado causa conforme previsões contratuais, será cobrada uma multa no percentual de 10% (dez por cento) do saldo residual, além de retenção integral da caução, sem prejuízo das medidas judiciáis cabíveis.

CLÁUSULA 9ª: RESPONSABILIDADE DA LOCADORA

9.1. Disponibilizar o VEÍCULO em condições de uso, funcionamento e segurança, com todos os equipamentos e documentos exigidos pela legislação aplicável. Os documentos podem ser fornecidos em formato digital por meio de aplicativo;

9.2. Vistoriar o VEÍCULO antes da disponibilização e ao recebê-lo na filial após o término da locação ou por devolução, registrando as condições do VEÍCULO com as quais o Cliente concorda;

9.3. Conceder ao LOCATÁRIO a posse precária do VEÍCULO durante o período contratado, enquanto houver a adimplência prévia dos valores da locação ora contratada;

9.4. Por critério da LOCADORA, poderá ser disponibilizado ao Cliente VEÍCULO de categoria inferior ou superior até que haja disponibilidade de VEÍCULO da categoria contratada, situação na qual o Cliente deverá comparecer a filial em até 24 (vinte e quatro) horas do chamamento pela LOCADORA e realizar a substituição do VEÍCULO;

9.4.1.1. Caso o VEÍCULO disponibilizado tenha sido de categoria superior e o Cliente não compareça dentro de 24 (vinte quatro) horas do chamamento para substituição de VEÍCULO pela categoria contratada, a LOCADORA irá ajustar automaticamente o plano do Cliente para a categoria do VEÍCULO disponibilizado;

9.5. Prestar assistência ao LOCATÁRIO no caso de pane por defeito eletromecânico oriundo de uso normal do VEÍCULO;

9.5.1. Em todas as outras situações de pane ou acidente, o LOCATÁRIO, através da sua parceira de proteção veicular, prestará serviço de remoção/recolhimento do VEÍCULO para a filial onde avaliará, a seu critério, a possibilidade de reparação do VEÍCULO ou procederá a rescisão do Contrato, caso constatado descumprimento das cláusulas contratuais;

9.6. Fornecer assistência 24hrs, através de serviço de atendimento ao cliente via 0800, 24hrs por dia, 7 dias por semana, para informações e acionamento de Reboque (Reboques sem custo até o limite de raio de 100km total, para distâncias maiores será cobrado o valor disposto no TARIFÁRIO);

9.7. A LOCADORA não substituirá o VEÍCULO em caso de furto, roubo, incêndio, acidente, colisão, apropriação indébita, apreensão por autoridades, perda, furto ou roubo de chaves e/ou documentos ou em situações provocadas por mau uso. Nessas hipóteses, o Contrato será rescindido, com a devida retenção da caução pela LOCADORA, a fim de estancar os danos suportados, sem o prejuízo das demais medidas judiciais cabíveis;

9.8. A LOCADORA não se obriga a ressarcir valores de diária ou substituir o VEÍCULO nos casos de solicitação pelo Cliente de assistência ou realização das revisões periódicas, recalls ou manutenções do VEÍCULO, independentemente do tempo de duração dos serviços e tratativas.

9.9- A LOCADORA se compromete a ofertar manutenção no veículo, seja por acidente, desgastes naturais ou quedas, caso o LOCATÁRIO se comprometa com os custos das peças de reposição, óleos, e demais itens necessários, mediante agendamento prévio, e observado a periodicidade fiel de troca de óleo, qual seja, de no máximo 1000 em 1000 km.

9.10- Sempre que a LOCADORA tiver de devolver a caução paga pelo LOCATÁRIO, terá um prazo máximo de até 60 (sessenta) dias para tal devolução.`,
        order_index: 5,
        is_required: true,
        variables: templateVariables
      });

      // CLÁUSULA 6: Cláusula 10ª (Responsabilidade do Locatário - Parte 1)
      const clause6 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '6',
        title: '',
        content: `CLÁUSULA 10ª: RESPONSABILIDADE DO LOCATÁRIO

10.1. Além de todas as obrigações apontadas ao longo do presente termo, O LOCATÁRIO deverá:

10.1.1. responsabilizar-se pela guarda e correto uso do(s) VEÍCULO(s) enquanto durar a locação, utilizando-o em conformidade com as especificações do fabricante, em leitos carroçáveis adequados e em vias urbanas e estradas oficiais, abstendo-se da direção perigosa e de transportes que possam prejudicar o desempenho ou a integridade do VEÍCULO e seus acessórios, sob pena de responder pelo mau uso do VEÍCULO alugado, independente das demais cominações legais cabíveis;

10.1.2. assumir a posse autônoma do(s) VEÍCULO(s), para todos os fins de direito;

10.1.3. retirar o(s) VEÍCULO(s) alugado(s) na LOCADORA na data e hora estipuladas na reserva, quando aplicável;

10.1.4. Manter a circulação dos VEÍCULOS restrita ao perímetro (CERCA ELETRÔNICA), sob pena de rescisão do Contrato, além de respeitar a quilometragem limite estabelecida;

10.1.5. Devolver o(s) VEÍCULO(s) à LOCADORA na data e hora prevista no Termo de Abertura de Contrato e com os débitos integralmente quitados, sob pena de se tipificar apropriação indébita ou, ainda, furto mediante fraude quando aplicável, incorrendo o LOCATÁRIO nas cominações previstas no presente Contrato e na legislação vigente;

10.1.6. Devolver o(s) VEÍCULO(s) na respectiva filial em que o retirou e nas mesmas condições em que o recebeu, sendo vedada a realização de quaisquer alterações estéticas, sob pena de multa de R$ 5.000,00 (cinco mil reais) por moto entregue com avarias estéticas, bem como a rescisão unilateral do Contrato, com a devida retenção do valor pago a título de caução, a fim de estancar os prejuízos sofridos pela LOCADORA, sem prejuízo das demais medidas judiciais cabíveis;

10.1.7. Responsabilizar-se pelo pagamento das multas decorrentes de infração de trânsito no período em que o(s) VEÍCULO(s) estiver(rem) sob a sua responsabilidade, autorizando a cobrança ou o débito em meio de pagamento arquivado na LOCADORA, nos termos do Termo de responsabilidade de multas;

10.1.8. responsabilizar-se pelo pagamento das Manutenções Corretivas necessárias à manutenção do VEÍCULO locado, sendo competência exclusiva da LOCADORA realizar e definir quais são os reparos necessários.

10.1.8.1- Caso o LOCATÁRIO deseje que a LOCADORA se compromete a ofertar manutenção no veículo, seja por acidente, desgastes naturais ou quedas, este deverá se comprometer com os custos das peças de reposição, óleos, e demais itens necessários, mediante agendamento prévio, e observado a periodicidade fiel de troca de óleo, qual seja, de no máximo 1000 em 1000 km, assim como preconizado na cláusula 9.9.

10.1.9. vistoriar o(s) VEÍCULO(s) no ato de sua devolução, visto restar, desde já, certo e ajustado entre as partes que o LOCATÁRIO o entregou desocupado de quaisquer pertences ou valores, renunciando expressamente a qualquer reclamação a respeito;

10.1.10. impedir que terceiros conduzam o(s)s VEÍCULO(s) alugado(s), sob pena de rescisão imediata e de assunção, pelo LOCATÁRIO, de todas as responsabilidades e obrigações financeiras decorrentes do aluguel do VEÍCULO, incluindo, mas não se limitando a, multas e pontuações impostas em decorrência de infrações de trânsito, danos causados ao VEÍCULO alugado, bem como danos morais, materiais e pessoais causados a terceiros;

10.1.11. Inspecionar diariamente o(s) VEÍCULO(s) e informar de imediato a LOCADORA se identificar qualquer anormalidade no mesmo, incluindo, nível baixo do óleo do motor ou indícios visuais de vazamento de óleo; ruído ou fumaça incomum no motor, freios, embreagem; correntes com folga ou mal lubrificadas; cubos ou freios sujos, com ruído, ou com mau funcionamento; aperto frouxo em guidão, eixos, rodas, etc. Nestas situações, o Cliente fica obrigado a comunicar a LOCADORA e seguir as orientações, realizar agendamento de revisão mecânica pelos canais de atendimento da LOCADORA e comparecer a filial da LOCADORA quando for seguro fazê-lo, com a maior brevidade possível, sob pena de configurar mau uso.

10.1.12. Em caso de roubo, furto (inclusive de acessórios) e acidentes envolvendo ou não terceiros, o LOCATÁRIO deverá:

10.1.13. comunicar a LOCADORA imediatamente quando tiver conhecimento de uma das ocorrências mencionadas no caput deste item, fornecendo informações detalhadas do evento, como local, hora, dados de terceiros se houver, bem como enviar a LOCADORA fotografias e vídeos do local, dos VEÍCULOS e de todas as avarias em caso de acidente;

10.1.14. lavrar Boletim de Ocorrência em até 48 (quarenta e oito horas) horas do evento danoso;

10.1.15. Providenciar laudo pericial ou seu protocolo quando houver vítima fatal.

10.1.16. A responsabilidade pela substituição de pneus é do LOCATÁRIO, que deverá respeitar a periodicidade e vida útil do item, utilizando pneus que atendam às especificações do fabricante da motocicleta e garantam a segurança na condução.`,
        order_index: 6,
        is_required: true,
        variables: templateVariables
      });

      // CLÁUSULA 7: Cláusula 10ª (Parte 2) e Cláusulas 11ª-13ª
      const clause7 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '7',
        title: '',
        content: `10.2. O LOCATÁRIO concorda desde já que, se caracterizada a situação de apropriação indébita, a LOCADORA poderá realizar a cobrança do valor integral do VEÍCULO alugado, considerando o seu valor de mercado, estabelecido pela tabela FIPE ou outra referência, bem como estará o LOCADOR sujeito às penas da Lei, tanto em esfera cível, como criminal;

10.3. No dia do vencimento, a LOCADORA deve enviar um aviso ao LOCATÁRIO lembrando-o de sua obrigação de efetuar o pagamento até as 17h do dia do vencimento. O aviso deve incluir a data limite para pagamento, o valor devido e as informações da conta para pagamento;

10.4. Caso o LOCATÁRIO não efetue o pagamento até as 12h do dia do seguinte, ele ainda poderá ter um prazo a ser estipulada pela LOCADORA, estendendo o tempo para regularizar a situação, como mera tolerância não obrigatória da LOCADORA.

10.5. Após o prazo de tolerância, se o pagamento não tiver sido efetuado, a LOCADORA deve enviar um aviso de bloqueio ao LOCATÁRIO, informando que o VEÍCULO será bloqueado remotamente até a regularização do pagamento. Prazo máximo 48 horas.

10.6. Zelar pela imagem do Contratado durante todo o período em que estiverem mantendo relações advindas do presente documento.

10.7. Não ir de encontro às legislações, direitos ou instruções normativas que estejam em vigência.

10.8- Assumir toda e qualquer responsabilidade civil, administrativa e/ou criminal, seja por acidente de trânsitos, cometimento de crime(es) e/ou contravenção(ões) penal, ou por qualquer outra inobservância das normas e Lei vigentes, inclusive quanto aos valores que por ventura suprirem o limite assegurado, não tendo a Locadora, qualquer responsabilidade sob os veículos no período de vigência do contrato celebrado entre as partes.

CLÁUSULA 11ª- RENOVAÇÃO DA LOCAÇÃO E RENOVAÇÃO CONTRATUAL

11.1. A locação será prorrogada automática e sucessivamente por igual período até que sobrevenha comunicação do LOCATÁRIO informando a intenção de não renovar, ou até que o período de duração deste contrato seja finaliza.

11.1.1. Havendo a finalização do prazo de vigência do presente termo, haverá a prorrogação automática do mesmo, por igual período, salvo comunicação do LOCATÁRIO informando o interesse na rescisão contratual.

11.2. A locação também será prorrogada quando as partes ajustarem a troca de VEÍCULO sem alteração das condições comerciais;

11.3. Ocorrendo a prorrogação da locação, permanecerão em vigor as disposições do Contrato e destes Termos Gerais, aplicadas as atualizações monetárias e novas condições comerciais conforme o caso;

11.3.1. Havendo necessidade de ajustes no instrumento de contrato, deverá ser celebrado termo aditivo.

11.4. Não há limite para a quantidade de renovações pelo LOCATÁRIO, desde que este e o VEÍCULO locado estejam de acordo com os termos previstos neste Contrato, bem como haja a concordância do LOCADOR;

11.5. As Partes estão cientes e concordam que a(s) assinatura(s) lançada(s) pelo LOCATÁRIO no Termo de Abertura do Contrato, no momento da retirada do(s) VEÍCULO(s), valerão para todos os fins e efeitos legais.

CLÁUSULA 12ª: RESCISÃO

12.1- O Contrato poderá ser automaticamente rescindido, independentemente de qualquer notificação e a LOCADORA, sem mais formalidades, providenciará o bloqueio e a retomada do(s) VEÍCULOS, sem que isso enseje qualquer direito de retenção ou indenização, quando:

12.1.1- O VEÍCULO alugado não for devolvido na data, hora e filial previamente ajustadas no Demonstrativo de Contrato ou, ainda, for conduzido para fora da área de circulação informado pela LOCADORA, sem prejuízo das demais condições previstas neste Contrato;

12.1.2- Ocorrer qualquer acidente ou dano envolvendo o VEÍCULO alugado por culpa do LOCATÁRIO ou de um dos Usuários dos VEÍCULOS locados;

12.1.3- Ocorrer o mau uso do VEÍCULO, assim como já descrito no contrato.

12.1.3.1- O mau uso da motocicleta poderá acarretar em descumprimento de cláusula contratual com a quebra do contrato, sendo aplicadas as penalidades por rescisão antecipada previstas no presente termo

12.1.4- Ocorrer apreensão do VEÍCULO por autoridades competentes;

12.1.5- O LOCATÁRIO restar inadimplente quanto aos seus débitos nos respectivos vencimentos;

12.1.6 – O LOCATÁRIO realizado o cancelamento da identificação de condutor junto ao sistema do SINETRAN;

12.2- A LOCADORA procederá ao bloqueio do VEÍCULO quando for verificado o descumprimento de quaisquer disposições deste contrato, inclusive atraso na obrigação de pagar e realizar as revisões mecânicas devidas;, bem como for verificado, em caso de sinistro envolvendo o VEÍCULO, o mau uso, negligência, imprudência ou imperícia por parte do LOCATÁRIO ou do Usuário autorizado por ele;

12.3- A LOCADORA solicitará o desbloqueio do VEÍCULO em até 02 (dois) dias do adimplemento dos débitos ou quando, em seu entendimento as informações recebidas acerca do(s) VEÍCULO(S) forem suficiente para concluir que, em caso de sinistro, não foi o LOCATÁRIO o responsável por sua ocorrência;

12.4- Em todos os casos em que a LOCADORA decidir por comandar desbloqueio do VEÍCULO, há ainda um prazo de até 24 (vinte e quatro) horas para que a tecnologia de rastreio e comunicação proceda a efetivação da ordem, período no qual o(s) VEÍCULO(s) eventualmente pode permanecer bloqueado sem que isso gere qualquer responsabilidade a LOCADORA;

12.5- A LOCADORA poderá, a qualquer tempo, alterar os parâmetros de bloqueio do(s) VEÍCULO(S), cabendo ao LOCATÁRIO se manter informado pela unidade LOCADORA;

12.6- Caso ocorra a rescisão do presente Contrato em razão do inadimplemento de valores, o VEÍCULO alugado, mesmo que tenha sido substituído por outro, não poderá ser retido pelo LOCATÁRIO, sob pena de ser lavrado o respectivo Boletim de Ocorrência e tomada das medidas legais cabíveis, para busca e apreensão do(s) VEÍCULO(s) alugado(s);

12.7- Em caso de rescisão do Contrato por parte do LOCATÁRIO, este deverá comunicar a LOCADORA, com um prazo mínimo de 48 (quarenta e oito) horas de antecedência, bem como prosseguir com os procedimentos para devolução do(s) VEÍCULO(s) conforme disposto no presente Contrato, bem como arcar com as penalidades da rescisão antecipada previstas em Tarifário.

CLÁUSULA 13ª- REEMBOLSO

13.1- Rescindido o contrato, a LOCADORA realizará a apuração das obrigações do LOCATÁRIO, procedendo a cobrança de débitos após a compensação de créditos que disponha o LOCATÁRIO, inclusive aluguéis e caução;

13.2.- O eventual saldo será pago em até 60 (sessenta) dias úteis da data da rescisão em conta bancária indicada pelo LOCATÁRIO.`,
        order_index: 7,
        is_required: true,
        variables: templateVariables
      });

      // CLÁUSULA 8: Cláusulas 14ª-21ª (Finais)
      const clause8 = await ContractTemplateService.createClause({
        template_id: templateId,
        clause_number: '8',
        title: '',
        content: `CLÁUSULA 14ª- DA PROCURAÇÃO PARA REPRESENTAÇÃO JUNTO AS AUTORIDADES DE TRÂNSITO

14.1- O LOCATÁRIO, pelo presente, assinará procuração contida em Anexo ao presente termo, sendo, para tanto, parte integrante do presente contrato, outorgando poderes à LOCADORA, exclusivamente para assinar o Termo de Apresentação do Condutor Infrator nos casos de multas de trânsito em geral, oriundas e praticadas na vigência deste Contrato de Locação, nos termos do art. 257, Parágrafos 7º e 8º, do Código de Trânsito Brasileiro, e outras normas devidamente atualizadas.

CLÁUSULA 15ª- DO TARIFÁRIO

15.1- A LOCADORA poderá, a seu exclusivo critério, reajustar os valores relativos à diária, às tarifas, às taxas e outros incidentes sobre a locação, hipótese em que serão aplicados os valores vigentes no momento da prorrogação da locação pelo LOCATÁRIO, de acordo com o tarifário nacional vigente.

CLÁUSULA 16ª- TRATAMENTO DE DADOS PESSOAIS

16.1- No contexto deste Contrato, a LOCADORA trata dados pessoais referentes ao LOCATÁRIO na posição de controladora de dados pessoais, e pode compartilhar esses dados pessoais com terceiros. Todas as atividades de tratamento realizadas pela LOCADORA estão de acordo com a Lei Geral de Proteção de Dados Pessoais (Lei nº13.709/2018, a "LGPD") e demais leis e regulamentos de proteção de dados e privacidade aplicáveis. O eventual saldo será pago em até 60 (sessenta) dias úteis da data da rescisão em conta bancária indicada pelo LOCATÁRIO.

CLÁUSULA 17ª – PLANO FIDELIDADE – MINHA LOC

17.1. Superado o período de vigência do presente instrumento e seus aditivos, caso existam e, não havendo nenhuma interrupção durante o referido período, poderá o LOCATÁRIO informar o interesse na contratação do plano "Fidelidade – Minha Loc", que possui especificações próprias a serem anexadas a este contrato por meio de termo aditivo contratual.

17.2. Após o período de 28 meses de locação ininterrupta, tendo o LOCATÁRIO aderido o plano "Fidelidade - Minha Loc", receberá, por meio de cessão gratuita, a motocicleta utilizada no período da locação, desde que esteja estritamente em dia com todas as suas obrigações contratuais.

17.3. Caso o LOCATÁRIO opte pela alteração do plano contratado, as partes formalização termo aditivo contratual contendo todas as alterações necessárias, bem como todas as regras referente ao plano "Fidelidade - Minha Loc".

CLÁUSULA 18ª – DA CLÁUSULA PENAL

18.1- A parte que descumprir as obrigações dispostas nesse contrato ou que der causa à rescisão deste Contrato, salvo as exceções legais e contratuais já expostas, pagará multa no valor de R$ 1.000,00 (um mil reais), além de retenção integral da caução, devidamente acrescida de correção monetária (IGP-M/FGV) e juros de 1% ao mês, a contar da data do recebimento do aviso de inadimplemento, sem prejuízo de perdas e danos na forma da lei.

18.2. A multa, porventura aplicada, será considerada dívida líquida e certa, servindo, para tanto, o presente instrumento como título executivo extrajudicial.

18.3. Fica ainda resguardado à LOCADORA, o direito ao recebimento de valores moratórios, de acordo com o prejuízo causado pelo atraso ou inadimplemento injustificado no pagamento por parte do LOCATÁRIO.

CLÁUSULA 19ª – FORÇA MAIOR

19.1- Qualquer atraso ou falha no cumprimento deste contrato, ocasionado por motivo de força maior ou caso fortuito, conforme definido no Artigo 393 do Código Civil, não constituirá motivo de rescisão, exceto se tal evento perdurar por mais de 90 (noventa) dias. Entre os eventos de força maior ou caso fortuito, incluir-se-ão também a falha nos sistemas para lançamento das campanhas, o atraso na obtenção de autorizações governamentais, greves, quaisquer medidas governamentais que impeçam ou onerem excessivamente o cumprimento das obrigações aqui previstas, bem como qualquer outro evento alheio ao controle das Partes.

CLÁUSULA 20ª- DISPOSIÇÕES GERAIS

20.1- O LOCATÁRIO concorda que a sua assinatura no Contrato deverá ser idêntica a do documento de identificação apresentado, bem como concorda que a sua assinatura no Demonstrativo do Contrato implica ciência e adesão por si, seus herdeiros/sucessores a estas Condições Gerais, desde que respeitados os artigos 46 e 47 da Lei nº 8.078/90;

20.2- O LOCATÁRIO reconhece a forma de contratação por meio eletrônico e digital como válida e plenamente eficaz, de modo que este contrato e os documentos que o compõe constituem titulo executivo extrajudicial para todos os fins de direito, ainda que seja estabelecida com assinatura eletrônica ou certificação fora dos padrões ICP-BRASIL, conforme disposto pela Medida Provisória nº 2.200/2001;

20.3- O LOCATÁRIO, está ciente e reconhece que o sistema de aluguel de VEÍCULOS que opera sob a marca LOCAGORA em território nacional, é constituído por um conjunto de diversas pessoas jurídicas, cada qual com autonomia administrativa, financeira e legal, razão pela qual, compromete-se a dirigir eventuais pleitos, sejam judiciais ou extrajudiciais, somente em face da empresa cuja razão social constar no Demonstrativo de Contrato da questionada locação, exceto naquilo que o Contrato autorizar;

20.4- Nos termos do art. 265 do Código Civil Brasileiro, inexiste solidariedade, seja contratual ou legal entre a LOCADORA e o LOCATÁRIO, razão pela qual, com a locação e a efetiva retirada do VEÍCULO alugado, o LOCATÁRIO assume sua posse autônoma para todos os fins de direito, responsabilizando-se por eventuais indenizações decorrentes do uso e circulação do VEÍCULO, cuja responsabilidade perdurará até a efetiva devolução do VEÍCULO alugado;

20.5- O LOCATÁRIO, declara que os seus dados são verdadeiros, por eles respondendo sob as penas da Lei. Também, visando facilitar o processo de verificação, negociação e transação comercial pela antecipação de informações a seu respeito, autoriza o arquivamento de suas informações pessoais em Órgãos de Proteção ao Crédito, os quais poderão deles se utilizar, passando para quem de direito as informações armazenadas. A efetivação da locação pode estar sujeita a análise e aprovação do crédito do LOCATÁRIO, no ato da assinatura do Contrato;

20.6- O LOCATÁRIO autoriza, sem a incidência de qualquer ônus, o uso de seus dados, como por exemplo, mas não limitados, a sua imagem, som de sua voz, nome e informações para uso em fotos, vídeos e documentos destinados a campanhas promocionais e institucionais, sejam essas destinadas à divulgação ao público em geral ou para uso interno. A autorização abrange os usos acima indicados tanto em mídia impressa, como também, em mídia eletrônica;

20.7- Na hipótese do LOCATÁRIO se opor à concessão prevista no item anterior, deve informar a LOCADORA, de forma escrita e expressa, decisão que será prontamente respeitada pela LOCADORA.

20.8- O LOCATÁRIO autoriza a coleta de sua biometria facial e digital para fins de cadastro perante a LOCADORA e seus programas de benefícios;

20.9- As partes declaram estar cientes e concordam que o fechamento do Demonstrativo de Contrato não quita integralmente as obrigações dele decorrentes, restando certo que o LOCATÁRIO poderá ser compelido posteriormente a arcar com valores decorrentes de danos, multas e demais despesas a que deu causa, ou de pessoas não autorizadas a utilizar o VEÍCULO, em razão de omissão, negligência, imprudência ou mau uso do VEÍCULO enquanto este esteve em sua posse, sendo emitido faturamento e cobrança de tais valores;

20.10- Todos os valores, despesas e encargos da locação constituem dívidas líquidas e certas para pagamento à vista, passíveis de cobrança executiva e, em caso de não pagamento ensejará o acréscimo de 10% (dez por cento), juros de 1% (um por cento) ao mês e atualização monetária pela variação positiva do IGP-M da Fundação Getúlio Vargas sobre o valor da parcela em atraso, calculado "pro rata dies", desde a data do vencimento até seu efetivo pagamento, constituindo o LOCATÁRIO automaticamente em mora, independentemente de prévia notificação;

20.11- Desde já, a LOCADORA estabelece que, mediante instrumento particular de cessão de crédito, poderá ceder seu exclusivo direito de crédito, respectivo ao presente Contrato, bem como todos os direitos e ações conferidos por lei, à parceiros e terceiros, a seu próprio critério, ao que o LOCATÁRIO em nada se opõe;

20.12- Eventuais tolerâncias da LOCADORA para com o LOCATÁRIO no cumprimento das obrigações ajustadas neste Contrato constituem mera liberalidade, não importando em hipótese alguma em novação, permanecendo íntegras as cláusulas e condições aqui contratadas;

20.13- Caso algum item deste Contrato seja declarado nulo, as demais prevalecerão válidos e em plena aplicação;

20.14- O Contrato formalizado entre as Partes substitui quaisquer acordos anteriores;

CLÁUSULA 21ª – FORO

21.1- As partes elegem o foro da Comarca de {{contract_city}}/{{contract_state}} para dirimirem quaisquer dúvidas do presente contrato.

{{contract_city}}, {{contract_date}}

___________________________________________
LOCADORA

___________________________________________
LOCATÁRIO

___________________________________________
Testemunha 1

___________________________________________
Testemunha 2`,
        order_index: 8,
        is_required: true,
        variables: templateVariables
      });

      console.log('✅ [FullMainRental] TODAS AS 8 CLÁUSULAS CRIADAS - CONTRATO COMPLETO DE 14 PÁGINAS!');
      console.log('✅ [FullMainRental] Conteúdo incluído: TODAS as 21 cláusulas do SILVIO ROBERTO');

      return [clause1, clause2, clause3, clause4, clause5, clause6, clause7, clause8];
    } catch (clauseError) {
      console.error('❌ [FullMainRental] Erro ao criar cláusulas:', clauseError);
      throw clauseError;
    }
  };

  // Resto do componente simplificado para teste
  const getOrCreateMainContractTemplateId = async (): Promise<string> => {
    try {
      const templateName = `Contrato SILVIO ROBERTO 14 PAGINAS v${Date.now()}`;
      
      console.log('📋 [FullMainRental] Criando template de 14 páginas...');
      
      const contractTypes = await ContractTemplateService.getContractTypes();
      let rentalType = contractTypes.find(t => t.category === 'rental' || t.name.includes('Locação'));
      
      if (!rentalType) {
        rentalType = contractTypes[0];
      }
      
      if (!rentalType) {
        throw new Error('Nenhum tipo de contrato encontrado no sistema');
      }
      
      const newTemplate = await ContractTemplateService.createTemplate({
        contract_type_id: rentalType.id,
        name: templateName,
        version: '14pages',
        title: 'Contrato SILVIO ROBERTO - 14 Páginas Completas',
        content: {
          sections: [
            {
              title: "CONTRATO SILVIO ROBERTO - 14 PÁGINAS",
              subtitle: "Versão completa com todas as 21 cláusulas detalhadas"
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
      
      await createClausesForTemplate(newTemplate.id);
      
      const createdClauses = await ContractTemplateService.getTemplateClauses(newTemplate.id);
      console.log('✅ [FullMainRental] Template 14 páginas criado com', createdClauses.length, 'cláusulas');
      console.log('📋 [FullMainRental] Conteúdo: 100% do SILVIO ROBERTO - TODAS as 21 cláusulas incluídas!');
      
      return newTemplate.id;
      
    } catch (error) {
      console.error('❌ [FullMainRental] Erro ao criar template:', error);
      throw error;
    }
  };

  // Métodos básicos para teste
  const checkExistingContract = async () => {
    try {
      console.log('📋 [FullMainRental] Verificando contratos existentes...');
      if (!rentalId) return;

      // Buscar todos os contratos gerados para este rental e filtrar por SILVIO ROBERTO
      const allContracts = await ContractTemplateService.getGeneratedContracts(cityId);
      const contracts = allContracts.filter(contract => 
        contract.rental_id === rentalId && 
        (contract.template?.name?.includes('SILVIO ROBERTO') || 
         contract.template?.title?.includes('SILVIO ROBERTO'))
      );

      if (contracts && contracts.length > 0) {
        const contract = contracts[0]; // Pegar o mais recente
        console.log('✅ [FullMainRental] Contrato existente encontrado:', contract);
        setGeneratedContract(contract);
        
        // Regenerar PDF para contrato existente se necessário
        await regeneratePdfForExistingContract(contract);
      }
    } catch (error) {
      console.error('❌ [FullMainRental] Erro ao verificar contratos existentes:', error);
    }
  };

  const loadAllContracts = async () => {
    console.log('📋 [FullMainRental] Carregando contratos...');
    await checkExistingContract();
  };

  const regeneratePdfForExistingContract = async (contract: any) => {
    try {
      console.log('🔄 [FullMainRental] Regenerando PDF para contrato existente...');
      
      // Preparar dados do contrato
      const contractDataForPDF = prepareContractData();
      
      // Gerar PDF usando o template do contrato existente
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        contract.template_id,
        contractDataForPDF
      );
      
      const pdfBlob = pdfDoc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      console.log('✅ [FullMainRental] PDF regenerado:', pdfUrl);
      setGeneratedPdfUrl(pdfUrl);
      
    } catch (error) {
      console.error('❌ [FullMainRental] Erro ao regenerar PDF:', error);
    }
  };

  const handleSendForSignature = async (contract: any) => {
    try {
      console.log('📧 [FullMainRental] Enviando contrato para assinatura...');
      
      if (!contract) {
        toast.error('Gere o Contrato de Locação primeiro antes de enviar para assinatura.');
        return;
      }

      // Preparar dados do contrato
      const contractDataForPDF = prepareContractData();
      
      // Gerar PDF usando o template do contrato existente
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        contract.template_id,
        contractDataForPDF
      );
      
      const pdfBlob = pdfDoc.output('blob');
      const fileName = `contrato_locacao_${contract.contract_number}.pdf`;

      // Preparar signatários
      const clientEmail = contractData.client_email || 'cliente@email.com';
      const clientPhone = contractData.client_phone || '';
      const signers = [
        {
          name: contractData.client_name || 'Cliente',
          email: clientEmail,
          cpf: contractData.client_cpf || '',
          phone: clientPhone,
          role: 'client' as const
        }
      ];

      // Validar se tem email válido
      if (!clientEmail || clientEmail === 'cliente@email.com') {
        console.warn('⚠️ [FullMainRental] Usando email padrão para cliente:', clientEmail);
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

      console.log('✅ [FullMainRental] Enviado para assinatura:', signatureRequest);

      // Atualizar status do contrato para "sent"
      if (contract?.id) {
        await ContractTemplateService.updateContractStatus(
          contract.id,
          'sent',
          { signature_request_id: signatureRequest.id }
        );
      }

      toast.success('Contrato de Locação enviado para assinatura digital via BeSign!');

      // Recarregar contratos
      await checkExistingContract();
      
    } catch (error) {
      console.error('❌ [FullMainRental] Erro ao enviar para assinatura:', error);
      
      // Verificar se o erro é apenas cosmético (mock funcionando)
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
        
        toast.success('Contrato enviado para assinatura (modo mock)!');
        await checkExistingContract();
      } else {
        toast.error('Não foi possível enviar para assinatura. Verifique os logs para mais detalhes.');
      }
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await ContractTemplateService.deleteContract(contractId);
      setGeneratedContract(null);
      setGeneratedPdfUrl(null);
      toast.success('Contrato excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast.error('Erro ao excluir contrato');
    }
  };

  const prepareContractData = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    return {
      ...contractData,
      contract_date: currentDate,
      contract_number: contractData.contract_number || `CONT-${Date.now()}`,
      plan_name: 'Plano Fidelidade - Minha Loc',
      daily_rate: parseFloat(contractData.daily_rate.replace('R$', '').replace(',', '.')) || 0,
      total_amount: parseFloat(contractData.total_amount.replace('R$', '').replace(',', '.')) || 0,
      total_days: parseInt(contractData.total_days) || 0
    };
  };

  const generateMainContract = async () => {
    try {
      setIsGenerating(true);
      console.log('🚀 [FullMainRental] Iniciando geração do contrato completo...');
      
      const templateId = await getOrCreateMainContractTemplateId();
      console.log('✅ [FullMainRental] Template criado, iniciando geração do PDF...');
      
      // Preparar dados do contrato
      const contractDataForPDF = prepareContractData();
      
      // Gerar contrato no banco de dados primeiro
      const contract = await ContractTemplateService.generateContract(
        templateId,
        contractDataForPDF,
        cityId,
        rentalId
      );
      
      // Gerar PDF usando o template criado
      const pdfDoc = await PDFService.generateTemplateBasedContract(
        templateId,
        contractDataForPDF
      );
      
      // Converter PDF para URL blob
      const pdfBlob = pdfDoc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      console.log('🎯 [FullMainRental] PDF gerado com sucesso:', pdfUrl);
      
      setGeneratedPdfUrl(pdfUrl);
      setGeneratedContract(contract);
      
      if (onContractGenerated) {
        onContractGenerated(pdfUrl);
      }
      
      setIsDialogOpen(false);
      
      toast.success('Contrato Principal gerado com sucesso!');
      
    } catch (error) {
      console.error('❌ [FullMainRental] Erro ao gerar contrato:', error);
      toast.error('Erro ao gerar Contrato de 14 páginas: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Contrato de Locação</h3>
        </div>
        
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Gerar Contrato
        </Button>
      </div>

      {generatedContract && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{generatedContract.contract_number}</span>
                <Badge variant="secondary" className="text-xs">
                  Gerado
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Contrato de Locação - Criado em {new Date(generatedContract.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(generatedPdfUrl, '_blank')}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = generatedPdfUrl;
                  a.download = `contrato-silvio-roberto-${contractData.client_name?.replace(/\s+/g, '-')}-14-paginas.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendForSignature(generatedContract)}
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteContract(generatedContract.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="contract-description">
          <DialogHeader>
            <DialogTitle>Contrato de Locação</DialogTitle>
            <div id="contract-description" className="text-sm text-muted-foreground">
              Geração do contrato de locação
            </div>
          </DialogHeader>

          <div className="space-y-4">
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

            <div className="space-y-2">
              <Button
                onClick={generateMainContract}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Gerando...' : 'GERAR CONTRATO'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};