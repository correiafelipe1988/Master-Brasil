import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function Rastreadores() {
  return (
    <UnderDevelopment
      title="Rastreadores"
      description="Gestão completa dos rastreadores instalados na frota de motos."
      expectedFeatures={[
        "Mapa em tempo real com localização de todas as motos",
        "Histórico de rotas e trajetos",
        "Alertas de velocidade e área restrita",
        "Status de bateria e conectividade dos rastreadores",
        "Relatórios de uso e quilometragem",
        "Integração com sistema de manutenção preventiva"
      ]}
      estimatedCompletion="Próximas 3-4 semanas"
    />
  );
}
