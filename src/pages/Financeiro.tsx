import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function Financeiro() {
  return (
    <UnderDevelopment
      title="Financeiro"
      description="Análise completa de receitas, despesas e performance financeira."
      expectedFeatures={[
        "Dashboard financeiro com KPIs principais",
        "Relatórios de receita por franqueado e cidade",
        "Análise de fluxo de caixa mensal",
        "Controle de despesas operacionais",
        "Projeções financeiras e orçamento",
        "Integração com sistema de pagamentos"
      ]}
      estimatedCompletion="Próximas 4-5 semanas"
    />
  );
}
