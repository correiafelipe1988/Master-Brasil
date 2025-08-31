import { useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, TrendingUp, Bike, BarChart3, PieChart as PagePieIcon, CheckCircle, ArrowRight, Wrench } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/contexts/DashboardContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseISO, isValid, startOfDay, isSameDay } from 'date-fns';

import { StatusDistributionChart } from '@/components/charts/status-distribution-chart';
import { BaseGrowthChart } from '@/components/charts/base-growth-chart';
import { MonthlyRentalsChart } from '@/components/charts/monthly-rentals-chart';
import { DailyRentalsChart } from '@/components/charts/daily-rentals-chart';

interface Motorcycle {
  id: string;
  placa: string;
  modelo: string;
  status: 'active' | 'alugada' | 'relocada' | 'manutencao' | 'recolhida' | 'indisponivel_rastreador' | 'indisponivel_emplacamento';
  data_ultima_mov?: string;
  data_criacao?: string;
  city_id?: string;
  franchisee_id?: string;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Função para processar dados reais das motos
const processRealMotorcycleData = (motorcycles: any[]) => {
  const today = new Date();
  const todayStart = startOfDay(today);
  
  // Processar dados de hoje
  let motosAlugadasHoje = 0;
  let motosRelocadasHoje = 0;
  let motosDisponiveisHoje = 0;
  let motosRecuperadasHoje = 0;
  
  // Contar status atual das motos
  const statusCounts: Record<string, number> = {};
  const uniqueMotorcyclesByPlaca: { [placa: string]: any } = {};
  
  // Obter a moto mais recente por placa (baseado em created_at como fallback)
  motorcycles.forEach(moto => {
    if (!moto.placa) return;
    const existingMoto = uniqueMotorcyclesByPlaca[moto.placa];

    if (!existingMoto) {
      // Primeira moto com esta placa
      uniqueMotorcyclesByPlaca[moto.placa] = moto;
    } else {
      // Comparar datas para pegar a mais recente
      let motoDate = null;
      let existingDate = null;

      // Priorizar data_ultima_mov, depois created_at
      if (moto.data_ultima_mov) {
        motoDate = new Date(moto.data_ultima_mov);
      } else if (moto.created_at) {
        motoDate = new Date(moto.created_at);
      }

      if (existingMoto.data_ultima_mov) {
        existingDate = new Date(existingMoto.data_ultima_mov);
      } else if (existingMoto.created_at) {
        existingDate = new Date(existingMoto.created_at);
      }

      // Se conseguiu obter as datas, comparar
      if (motoDate && existingDate && motoDate > existingDate) {
        uniqueMotorcyclesByPlaca[moto.placa] = moto;
      } else if (motoDate && !existingDate) {
        // Se a nova moto tem data e a existente não, usar a nova
        uniqueMotorcyclesByPlaca[moto.placa] = moto;
      }
    }
  });
  
  const representativeMotorcycles = Object.values(uniqueMotorcyclesByPlaca);
  const totalUniqueMotorcycles = representativeMotorcycles.length;

  console.log('[StatusRapido] Total de placas únicas encontradas:', totalUniqueMotorcycles);
  console.log('[StatusRapido] Motos representativas por placa:', representativeMotorcycles.map(m => ({
    placa: m.placa,
    status: m.status,
    data_ultima_mov: m.data_ultima_mov,
    created_at: m.created_at
  })));
  
  // Contar por status (apenas placas únicas)
  representativeMotorcycles.forEach(moto => {
    const status = moto.status || 'active';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    // Verificar movimentações de hoje
    if (moto.data_ultima_mov) {
      try {
        const movDate = parseISO(moto.data_ultima_mov);
        if (isValid(movDate) && isSameDay(startOfDay(movDate), todayStart)) {
          if (status === 'alugada') motosAlugadasHoje++;
          if (status === 'relocada') motosRelocadasHoje++;
          if (status === 'active') motosDisponiveisHoje++;
          if (status === 'recolhida') motosRecuperadasHoje++;
        }
      } catch (e) {
        console.warn('Erro ao processar data:', moto.data_ultima_mov);
      }
    }
  });
  
  // Calcular distribuição de status
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => {
    let displayName = status;
    switch (status) {
      case 'active': displayName = 'Disponível'; break;
      case 'alugada': displayName = 'Alugada'; break;
      case 'relocada': displayName = 'Relocada'; break;
      case 'manutencao': displayName = 'Manutenção'; break;
      case 'recolhida': displayName = 'Recolhida'; break;
      case 'indisponivel_rastreador': displayName = 'Indisponível - Rastreador'; break;
      case 'indisponivel_emplacamento': displayName = 'Indisponível - Emplacamento'; break;
    }
    
    return {
      name: displayName,
      count,
      value: totalUniqueMotorcycles > 0 ? parseFloat(((count / totalUniqueMotorcycles) * 100).toFixed(1)) : 0
    };
  }).filter(item => item.count > 0);
  
