import { UnderDevelopment } from '@/components/UnderDevelopment';

export default function CitiesManagement() {
  return (
    <UnderDevelopment
      title="Gestão de Cidades"
      description="Administração completa das cidades onde a Master Brasil opera."
      expectedFeatures={[
        "Cadastro e edição de cidades",
        "Configuração de parâmetros por cidade",
        "Análise de performance por região",
        "Gestão de limites operacionais",
        "Mapeamento de áreas de cobertura",
        "Relatórios comparativos entre cidades"
      ]}
      estimatedCompletion="Próximas 3-4 semanas"
    />
  );
}
