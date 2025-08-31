import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function DistratosLocacoes() {
  return (
    <UnderDevelopment
      title="Distratos de Locações"
      description="Gestão de contratos encerrados e análise de motivos de cancelamento."
      expectedFeatures={[
        "Lista completa de contratos encerrados",
        "Análise de motivos de cancelamento",
        "Relatórios de taxa de retenção por período",
        "Dashboard com métricas de churn",
        "Histórico detalhado de cada distrato",
        "Alertas para contratos em risco de cancelamento"
      ]}
      estimatedCompletion="Próximas 2-3 semanas"
    />
  );
}