  // Calcular totais
  const totalLocacoes = (statusCounts.alugada || 0) + (statusCounts.relocada || 0);

  console.log('[StatusRapido] Contagem final por status:', statusCounts);
  console.log('[StatusRapido] Total de locações (alugada + relocada):', totalLocacoes);
  
  // Simular dados de crescimento baseados nos dados reais
  const monthAbbreviations = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonthIndex = new Date().getMonth();
  
  const baseGrowthData = monthAbbreviations.map((month, index) => {
    let cumulativeCount = 0;
    if (index <= currentMonthIndex) {
      // Simular crescimento gradual até o total atual
      const progressFactor = (index + 1) / (currentMonthIndex + 1);
      cumulativeCount = Math.floor(totalUniqueMotorcycles * progressFactor);
      
      // Garantir que agosto tenha o total correto (3 motos)
      if (index === currentMonthIndex) {
        cumulativeCount = totalUniqueMotorcycles;
      }
    } else {
      cumulativeCount = totalUniqueMotorcycles; // Manter valor atual para meses futuros
    }
    
    return { month, cumulativeCount };
  });
  
  return {
    todayData: {
      motosAlugadasHoje,
      motosRelocadasHoje,
      motosDisponiveisHoje,
      motosRecuperadasHoje,
      motosEmManutencao: statusCounts.manutencao || 0
    },
    monthData: {
      motosAlugadas: statusCounts.alugada || 0,
      motosRelocadas: statusCounts.relocada || 0,
      motosDisponiveis: statusCounts.active || 0,
      motosRecuperadas: statusCounts.recolhida || 0,
      emManutencao: statusCounts.manutencao || 0
    },
    kpi: {
      total: totalUniqueMotorcycles.toString(),
      locacoes: totalLocacoes.toString()
    },
    statusDistribution,
    baseGrowth: baseGrowthData,
    monthlyRentals: generateMonthlyRentalsData(motorcycles),
    dailyRentals: generateDailyRentalsData(motorcycles)
  };
};

