import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Target,
  Activity,
  FileText
} from 'lucide-react';

interface FranchiseeStats {
  totalLeads: number;
  activeDeals: number;
  monthlyRevenue: number;
  conversionRate: number;
  activitiesCompleted: number;
  pendingActivities: number;
}

export default function FranchiseeReports() {
  const [stats, setStats] = useState<FranchiseeStats>({
    totalLeads: 0,
    activeDeals: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    activitiesCompleted: 0,
    pendingActivities: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { appUser } = useAuth();

  useEffect(() => {
    if (appUser?.id) {
      fetchStats();
    }
  }, [appUser]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Buscar dados do franqueado
      const { data: franchiseeData, error: franchiseeError } = await supabase
        .from('franchisees')
        .select('city_id')
        .eq('user_id', appUser?.id)
        .single();

      if (franchiseeError || !franchiseeData) {
        console.error('Erro ao buscar dados do franqueado:', franchiseeError);
        return;
      }

      // Buscar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, status')
        .eq('city_id', franchiseeData.city_id);

      // Buscar deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('id, stage, amount')
        .eq('city_id', franchiseeData.city_id);

      // Buscar atividades
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('id, due_at')
        .eq('city_id', franchiseeData.city_id);

      if (leadsError || dealsError || activitiesError) {
        console.error('Erro ao buscar dados:', { leadsError, dealsError, activitiesError });
        return;
      }

      // Calcular estatísticas
      const totalLeads = leadsData?.length || 0;
      const activeDeals = dealsData?.filter(deal => deal.stage !== 'perdido' && deal.stage !== 'ganho').length || 0;
      const wonDeals = dealsData?.filter(deal => deal.stage === 'ganho') || [];
      const monthlyRevenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
      const conversionRate = totalLeads > 0 ? (wonDeals.length / totalLeads) * 100 : 0;
      
      const now = new Date();
      const completedActivities = activitiesData?.filter(activity => 
        activity.due_at && new Date(activity.due_at) < now
      ).length || 0;
      const pendingActivities = activitiesData?.filter(activity => 
        !activity.due_at || new Date(activity.due_at) >= now
      ).length || 0;

      setStats({
        totalLeads,
        activeDeals,
        monthlyRevenue,
        conversionRate,
        activitiesCompleted: completedActivities,
        pendingActivities
      });

    } catch (error: any) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Relatórios e Métricas</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho da sua franquia
        </p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Leads gerados no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Negócios fechados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Leads para vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades Concluídas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activitiesCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingActivities}</div>
            <p className="text-xs text-muted-foreground">
              A fazer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumo de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status Geral</span>
              <Badge variant={stats.totalLeads > 0 ? "default" : "secondary"}>
                {stats.totalLeads > 0 ? "Ativo" : "Iniciando"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pipeline de Vendas</span>
                <span>{stats.activeDeals} negócios ativos</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((stats.activeDeals / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Produtividade</span>
                <span>{stats.activitiesCompleted} atividades concluídas</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((stats.activitiesCompleted / (stats.activitiesCompleted + stats.pendingActivities)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.totalLeads === 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Gere seus primeiros leads</p>
                  <p className="text-sm text-blue-700">Comece criando leads na aba "Leads"</p>
                </div>
              </div>
            )}
            
            {stats.activeDeals === 0 && stats.totalLeads > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Converta leads em negócios</p>
                  <p className="text-sm text-green-700">Transforme seus leads em oportunidades de venda</p>
                </div>
              </div>
            )}
            
            {stats.pendingActivities > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Complete suas atividades</p>
                  <p className="text-sm text-orange-700">Você tem {stats.pendingActivities} atividades pendentes</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
