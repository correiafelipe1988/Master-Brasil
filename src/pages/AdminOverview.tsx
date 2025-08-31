import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function AdminOverview() {
  return (
    <UnderDevelopment
      title="Visão Geral Administrativa"
      description="Dashboard executivo com métricas consolidadas de toda a operação."
      expectedFeatures={[
        "KPIs executivos em tempo real",
        "Análise consolidada de todas as cidades",
        "Relatórios gerenciais automatizados",
        "Comparativo de performance entre regiões",
        "Alertas de anomalias operacionais",
        "Exportação de relatórios executivos"
      ]}
      estimatedCompletion="Próximas 2-3 semanas"
    />
  );
}
