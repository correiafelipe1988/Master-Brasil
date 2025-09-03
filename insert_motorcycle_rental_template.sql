-- ============================================================
-- Template do Contrato de Locação de Motocicletas (14 páginas)
-- ============================================================

-- 1. Inserir tipo de contrato
INSERT INTO public.contract_types (name, description, category) 
VALUES (
  'Locação de Motocicletas',
  'Contrato para locação de motocicletas com sistema de rastreamento e bloqueio remoto',
  'rental'
) ON CONFLICT (name) DO NOTHING;

-- 2. Inserir template principal
INSERT INTO public.contract_templates (
  contract_type_id,
  name,
  version,
  title,
  content,
  variables,
  is_active,
  is_default
) VALUES (
  (SELECT id FROM public.contract_types WHERE name = 'Locação de Motocicletas'),
  'Contrato Padrão de Locação de Motocicletas',
  '1.0',
  'CONTRATO DE LOCAÇÃO DE MOTOCICLETA',
  '{
    "header": {
      "company_name": "{{franchisee_name}}",
      "company_cnpj": "{{franchisee_cnpj}}",
      "company_address": "{{franchisee_address}}",
      "contract_number": "{{contract_number}}",
      "date": "{{contract_date}}"
    },
    "parties": {
      "locador": {
        "name": "{{franchisee_name}}",
        "cnpj": "{{franchisee_cnpj}}",
        "address": "{{franchisee_address}}",
        "phone": "{{franchisee_phone}}"
      },
      "locatario": {
        "name": "{{client_name}}",
        "cpf": "{{client_cpf}}",
        "rg": "{{client_rg}}",
        "address": "{{client_address}}",
        "phone": "{{client_phone}}",
        "email": "{{client_email}}",
        "cnh": "{{client_cnh}}",
        "cnh_category": "{{client_cnh_category}}",
        "cnh_expiry": "{{client_cnh_expiry}}"
      }
    },
    "vehicle": {
      "model": "{{motorcycle_model}}",
      "plate": "{{motorcycle_plate}}",
      "year": "{{motorcycle_year}}",
      "color": "{{motorcycle_color}}",
      "chassi": "{{motorcycle_chassi}}",
      "renavam": "{{motorcycle_renavam}}"
    },
    "rental_terms": {
      "start_date": "{{start_date}}",
      "end_date": "{{end_date}}",
      "daily_rate": "{{daily_rate}}",
      "total_amount": "{{total_amount}}",
      "deposit_value": "{{deposit_value}}",
      "plan_name": "{{plan_name}}"
    },
    "special_conditions": {
      "km_inicial": "{{km_inicial}}",
      "km_final": "{{km_final}}",
      "observations": "{{observations}}"
    }
  }',
  '[
    "franchisee_name", "franchisee_cnpj", "franchisee_address", "franchisee_phone",
    "client_name", "client_cpf", "client_rg", "client_address", "client_phone", 
    "client_email", "client_cnh", "client_cnh_category", "client_cnh_expiry",
    "motorcycle_model", "motorcycle_plate", "motorcycle_year", "motorcycle_color",
    "motorcycle_chassi", "motorcycle_renavam",
    "start_date", "end_date", "daily_rate", "total_amount", "deposit_value",
    "plan_name", "km_inicial", "km_final", "observations",
    "contract_number", "contract_date"
  ]',
  true,
  true
) ON CONFLICT (contract_type_id, name, version) DO NOTHING;

-- 3. Inserir cláusulas do contrato (primeiras 20 cláusulas)
DO $$
DECLARE
  template_id UUID;
BEGIN
  SELECT id INTO template_id 
  FROM public.contract_templates 
  WHERE name = 'Contrato Padrão de Locação de Motocicletas';

  -- CLÁUSULA 1ª: DAS PARTES
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '1', 'DAS PARTES', 
   'LOCADOR: {{franchisee_name}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{franchisee_cnpj}}, com sede na {{franchisee_address}}, doravante denominada simplesmente LOCADORA.

LOCATÁRIO: {{client_name}}, brasileiro, portador do CPF nº {{client_cpf}} e RG nº {{client_rg}}, residente e domiciliado na {{client_address}}, telefone {{client_phone}}, e-mail {{client_email}}, portador da CNH nº {{client_cnh}}, categoria {{client_cnh_category}}, válida até {{client_cnh_expiry}}, doravante denominado simplesmente LOCATÁRIO.', 1);

  -- CLÁUSULA 2ª: DO OBJETO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '2', 'DO OBJETO', 
   '2.1- O presente contrato tem por objeto a locação da motocicleta {{motorcycle_model}}, placa {{motorcycle_plate}}, ano {{motorcycle_year}}, cor {{motorcycle_color}}, chassi {{motorcycle_chassi}}, RENAVAM {{motorcycle_renavam}}, doravante denominada simplesmente VEÍCULO.

