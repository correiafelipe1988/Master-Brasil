import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building, MapPin, Users, TrendingUp } from 'lucide-react';

interface FranchiseeData {
  id: string;
  cnpj: string;
  company_name: string;
  fantasy_name: string;
  status: string;
  cities?: {
    name: string;
  };
}

export default function FranchiseeDashboard() {
  const [franchiseeData, setFranchiseeData] = useState<FranchiseeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { appUser } = useAuth();

  useEffect(() => {
    if (appUser?.id) {
      fetchFranchiseeData();
    }
  }, [appUser]);

  const fetchFranchiseeData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('franchisees')
        .select(`
          *,
          cities:city_id (name)
        `)
        .eq('user_id', appUser?.id)
        .single();

      if (error) {
        console.error('Erro ao buscar dados do franqueado:', error);
        return;
      }

      setFranchiseeData(data);
    } catch (error: any) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard do Franqueado</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Informações da Empresa */}
      {franchiseeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                <p className="font-mono text-sm mt-1">{formatCNPJ(franchiseeData.cnpj)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Razão Social</label>
                <p className="font-medium mt-1">{franchiseeData.company_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome Fantasia</label>
                <p className="mt-1">{franchiseeData.fantasy_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  {getStatusBadge(franchiseeData.status)}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Cidade: <strong>{franchiseeData.cities?.name}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • <strong>Gestão de Leads:</strong> Visualize e gerencie seus leads
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Controle de Negócios:</strong> Acompanhe suas vendas e pipeline
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Relatórios:</strong> Acesse relatórios detalhados do seu desempenho
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Atividades:</strong> Organize suas tarefas e compromissos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}