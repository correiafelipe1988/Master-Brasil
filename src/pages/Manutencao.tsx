import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function Manutencao() {
  return (
    <UnderDevelopment
      title="Gestão de Manutenção"
      description="Sistema completo para gestão de manutenção preventiva e corretiva."
      expectedFeatures={[
        "Agenda de manutenção preventiva",
        "Controle de manutenções corretivas",
        "Histórico completo por moto",
        "Alertas automáticos de manutenção",
        "Gestão de peças e estoque",
        "Relatórios de custos de manutenção"
      ]}
      estimatedCompletion="Próximas 4-5 semanas"
    />
  );
}
