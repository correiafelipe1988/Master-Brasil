import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function ProjecaoCrescimento() {
  return (
    <UnderDevelopment
      title="Projeção de Crescimento"
      description="Análise inteligente para atingir a meta de 1.000 motos na frota."
      expectedFeatures={[
        "Dashboard com métricas de crescimento em tempo real",
        "Projeções baseadas em dados históricos e tendências",
        "Análise de capacidade por cidade e franqueado",
        "Simulador de cenários de crescimento",
        "Relatórios de progresso mensal e trimestral",
        "Alertas automáticos para metas em risco"
      ]}
      estimatedCompletion="Próximas 2-3 semanas"
    />
  );
}