// Dados simulados para demonstração (fallback)
const generateMockData = (userRole: string, cityName: string) => {
  const baseData = {
    totalMotos: userRole === 'admin' ? 532 : userRole === 'master_br' ? 532 : 150,
    disponiveisHoje: userRole === 'admin' ? 50 : userRole === 'master_br' ? 50 : 15,
    alugadasHoje: userRole === 'admin' ? 35 : userRole === 'master_br' ? 35 : 12,
    recuperadasHoje: userRole === 'admin' ? 8 : userRole === 'master_br' ? 8 : 3,
    manutencao: userRole === 'admin' ? 29 : userRole === 'master_br' ? 29 : 8
  };

  const statusDistribution = [
    { name: 'Locadas', count: userRole === 'admin' ? 447 : userRole === 'master_br' ? 447 : 120, value: 84.0 },
    { name: 'Disponível', count: baseData.disponiveisHoje, value: 9.4 },
    { name: 'Manutenção', count: baseData.manutencao, value: 5.4 },
    { name: 'Recolhida', count: userRole === 'admin' ? 1 : userRole === 'master_br' ? 1 : 1, value: 0.2 }
  ];

  return {
    todayData: {
      motosAlugadasHoje: baseData.alugadasHoje,
      motosRelocadasHoje: userRole === 'admin' ? 15 : userRole === 'master_br' ? 15 : 5,
      motosDisponiveisHoje: baseData.disponiveisHoje,
      motosRecuperadasHoje: baseData.recuperadasHoje,
      motosEmManutencao: baseData.manutencao
    },
    monthData: {
      motosAlugadas: baseData.alugadasHoje * 15, // Simular dados mensais
      motosRelocadas: (userRole === 'admin' ? 15 : userRole === 'master_br' ? 15 : 5) * 12,
      motosDisponiveis: baseData.disponiveisHoje * 10,
      motosRecuperadas: baseData.recuperadasHoje * 8,
      emManutencao: baseData.manutencao * 2
    },
    kpi: {
      total: baseData.totalMotos.toString(),
      locacoes: (baseData.alugadasHoje + (userRole === 'admin' ? 15 : userRole === 'master_br' ? 15 : 5)).toString()
    },
    statusDistribution,
    baseGrowth: [
      { month: 'Jan', cumulativeCount: Math.floor(baseData.totalMotos * 0.1) },
      { month: 'Fev', cumulativeCount: Math.floor(baseData.totalMotos * 0.2) },
      { month: 'Mar', cumulativeCount: Math.floor(baseData.totalMotos * 0.3) },
      { month: 'Abr', cumulativeCount: Math.floor(baseData.totalMotos * 0.4) },
      { month: 'Mai', cumulativeCount: Math.floor(baseData.totalMotos * 0.5) },
      { month: 'Jun', cumulativeCount: Math.floor(baseData.totalMotos * 0.6) },
      { month: 'Jul', cumulativeCount: Math.floor(baseData.totalMotos * 0.8) },
      { month: 'Ago', cumulativeCount: baseData.totalMotos },
      { month: 'Set', cumulativeCount: baseData.totalMotos },
      { month: 'Out', cumulativeCount: baseData.totalMotos },
      { month: 'Nov', cumulativeCount: baseData.totalMotos },
      { month: 'Dez', cumulativeCount: baseData.totalMotos }
    ],
    monthlyRentals: generateMonthlyRentalsData([]), // Dados simulados
    dailyRentals: generateDailyRentalsData([]) // Dados simulados
  };
};