2.2- O VEÍCULO é entregue ao LOCATÁRIO em perfeitas condições de uso, funcionamento e conservação, com quilometragem inicial de {{km_inicial}} km.', 2);

  -- CLÁUSULA 3ª: DO PRAZO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '3', 'DO PRAZO', 
   '3.1- O prazo de locação será de {{start_date}} até {{end_date}}, podendo ser prorrogado por acordo entre as partes.

3.2- O presente contrato poderá ser renovado automaticamente por períodos iguais e sucessivos, salvo manifestação em contrário de qualquer das partes, comunicada por escrito com antecedência mínima de 30 (trinta) dias do término da vigência.', 3);

  -- CLÁUSULA 4ª: DO VALOR E FORMA DE PAGAMENTO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '4', 'DO VALOR E FORMA DE PAGAMENTO', 
   '4.1- O valor da locação é de R$ {{daily_rate}} ({{daily_rate_written}}) por dia, totalizando R$ {{total_amount}} ({{total_amount_written}}) pelo período contratado.

4.2- O pagamento deverá ser efetuado conforme o plano selecionado: {{plan_name}}.

4.3- O LOCATÁRIO deverá efetuar o depósito caução no valor de R$ {{deposit_value}} ({{deposit_value_written}}) no ato da assinatura deste contrato.', 4);

  -- CLÁUSULA 5ª: DAS OBRIGAÇÕES DO LOCATÁRIO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '5', 'DAS OBRIGAÇÕES DO LOCATÁRIO', 
   '5.1- Utilizar o VEÍCULO exclusivamente para os fins a que se destina, observando as normas de trânsito e legislação vigente.

5.2- Manter o VEÍCULO em perfeitas condições de uso, conservação e funcionamento.

5.3- Responsabilizar-se por todos os danos causados ao VEÍCULO durante o período de locação.

5.4- Comunicar imediatamente à LOCADORA qualquer acidente, furto, roubo ou avaria do VEÍCULO.

5.5- Não permitir que terceiros conduzam o VEÍCULO sem autorização expressa da LOCADORA.', 5);

  -- CLÁUSULA 6ª: DAS OBRIGAÇÕES DA LOCADORA
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '6', 'DAS OBRIGAÇÕES DA LOCADORA', 
   '6.1- Entregar o VEÍCULO em perfeitas condições de uso e funcionamento.

6.2- Manter a documentação do VEÍCULO em dia e regularizada.

6.3- Prestar assistência técnica quando necessário.

6.4- Responsabilizar-se pelos vícios ocultos do VEÍCULO.', 6);

  -- CLÁUSULA 7ª: DO SISTEMA DE RASTREAMENTO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '7', 'DO SISTEMA DE RASTREAMENTO',
   '7.1- O VEÍCULO possui sistema de rastreamento e monitoramento em tempo real.

7.2- O LOCATÁRIO autoriza expressamente o monitoramento da localização do VEÍCULO.

7.3- Em caso de inadimplência, a LOCADORA poderá bloquear remotamente o VEÍCULO.', 7);

  -- CLÁUSULA 8ª: DO SEGURO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '8', 'DO SEGURO',
   '8.1- O VEÍCULO possui cobertura de seguro contra furto, roubo, colisão e terceiros.

8.2- Em caso de sinistro, o LOCATÁRIO deverá arcar com o valor da franquia.

8.3- O LOCATÁRIO deverá comunicar imediatamente qualquer sinistro à LOCADORA e à seguradora.', 8);

  -- CLÁUSULA 9ª: DA MANUTENÇÃO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '9', 'DA MANUTENÇÃO',
   '9.1- A manutenção preventiva do VEÍCULO é de responsabilidade da LOCADORA.

9.2- A manutenção corretiva decorrente de mau uso é de responsabilidade do LOCATÁRIO.

9.3- O LOCATÁRIO deverá seguir o cronograma de manutenção estabelecido pela LOCADORA.', 9);

  -- CLÁUSULA 10ª: DAS MULTAS E INFRAÇÕES
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '10', 'DAS MULTAS E INFRAÇÕES',
   '10.1- Todas as multas e infrações de trânsito cometidas durante o período de locação são de responsabilidade do LOCATÁRIO.

