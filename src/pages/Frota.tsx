import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function Frota() {
  return (
    <UnderDevelopment
      title="Análise de Frota"
      description="Análise detalhada de modelos, performance e otimização da frota."
      expectedFeatures={[
        "Análise comparativa de modelos de motos",
        "Métricas de performance por modelo",
        "Relatórios de custo-benefício",
        "Histórico de manutenção por modelo",
        "Sugestões de renovação da frota",
        "Dashboard de utilização por categoria"
      ]}
      estimatedCompletion="Próximas 3-4 semanas"
    />
  );
}
