import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalLeads: number;
  totalDeals: number;
  totalActivities: number;
  wonRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    totalDeals: 0,
    totalActivities: 0,
    wonRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { appUser } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Buscar estatísticas
        const [leadsRes, dealsRes, activitiesRes, revenueRes] = await Promise.all([
          supabase.from('leads').select('id', { count: 'exact' }),
          supabase.from('deals').select('id', { count: 'exact' }),
          supabase.from('activities').select('id', { count: 'exact' }),
          supabase
            .from('deals')
            .select('amount')
            .eq('stage', 'ganho')
        ]);

        const totalRevenue = revenueRes.data?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0;

        setStats({
          totalLeads: leadsRes.count || 0,
          totalDeals: dealsRes.count || 0,
          totalActivities: activitiesRes.count || 0,
          wonRevenue: totalRevenue
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statCards = [
    {
      title: 'Total de Leads',
      value: stats.totalLeads,
      icon: Users,
      description: 'Leads cadastrados'
    },
    {
      title: 'Negócios',
      value: stats.totalDeals,
      icon: DollarSign,
      description: 'Negócios em andamento'
    },
    {
      title: 'Atividades',
      value: stats.totalActivities,
      icon: Activity,
      description: 'Atividades registradas'
    },
    {
      title: 'Receita Ganha',
      value: formatCurrency(stats.wonRevenue),
      icon: TrendingUp,
      description: 'Negócios fechados'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {appUser?.role === 'admin' 
              ? 'Visão geral do sistema' 
              : `Visão geral - ${appUser?.city_name}`
            }
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    card.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bem-vindo */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao CRM Multi-Cidades</CardTitle>
          <CardDescription>
            Gerencie seus leads, negócios e atividades de forma eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use o menu lateral para navegar pelas diferentes seções do sistema. 
            {appUser?.role === 'admin' 
              ? ' Como administrador, você tem acesso a todas as funcionalidades e pode gerenciar usuários e cidades.'
              : ' Como operador, você pode gerenciar os dados da sua cidade.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}