10.2- O LOCATÁRIO se compromete a quitar as multas no prazo legal.

10.3- Em caso de não pagamento, a LOCADORA poderá descontar o valor das multas do depósito caução.', 10);

  -- CLÁUSULA 11ª: DA DEVOLUÇÃO DO VEÍCULO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '11', 'DA DEVOLUÇÃO DO VEÍCULO',
   '11.1- O VEÍCULO deverá ser devolvido nas mesmas condições em que foi entregue.

11.2- A quilometragem final será de {{km_final}} km.

11.3- Qualquer dano ou avaria será descontado do depósito caução.', 11);

  -- CLÁUSULA 12ª: DA RESCISÃO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '12', 'DA RESCISÃO',
   '12.1- O presente contrato poderá ser rescindido por qualquer das partes, mediante comunicação prévia de 48 horas.

12.2- Em caso de inadimplência, a LOCADORA poderá rescindir o contrato imediatamente.

12.3- A rescisão não exime o LOCATÁRIO das obrigações já assumidas.', 12);

  -- CLÁUSULA 13ª: DO REEMBOLSO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '13', 'DO REEMBOLSO',
   '13.1- Rescindido o contrato, a LOCADORA realizará a apuração das obrigações do LOCATÁRIO.

13.2- O eventual saldo será pago em até 60 (sessenta) dias úteis da data da rescisão.', 13);

  -- CLÁUSULA 14ª: DA PROCURAÇÃO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '14', 'DA PROCURAÇÃO PARA REPRESENTAÇÃO JUNTO ÀS AUTORIDADES DE TRÂNSITO',
   '14.1- O LOCATÁRIO assinará procuração contida em Anexo ao presente termo, para que a LOCADORA possa assinar o Termo de Apresentação do Condutor Infrator em casos de multas de trânsito.', 14);

  -- CLÁUSULA 15ª: DO TARIFÁRIO
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '15', 'DO TARIFÁRIO',
   '15.1- A LOCADORA poderá reajustar os valores relativos à diária, tarifas e taxas, conforme tarifário nacional vigente.', 15);

  -- CLÁUSULA 16ª: TRATAMENTO DE DADOS PESSOAIS
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '16', 'TRATAMENTO DE DADOS PESSOAIS',
   '16.1- A LOCADORA trata dados pessoais do LOCATÁRIO conforme a Lei Geral de Proteção de Dados Pessoais (LGPD).

16.2- Todas as atividades estão de acordo com a LGPD e demais leis de proteção de dados aplicáveis.', 16);

  -- CLÁUSULA 17ª: PLANO FIDELIDADE
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '17', 'PLANO FIDELIDADE - MINHA LOC',
   '17.1- Após 3 meses de locação ininterrupta, o LOCATÁRIO poderá aderir ao plano "Fidelidade - Minha Loc".

17.2- Com o plano ativo, após 3 meses, o LOCATÁRIO receberá por cessão gratuita a motocicleta utilizada.

17.3- A alteração do plano será formalizada por termo aditivo.', 17);

  -- CLÁUSULA 18ª: DA CLÁUSULA PENAL
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '18', 'DA CLÁUSULA PENAL',
   '18.1- A parte que descumprir as obrigações pagará multa de R$ 1.000,00 (um mil reais).

18.2- A multa será considerada dívida líquida e certa, servindo como título executivo extrajudicial.

18.3- Fica resguardado o direito ao recebimento de valores moratórios.', 18);

  -- CLÁUSULA 19ª: FORÇA MAIOR
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '19', 'FORÇA MAIOR',
   '19.1- Eventos de força maior ou caso fortuito não constituirão motivo de rescisão, exceto se perdurarem por mais de 90 dias.', 19);

  -- CLÁUSULA 20ª: DISPOSIÇÕES GERAIS
  INSERT INTO public.contract_clauses (template_id, clause_number, title, content, order_index) VALUES
  (template_id, '20', 'DISPOSIÇÕES GERAIS',
   '20.1- O LOCATÁRIO concorda que sua assinatura no contrato deverá ser idêntica ao documento de identificação.

20.2- O LOCATÁRIO reconhece a contratação eletrônica como válida e eficaz.

20.3- O LOCATÁRIO declara que seus dados são verdadeiros.

20.4- O LOCATÁRIO autoriza o uso de seus dados para campanhas promocionais.', 20);

END $$;