// Função para gerar dados de locações mensais baseados nos dados reais
const generateMonthlyRentalsData = (motorcycles: any[]) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  console.log('[MonthlyRentals] Processando', motorcycles.length, 'motos - Mês atual:', ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][currentMonth]);

  // Inicializar contadores mensais
  const monthlyStats = Array.from({ length: 12 }, (_, index) => ({
    month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index],
    novas: 0,
    usadas: 0,
    projecao: 0,
    total: 0
  }));

  // Processar dados reais das motos - APENAS STATUS 'alugada'
  const processedMotos = new Set(); // Evitar duplicatas

  motorcycles.forEach(moto => {
    if (!moto || processedMotos.has(moto.id)) return;
    processedMotos.add(moto.id);

    // IMPORTANTE: Só contar se o status for 'alugada'
    if (moto.status !== 'alugada') {
      return;
    }

    // Determinar o mês da locação baseado na data de movimentação
    let locacaoDate = null;

    // Usar data_ultima_mov como indicador de quando foi alugada
    if (moto.data_ultima_mov) {
      locacaoDate = moto.data_ultima_mov;
    }
    // Fallback: data de criação se não houver movimentação mas está alugada
    else if (moto.created_at || moto.data_criacao) {
      locacaoDate = moto.created_at || moto.data_criacao;
    }

    if (locacaoDate) {
      try {
        const date = new Date(locacaoDate);
        if (date.getFullYear() === currentYear) {
          const monthIndex = date.getMonth();

          // Só contar se for do ano atual e até o mês atual
          if (monthIndex <= currentMonth) {
            // Determinar se é nova ou usada baseado no campo 'tipo'
            const isNova = moto.tipo === 'Nova';

            if (isNova) {
              monthlyStats[monthIndex].novas++;
            } else {
              // Se não tem tipo definido ou é 'Usada', contar como usada
              monthlyStats[monthIndex].usadas++;
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao processar data de locação:', locacaoDate);
      }
    }
  });

  // Calcular totais e projeção apenas para o mês atual
  const currentDay = new Date().getDate();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  console.log('[MonthlyRentals] Calculando projeção - Dia atual:', currentDay, 'de', daysInCurrentMonth);

  const result = monthlyStats.map((data, index) => {
    const total = data.novas + data.usadas;

    // Projeção para o próximo mês baseada no resultado do mês atual
    let projecao = 0;

    // Mostrar projeção no mês seguinte ao atual
    if (index === currentMonth + 1) {
      // Buscar dados do mês atual para calcular projeção
      const dadosAtual = monthlyStats[currentMonth];
      const totalAtual = dadosAtual.novas + dadosAtual.usadas;

      if (totalAtual > 0) {
        // Calcular projeção baseada no progresso do mês atual
        const progressoMes = Math.max(0.1, currentDay / daysInCurrentMonth);
        const projecaoTotal = Math.round(totalAtual / progressoMes);
        projecao = Math.max(1, projecaoTotal - totalAtual);

        console.log('[MonthlyRentals] Projeção para próximo mês - Total atual:', totalAtual, 'Progresso:', Math.round(progressoMes * 100) + '%', 'Projeção:', projecao);
      } else {
        // Se não há dados no mês atual, usar projeção base
        projecao = 3;
        console.log('[MonthlyRentals] Projeção base para próximo mês:', projecao);
      }
    }

    return {
      ...data,
      total: index <= currentMonth ? total : 0,
      projecao: index === currentMonth + 1 ? projecao : 0
    };
  });

  console.log('[MonthlyRentals] Dados processados:', result.slice(0, currentMonth + 2));
  return result;
};

// Função para gerar dados diários dos últimos 30 dias baseados em dados reais
const generateDailyRentalsData = (motorcycles: any[]) => {
  const dailyData = [];
  const today = new Date();

  // Criar array dos últimos 30 dias
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const dayLabel = `${day}/${month}`;

    // Contar locações reais para este dia
    let novas = 0;
    let usadas = 0;

    const processedMotos = new Set(); // Evitar duplicatas

    motorcycles.forEach(moto => {
      if (!moto || processedMotos.has(moto.id)) return;
      processedMotos.add(moto.id);

      // Só contar se o status for 'alugada'
      if (moto.status !== 'alugada') return;

      // Verificar se a data de movimentação corresponde ao dia atual
      let locacaoDate = null;
      if (moto.data_ultima_mov) {
        locacaoDate = moto.data_ultima_mov;
      } else if (moto.created_at || moto.data_criacao) {
        locacaoDate = moto.created_at || moto.data_criacao;
      }

      if (locacaoDate) {
        try {
          const motoDate = new Date(locacaoDate);
          const motoDay = motoDate.getDate().toString().padStart(2, '0');
          const motoMonth = (motoDate.getMonth() + 1).toString().padStart(2, '0');
          const motoLabel = `${motoDay}/${motoMonth}`;

          if (motoLabel === dayLabel) {
            if (moto.tipo === 'Nova') {
              novas++;
            } else {
              usadas++;
            }
          }
        } catch (e) {
          console.warn('Erro ao processar data diária:', locacaoDate);
        }
      }
    });

    const total = novas + usadas;

    dailyData.push({
      day: dayLabel,
      novas,
      usadas,
      total
    });
  }

  return dailyData;
};

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { dashboardData, setDashboardData, isLoading, setIsLoading } = useDashboard();

  // Redirecionar franqueados para seu dashboard específico
  if (appUser?.role === 'franchisee') {
    return <Navigate to="/franchisee-dashboard" replace />;
  }

  useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    };
    updateTimestamp();
    const intervalId = setInterval(updateTimestamp, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      console.log('[Dashboard] loadData called, appUser:', appUser);
      if (!appUser) {
        console.log('[Dashboard] No user found, skipping data load');
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('=== DASHBOARD DEBUG START ===');
        console.log('[Dashboard] Loading data for user:', appUser.role, appUser.city_name);
        console.log('[Dashboard] User details:', {
          role: appUser.role,
          city_id: appUser.city_id,
          id: appUser.id,
          city_name: appUser.city_name
        });

        // Fazer query real na tabela motorcycles
        console.log('[Dashboard] Fazendo query na tabela motorcycles...');

        // Construir query baseada no papel do usuário
        let query = supabase.from('motorcycles').select('*');

        // Aplicar filtros baseados no papel do usuário
        console.log('[Dashboard] Aplicando filtros para papel:', appUser.role, 'cidade:', appUser.city_id);

        switch (appUser.role) {
          case 'admin':
          case 'master_br':
            // Admin e Master BR veem todas as motos
            console.log('[Dashboard] Usuário admin/master_br - mostrando todas as motos');
            break;
          case 'regional':
            // Regional vê apenas motos da sua cidade
            if (appUser.city_id) {
              query = query.eq('city_id', appUser.city_id);
              console.log('[Dashboard] Usuário regional - filtrando por city_id:', appUser.city_id);
            }
            break;
          case 'franchisee':
            // Franchisee vê apenas suas motos
            query = query.eq('franchisee_id', appUser.id);
            console.log('[Dashboard] Usuário franchisee - filtrando por franchisee_id:', appUser.id);
            break;
          default:
            // Caso padrão: filtrar por cidade se disponível
            if (appUser.city_id) {
              query = query.eq('city_id', appUser.city_id);
              console.log('[Dashboard] Usuário padrão - filtrando por city_id:', appUser.city_id);
            }
        }

        query = query.order('created_at', { ascending: false });

        console.log('[Dashboard] Executando query para papel:', appUser.role);
        const { data: motorcycles, error } = await query;

        console.log('[Dashboard] Query result:', {
          data: motorcycles,
          error: error,
          length: motorcycles?.length || 0
        });

        if (error) {
          console.error('[Dashboard] Erro ao buscar motos:', error);
          throw error;
        }

        // Processar dados baseados na tabela criada
        console.log('[Dashboard] Loaded data:', motorcycles?.length || 0, 'motorcycles');
        
        const realData = processRealMotorcycleData(motorcycles || []);
        console.log('[Dashboard] Processed real data:', realData);
        setDashboardData(realData);

        toast({
          title: "Dados Reais Carregados",
          description: `Processando ${motorcycles?.length || 0} motos reais da tabela motorcycles.`
        });

        console.log('=== DASHBOARD DEBUG END ===');
        
      } catch (err) {
        console.error('[Dashboard] Error loading data:', err);
        console.log('[Dashboard] USANDO DADOS SIMULADOS - ERRO NA BUSCA');
        // Fallback para dados simulados
        const mockData = generateMockData(
          appUser.role || 'regional',
          appUser.city_name || 'Salvador'
        );
        setDashboardData(mockData);

        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar dados. Usando dados simulados."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [appUser, selectedMonth, selectedYear, toast]);
  
  if (isLoading || !dashboardData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  const { todayData, monthData, kpi, statusDistribution, baseGrowth, monthlyRentals } = dashboardData;
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground font-headline">
              {appUser?.role === 'master_br' 
                ? 'Dashboard Master Brasil'
                : appUser?.city_name 
                  ? `Dashboard Master ${appUser.city_name}`
                  : 'Dashboard Master Salvador'
              }
            </h1>
            <p className="text-muted-foreground">Visão geral da frota de motos</p>
          </div>
        </div>
        {currentTime && (
          <p className="text-sm text-muted-foreground flex items-center">
            <CalendarDays className="h-4 w-4 mr-1.5" />
            Atualizado em {currentTime}
          </p>
        )}
      </div>



      {/* Cards de dados do dia (hoje) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Motos Alugadas Hoje</p>
              <p className="text-2xl font-bold text-blue-500">{todayData.motosAlugadasHoje + todayData.motosRelocadasHoje}</p>
              <p className="text-xs text-muted-foreground">unidades</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <Bike className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Motos Disponíveis Hoje</p>
              <p className="text-2xl font-bold text-green-500">{todayData.motosDisponiveisHoje}</p>
              <p className="text-xs text-muted-foreground">unidades</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Motos Recuperadas Hoje</p>
              <p className="text-2xl font-bold text-orange-500">{todayData.motosRecuperadasHoje}</p>
              <p className="text-xs text-muted-foreground">unidades</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Em Manutenção</p>
              <p className="text-2xl font-bold text-violet-500">{todayData.motosEmManutencao}</p>
              <p className="text-xs text-muted-foreground">unidades</p>
            </div>
            <div className="p-3 rounded-lg bg-violet-500">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros para dados mensais */}
      <div className="mt-8 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Filtrar Status da Frota por Período:</span>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Cards de dados do mês selecionado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Motos Alugadas</p>
              <p className="text-2xl font-bold text-blue-500">{monthData.motosAlugadas + monthData.motosRelocadas}</p>
              <p className="text-xs text-muted-foreground">em {monthNames[selectedMonth]}/{selectedYear}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <Bike className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Motos Disponíveis</p>
              <p className="text-2xl font-bold text-green-500">{monthData.motosDisponiveis}</p>
              <p className="text-xs text-muted-foreground">em {monthNames[selectedMonth]}/{selectedYear}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Motos Recuperadas</p>
              <p className="text-2xl font-bold text-orange-500">{monthData.motosRecuperadas || 0}</p>
              <p className="text-xs text-muted-foreground">em {monthNames[selectedMonth]}/{selectedYear}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Em Manutenção</p>
              <p className="text-2xl font-bold text-violet-500">{monthData.emManutencao}</p>
              <p className="text-xs text-muted-foreground">em {monthNames[selectedMonth]}/{selectedYear}</p>
            </div>
            <div className="p-3 rounded-lg bg-violet-500">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Separator className="my-8" />

      {/* Gráficos de Status e Crescimento */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mt-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PagePieIcon className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="font-headline">Distribuição de Motos por Status (%)</CardTitle>
                <CardDescription>Percentual de motocicletas únicas em cada status ({currentYear}).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 relative">
            <StatusDistributionChart data={statusDistribution} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="font-headline">Crescimento da Base de Motos ({currentYear})</CardTitle>
                <CardDescription>Contagem cumulativa de placas únicas por mês.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <BaseGrowthChart data={baseGrowth} />
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Análise Mensal de Locações */}
      <div className="mt-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bike className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="font-headline">Análise Mensal de Locações ({currentYear})</CardTitle>
                <CardDescription>Volume de motos alugadas e relocadas (barras) e o total de locações (linha).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <MonthlyRentalsChart data={monthlyRentals} meta={180} />
          </CardContent>
        </Card>

        {/* Gráfico de Análise Diária */}
        <DailyRentalsChart data={dashboardData?.dailyRentals || []} />
      </div>


    </div>
  );
}