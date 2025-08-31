import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function PrevisaoOciosidade() {
  return (
    <UnderDevelopment
      title="Previsão de Ociosidade"
      description="Inteligência artificial para prever e otimizar o tempo ocioso da frota."
      expectedFeatures={[
        "IA para análise de padrões de uso das motos",
        "Previsão de períodos de baixa demanda",
        "Sugestões de redistribuição da frota",
        "Otimização de rotas e pontos de coleta",
        "Alertas de motos ociosas por muito tempo",
        "Relatórios de eficiência operacional"
      ]}
      estimatedCompletion="Próximas 5-6 semanas"
    />
  );
}
