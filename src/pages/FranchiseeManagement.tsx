import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Grid3x3, TableIcon, Car, Settings, AlertTriangle, CheckCircle, Shield, Wifi, FileText, Bike, BarChart3, Wrench, Clock, XCircle, DollarSign, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Franchisee {
  id: string;
  cnpj: string;
  company_name: string;
  fantasy_name: string;
  cpf?: string;
  endereco?: string;
  email?: string;
  whatsapp_01?: string;
  whatsapp_02?: string;
  city_id: string;
  status: string;
  cities?: {
    name: string;
  };
  app_users?: {
    email: string;
  };
  created_at: string;
}

interface City {
  id: string;
  name: string;
}

interface Motorcycle {
  id: string;
  placa: string;
  modelo: string;
  status: 'active' | 'alugada' | 'relocada' | 'manutencao' | 'recolhida' | 'indisponivel_rastreador' | 'indisponivel_emplacamento' | 'inadimplente' | 'renegociado' | 'furto_roubo';
  data_ultima_mov?: string;
  data_criacao?: string;
  city_id?: string;
  franchisee_id?: string;
  franqueado?: string;
}

interface FranchiseeFleetStatus {
  franqueadoName: string;
  counts: {
    alugada: number;
    active: number; // Disponível
    manutencao: number;
    relocada: number;
    renegociado: number;
    recolhida: number;
    inadimplente: number;
    indisponivel_rastreador: number;
    indisponivel_emplacamento: number;
    furto_roubo: number;
  };
  totalGeral: number;
  percentLocadas: number;
  percentManutencao: number;
  percentDisponivel: number;
}

interface CityFleetStatus {
  cityName: string;
  counts: {
    alugada: number;
    active: number; // Disponível
    manutencao: number;
    relocada: number;
    renegociado: number;
    recolhida: number;
    inadimplente: number;
    indisponivel_rastreador: number;
    indisponivel_emplacamento: number;
    furto_roubo: number;
  };
  totalGeral: number;
  percentLocadas: number;
  percentManutencao: number;
  percentDisponivel: number;
}

export default function FranchiseeManagement() {
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { appUser } = useAuth();

  // Debug: Log para verificar se a página está sendo carregada
  console.log('[FranchiseeManagement] Página carregada, role do usuário:', appUser?.role);
  const { toast } = useToast();

  // Estados para a funcionalidade da frota
  const [allMotorcycles, setAllMotorcycles] = useState<Motorcycle[]>([]);
  const [processedData, setProcessedData] = useState<FranchiseeFleetStatus[]>([]);
  const [cityProcessedData, setCityProcessedData] = useState<CityFleetStatus[]>([]);
  const [selectedFranchisee, setSelectedFranchisee] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    fetchFranchisees();
    fetchCities();
    fetchMotorcyclesForFleet();
  }, []);

  // useEffect para processar dados da frota
  useEffect(() => {
    if (isLoading) {
      setProcessedData([]);
      return;
    }

    // Filter logic
    const filteredMotorcycles = allMotorcycles.filter(moto => {
        const isFranchiseeMatch = !selectedFranchisee || (moto.franqueado?.toLowerCase().includes(selectedFranchisee.toLowerCase()));
        
        // Date filtering logic
        const motoDate = moto.data_ultima_mov ? new Date(moto.data_ultima_mov) : null;
        let isDateMatch = true;
        if(startDate && endDate && motoDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            motoDate.setHours(0,0,0,0);
            isDateMatch = motoDate >= start && motoDate <= end;
        } else if (startDate && motoDate) {
            const start = new Date(startDate);
            start.setHours(0,0,0,0);
            motoDate.setHours(0,0,0,0);
            isDateMatch = motoDate >= start;
        } else if (endDate && motoDate) {
            const end = new Date(endDate);
            end.setHours(23,59,59,999);
            motoDate.setHours(0,0,0,0);
            isDateMatch = motoDate <= end;
        }

        return isFranchiseeMatch && isDateMatch;
    });

    // Aplicar regra de placas únicas: considerar apenas a última atualização por placa
    const uniqueMotorcyclesByPlaca: { [placa: string]: Motorcycle } = {};
    filteredMotorcycles.forEach(moto => {
      if (!moto.placa) return;
      const existingMoto = uniqueMotorcyclesByPlaca[moto.placa];
      if (!existingMoto ||
          (moto.data_ultima_mov && existingMoto.data_ultima_mov && new Date(moto.data_ultima_mov) > new Date(existingMoto.data_ultima_mov)) ||
          (moto.data_ultima_mov && !existingMoto.data_ultima_mov)) {
        uniqueMotorcyclesByPlaca[moto.placa] = moto;
      }
    });
    const representativeMotorcycles = Object.values(uniqueMotorcyclesByPlaca);

    const franchiseeStats: Record<string, {
      counts: { [K in Motorcycle['status']]: number } & { indefinido: number };
      totalGeral: number;
    }> = {};

    representativeMotorcycles.forEach(moto => {
      const frNameTrimmed = moto.franqueado?.trim();

      if (!frNameTrimmed || frNameTrimmed === "Não Especificado" || frNameTrimmed === "") {
        return;
      }
      
      const frName = frNameTrimmed;

      if (!franchiseeStats[frName]) {
        franchiseeStats[frName] = {
          counts: {
            active: 0,
            alugada: 0,
            manutencao: 0,
            relocada: 0,
            renegociado: 0,
            recolhida: 0,
            inadimplente: 0,
            indisponivel_rastreador: 0,
            indisponivel_emplacamento: 0,
            furto_roubo: 0,
            indefinido: 0,
          },
          totalGeral: 0,
        };
      }

      const status = moto.status;
      if (status && ['active', 'alugada', 'manutencao', 'relocada', 'renegociado', 'recolhida', 'inadimplente', 'indisponivel_rastreador', 'indisponivel_emplacamento', 'furto_roubo'].includes(status)) {
        franchiseeStats[frName].counts[status as Motorcycle['status']]++;
      } else {
        franchiseeStats[frName].counts.indefinido++;
      }
      franchiseeStats[frName].totalGeral++;
    });

    const dataForTable: FranchiseeFleetStatus[] = Object.entries(franchiseeStats).map(([name, stats]) => {
      const totalLocadasCount = stats.counts.alugada + stats.counts.relocada + stats.counts.renegociado;
      const percentLocadas = stats.totalGeral > 0 ? (totalLocadasCount / stats.totalGeral) * 100 : 0;
      const percentManutencao = stats.totalGeral > 0 ? (stats.counts.manutencao / stats.totalGeral) * 100 : 0;
      const percentDisponivel = stats.totalGeral > 0 ? (stats.counts.active / stats.totalGeral) * 100 : 0;
      
      return {
        franqueadoName: name,
        counts: {
          alugada: stats.counts.alugada,
          active: stats.counts.active,
          manutencao: stats.counts.manutencao,
          relocada: stats.counts.relocada,
          renegociado: stats.counts.renegociado,
          recolhida: stats.counts.recolhida,
          inadimplente: stats.counts.inadimplente,
          indisponivel_rastreador: stats.counts.indisponivel_rastreador,
          indisponivel_emplacamento: stats.counts.indisponivel_emplacamento,
          furto_roubo: stats.counts.furto_roubo,
        },
        totalGeral: stats.totalGeral,
        percentLocadas,
        percentManutencao,
        percentDisponivel,
      };
    }).sort((a, b) => b.totalGeral - a.totalGeral); 

    setProcessedData(dataForTable);

    // Processar dados por cidade para a aba Operações
    const cityStats: Record<string, {
      counts: { [K in Motorcycle['status']]: number } & { indefinido: number };
      totalGeral: number;
    }> = {};

    representativeMotorcycles.forEach(moto => {
      // Buscar o nome da cidade
      const city = cities.find(c => c.id === moto.city_id);
      const cityName = city ? city.name : 'Cidade Não Identificada';

      if (!cityStats[cityName]) {
        cityStats[cityName] = {
          counts: {
            active: 0,
            alugada: 0,
            manutencao: 0,
            relocada: 0,
            renegociado: 0,
            recolhida: 0,
            inadimplente: 0,
            indisponivel_rastreador: 0,
            indisponivel_emplacamento: 0,
            furto_roubo: 0,
            indefinido: 0,
          },
          totalGeral: 0,
        };
      }

      const status = moto.status;
      if (status && ['active', 'alugada', 'manutencao', 'relocada', 'renegociado', 'recolhida', 'inadimplente', 'indisponivel_rastreador', 'indisponivel_emplacamento', 'furto_roubo'].includes(status)) {
        cityStats[cityName].counts[status as Motorcycle['status']]++;
      } else {
        cityStats[cityName].counts.indefinido++;
      }
      cityStats[cityName].totalGeral++;
    });

    const dataForCities: CityFleetStatus[] = Object.entries(cityStats).map(([name, stats]) => {
      const totalLocadasCount = stats.counts.alugada + stats.counts.relocada + stats.counts.renegociado;
      const percentLocadas = stats.totalGeral > 0 ? (totalLocadasCount / stats.totalGeral) * 100 : 0;
      const percentManutencao = stats.totalGeral > 0 ? (stats.counts.manutencao / stats.totalGeral) * 100 : 0;
      const percentDisponivel = stats.totalGeral > 0 ? (stats.counts.active / stats.totalGeral) * 100 : 0;
      
      return {
        cityName: name,
        counts: {
          alugada: stats.counts.alugada,
          active: stats.counts.active,
          manutencao: stats.counts.manutencao,
          relocada: stats.counts.relocada,
          renegociado: stats.counts.renegociado,
          recolhida: stats.counts.recolhida,
          inadimplente: stats.counts.inadimplente,
          indisponivel_rastreador: stats.counts.indisponivel_rastreador,
          indisponivel_emplacamento: stats.counts.indisponivel_emplacamento,
          furto_roubo: stats.counts.furto_roubo,
        },
        totalGeral: stats.totalGeral,
        percentLocadas,
        percentManutencao,
        percentDisponivel,
      };
    }).sort((a, b) => b.totalGeral - a.totalGeral);

    setCityProcessedData(dataForCities);

  }, [allMotorcycles, isLoading, selectedFranchisee, selectedCity, startDate, endDate, cities]);

  // useEffect para recarregar dados quando o usuário estiver disponível
  useEffect(() => {
    if (appUser) {
      fetchMotorcyclesForFleet();
    }
  }, [appUser]);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar cidades:', error);
    }
  };

  const fetchMotorcyclesForFleet = async () => {
    try {
      console.log('[FranchiseeManagement] Buscando dados das motos para análise da frota...');
      console.log('[FranchiseeManagement] Usuário atual:', appUser);

      // Primeiro, buscar dados dos franqueados para criar o mapeamento
      const { data: franchiseesData, error: franchiseesError } = await supabase
        .from('franchisees')
        .select('id, company_name, fantasy_name, user_id');

      console.log('[FranchiseeManagement] Dados dos franqueados:', { franchiseesData, franchiseesError });

      if (franchiseesError) {
        console.error('[FranchiseeManagement] Erro ao buscar franqueados:', franchiseesError);
      }

      // Criar mapeamento de user_id para nome do franqueado
      // O franchisee_id na tabela motorcycles armazena o user_id do franqueado
      const franchiseeMap: Record<string, string> = {};
      franchiseesData?.forEach(franchisee => {
        if (franchisee.user_id) {
          const name = franchisee.fantasy_name || franchisee.company_name;
          franchiseeMap[franchisee.user_id] = name;
        }
      });

      console.log('[FranchiseeManagement] Mapeamento de franqueados:', franchiseeMap);
      
      // Construir query baseada no papel do usuário
      let query = supabase.from('motorcycles').select('*');

      // Aplicar filtros baseados no papel do usuário
      switch (appUser?.role) {
        case 'admin':
        case 'master_br':
          // Admin e Master BR veem todas as motos
          console.log('[FranchiseeManagement] Usuário admin/master_br - mostrando todas as motos');
          break;
        case 'regional':
          // Regional vê apenas motos da sua cidade
          if (appUser.city_id) {
            query = query.eq('city_id', appUser.city_id);
            console.log('[FranchiseeManagement] Filtrando por city_id:', appUser.city_id);
          }
          break;
        case 'franchisee':
          // Franqueado vê apenas suas próprias motos
          console.log('[FranchiseeManagement] Usuário é franqueado, buscando dados do franchisee...');
          if (appUser.id) {
            // Buscar o franchisee_id do usuário atual
            console.log('[FranchiseeManagement] Buscando franchisee para user_id:', appUser.id);
            const { data: franchiseeData, error: franchiseeError } = await supabase
              .from('franchisees')
              .select('id')
              .eq('user_id', appUser.id)
              .single();

            console.log('[FranchiseeManagement] Resultado da busca do franchisee:', { franchiseeData, franchiseeError });

            if (franchiseeData?.id) {
              // O franchisee_id na tabela motorcycles armazena o user_id, não o id da tabela franchisees
              query = query.eq('franchisee_id', appUser.id);
              console.log('[FranchiseeManagement] Filtrando por franchisee_id (user_id):', appUser.id);
            }
          }
          break;
        default:
          console.log('[FranchiseeManagement] Papel de usuário:', appUser?.role);
      }

      query = query.order('created_at', { ascending: false });

      const { data: motorcycles, error } = await query;

      if (error) {
        console.error('[FranchiseeManagement] Erro ao buscar motos:', error);
        return;
      }

      console.log('[FranchiseeManagement] Dados das motos carregados:', motorcycles?.length || 0, 'motos');

      // Converter dados para o formato esperado
      const formattedMotorcycles: Motorcycle[] = (motorcycles || []).map((moto: any) => {
        // Determinar o nome do franqueado baseado nos dados disponíveis
        let franqueadoName = 'Não Especificado';
        
        // 1. Priorizar o campo franqueado direto se existir
        if (moto.franqueado && moto.franqueado.trim() !== '') {
          franqueadoName = moto.franqueado.trim();
        }
        // 2. Buscar pelo franchisee_id no mapeamento
        else if (moto.franchisee_id && franchiseeMap[moto.franchisee_id]) {
          franqueadoName = franchiseeMap[moto.franchisee_id];
        }
        // 3. Se tem franchisee_id mas não encontrou no mapeamento
        else if (moto.franchisee_id) {
          franqueadoName = `Franqueado ID: ${moto.franchisee_id}`;
        }

        return {
          id: moto.id,
          placa: moto.placa || '',
          modelo: moto.modelo || '',
          status: (['active', 'alugada', 'relocada', 'manutencao', 'recolhida', 'indisponivel_rastreador', 'indisponivel_emplacamento', 'inadimplente', 'renegociado', 'furto_roubo'].includes(moto.status) 
            ? moto.status as Motorcycle['status'] 
            : 'active'),
          data_ultima_mov: moto.data_ultima_mov,
          data_criacao: moto.data_criacao || moto.created_at,
          city_id: moto.city_id,
          franchisee_id: moto.franchisee_id,
          franqueado: franqueadoName
        };
      });

      console.log('[FranchiseeManagement] Motos formatadas:', formattedMotorcycles.length);
      console.log('[FranchiseeManagement] Franqueados únicos encontrados:', 
        Array.from(new Set(formattedMotorcycles.map(m => m.franqueado))).filter(f => f !== 'Não Especificado')
      );

      setAllMotorcycles(formattedMotorcycles);

    } catch (error) {
      console.error('[FranchiseeManagement] Erro ao carregar dados da frota:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados da frota."
      });
    }
  };

  const fetchFranchisees = async () => {
    try {
      setIsLoading(true);
      
      let query = (supabase as any)
        .from('franchisees')
        .select(`
          *,
          cities:city_id (name),
          app_users:user_id (email)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros baseados no papel do usuário
      if (appUser?.role === 'regional' && appUser.city_id) {
        // Regional vê franqueados da sua cidade
        query = query.eq('city_id', appUser.city_id);
      } else if (appUser?.role === 'franchisee' && appUser.id) {
        // Franqueado vê apenas seus próprios dados
        query = query.eq('user_id', appUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFranchisees(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar franqueados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao carregar franqueados."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const franchiseeData = {
      cnpj: (formData.get('cnpj') as string).replace(/\D/g, ''),
      company_name: formData.get('company_name') as string,
      fantasy_name: formData.get('fantasy_name') as string,
      cpf: (formData.get('cpf') as string)?.replace(/\D/g, '') || null,
      endereco: formData.get('endereco') as string || null,
      email: formData.get('email') as string || null,
      whatsapp_01: (formData.get('whatsapp_01') as string)?.replace(/\D/g, '') || null,
      whatsapp_02: (formData.get('whatsapp_02') as string)?.replace(/\D/g, '') || null,
      city_id: formData.get('city_id') as string,
    };

    try {
      const { error } = await (supabase as any)
        .from('franchisees')
        .insert(franchiseeData);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Franqueado cadastrado com sucesso."
      });

      setIsDialogOpen(false);
      fetchFranchisees();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao cadastrar franqueado."
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // Função para obter configurações de estilo para cada status
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { 
      label: string; 
      description: string; 
      bgColor: string; 
      borderColor: string; 
      iconBg: string; 
      textColor: string; 
      icon: any; 
    }> = {
      'active': { 
        label: 'Disponível', 
        description: 'Pronta para uso', 
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-500', 
        iconBg: 'bg-green-100', 
        textColor: 'text-green-600', 
        icon: CheckCircle 
      },
      'alugada': { 
        label: 'Alugada', 
        description: 'Em operação', 
        bgColor: 'bg-blue-50', 
        borderColor: 'border-blue-500', 
        iconBg: 'bg-blue-100', 
        textColor: 'text-blue-600', 
        icon: Car 
      },
      'relocada': { 
        label: 'Relocada', 
        description: 'Em realocação', 
        bgColor: 'bg-cyan-50', 
        borderColor: 'border-cyan-500', 
        iconBg: 'bg-cyan-100', 
        textColor: 'text-cyan-600', 
        icon: MapPin 
      },
      'manutencao': { 
        label: 'Manutenção', 
        description: 'Em oficina', 
        bgColor: 'bg-purple-50', 
        borderColor: 'border-purple-500', 
        iconBg: 'bg-purple-100', 
        textColor: 'text-purple-600', 
        icon: Wrench 
      },
      'recolhida': { 
        label: 'Recolhida', 
        description: 'Aguardando', 
        bgColor: 'bg-orange-50', 
        borderColor: 'border-orange-500', 
        iconBg: 'bg-orange-100', 
        textColor: 'text-orange-600', 
        icon: AlertTriangle 
      },
      'renegociado': { 
        label: 'Renegociado', 
        description: 'Em renegociação', 
        bgColor: 'bg-yellow-50', 
        borderColor: 'border-yellow-500', 
        iconBg: 'bg-yellow-100', 
        textColor: 'text-yellow-600', 
        icon: DollarSign 
      },
      'inadimplente': { 
        label: 'Inadimplente', 
        description: 'Pagamento pendente', 
        bgColor: 'bg-red-50', 
        borderColor: 'border-red-500', 
        iconBg: 'bg-red-100', 
        textColor: 'text-red-600', 
        icon: XCircle 
      },
      'indisponivel_rastreador': { 
        label: 'Indisponível - Rastreador', 
        description: 'Problema no rastreador', 
        bgColor: 'bg-gray-50', 
        borderColor: 'border-gray-500', 
        iconBg: 'bg-gray-100', 
        textColor: 'text-gray-600', 
        icon: Wifi 
      },
      'indisponivel_emplacamento': { 
        label: 'Indisponível - Emplacamento', 
        description: 'Problema na documentação', 
        bgColor: 'bg-slate-50', 
        borderColor: 'border-slate-500', 
        iconBg: 'bg-slate-100', 
        textColor: 'text-slate-600', 
        icon: FileText 
      },
      'furto_roubo': { 
        label: 'Furto/Roubo', 
        description: 'Ocorrência registrada', 
        bgColor: 'bg-rose-50', 
        borderColor: 'border-rose-500', 
        iconBg: 'bg-rose-100', 
        textColor: 'text-rose-600', 
        icon: Shield 
      }
    };

    return configs[status] || { 
      label: status.charAt(0).toUpperCase() + status.slice(1), 
      description: 'Status não definido', 
      bgColor: 'bg-neutral-50', 
      borderColor: 'border-neutral-500', 
      iconBg: 'bg-neutral-100', 
      textColor: 'text-neutral-600', 
      icon: Clock 
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                {appUser?.role === 'franchisee' ? 'Minha Frota' : 'Franqueados - Análise por franqueado'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {appUser?.role === 'franchisee'
                  ? 'Visualize e acompanhe o status da sua frota de motocicletas'
                  : 'Cadastre e analise a performance dos franqueados da sua região'
                }
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue={appUser?.role === 'franchisee' ? 'frota-tabela' : 'cadastro'} className="w-full">
        <TabsList className={`grid w-full ${
          appUser?.role === 'admin' || appUser?.role === 'master_br' ? 'grid-cols-4' :
          appUser?.role === 'franchisee' ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {/* Franqueados não veem a aba de Cadastro */}
          {appUser?.role !== 'franchisee' && (
            <TabsTrigger value="cadastro" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Cadastro
            </TabsTrigger>
          )}
          <TabsTrigger value="frota-tabela" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Frota - Tabela
          </TabsTrigger>
          <TabsTrigger value="frota-cards" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Frota - Cards
          </TabsTrigger>
          {(appUser?.role === 'admin' || appUser?.role === 'master_br') && (
            <TabsTrigger value="operacoes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Operações
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Franqueados não veem o conteúdo de cadastro */}
        {appUser?.role !== 'franchisee' && (
          <TabsContent value="cadastro">{renderCadastroContent()}</TabsContent>
        )}
        <TabsContent value="frota-tabela">{renderFrotaTabelaContent()}</TabsContent>
        <TabsContent value="frota-cards">{renderFrotaCardsContent()}</TabsContent>
        {(appUser?.role === 'admin' || appUser?.role === 'master_br') && (
          <TabsContent value="operacoes">{renderOperacoesContent()}</TabsContent>
        )}
      </Tabs>
    </div>
  );

  // Função para renderizar o conteúdo da aba Cadastro (conteúdo original)
  function renderCadastroContent() {
    return (
      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Gestão de Franqueados</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cadastre e gerencie franqueados da sua região
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Cadastrar Franqueado</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Franqueado</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Linha 1: CNPJ */}
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      placeholder="00.000.000/0001-00"
                      maxLength={18}
                      required
                    />
                  </div>

                  {/* Linha 2: Razão Social */}
                  <div>
                    <Label htmlFor="company_name">Razão Social</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>

                  {/* Linha 3: Nome Fantasia */}
                  <div>
                    <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                    <Input
                      id="fantasy_name"
                      name="fantasy_name"
                      placeholder="Nome fantasia (opcional)"
                    />
                  </div>

                  {/* Linha 4: CPF */}
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      placeholder="032.018.675-00"
                      maxLength={14}
                    />
                  </div>

                  {/* Linha 5: Endereço */}
                  <div>
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      name="endereco"
                      placeholder="SALVADOR, BA. Bairro PIATÃ, rua RUA DOS AZULÕES, N° 0"
                    />
                  </div>

                  {/* Linha 6: Email */}
                  <div>
                    <Label htmlFor="email">email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="williaquison@gmail.com"
                    />
                  </div>

                  {/* Linha 7: WhatsApp 01 */}
                  <div>
                    <Label htmlFor="whatsapp_01">Whatsapp 01</Label>
                    <Input
                      id="whatsapp_01"
                      name="whatsapp_01"
                      placeholder="(71) 9 8328-293"
                      maxLength={16}
                    />
                  </div>

                  {/* Linha 8: WhatsApp 02 */}
                  <div>
                    <Label htmlFor="whatsapp_02">Whatsapp 02</Label>
                    <Input
                      id="whatsapp_02"
                      name="whatsapp_02"
                      placeholder="(71) 9 8328-293"
                      maxLength={16}
                    />
                  </div>

                  {/* Linha 9: Cidade */}
                  <div>
                    <Label htmlFor="city_id">Cidade</Label>
                    <Select name="city_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    Cadastrar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando franqueados...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário Vinculado</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {franchisees.map((franchisee) => (
                  <TableRow key={franchisee.id}>
                    <TableCell className="font-mono text-sm">
                      {formatCNPJ(franchisee.cnpj)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {franchisee.company_name}
                    </TableCell>
                    <TableCell>
                      {franchisee.fantasy_name || '-'}
                    </TableCell>
                    <TableCell>
                      {franchisee.cities?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(franchisee.status)}
                    </TableCell>
                    <TableCell>
                      {franchisee.app_users?.email ? (
                        <Badge variant="outline">Vinculado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(franchisee.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-medium">Como funciona:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Cadastre franqueados informando CNPJ e dados da empresa</li>
              <li>• O franqueado acessa o sistema pelo botão "Acesso para Franqueados"</li>
              <li>• No primeiro acesso, ele criará sua senha usando o CNPJ</li>
              <li>• Após isso, poderá fazer login normalmente com CNPJ + senha</li>
            </ul>
          </div>
        </CardContent>
        </Card>
      </div>
    );
  }

  // Função para renderizar o conteúdo da aba Frota - Tabela
  function renderFrotaTabelaContent() {
    return (
      <div className="space-y-6 mt-6">
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="franchisee-search">Franqueado</Label>
              <Input
                id="franchisee-search"
                placeholder="Buscar por franqueado"
                value={selectedFranchisee}
                onChange={e => setSelectedFranchisee(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="start-date">Data de Início</Label>
              <Input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Data de Fim</Label>
              <Input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Bike className="h-6 w-6 text-primary" />
              Status da Frota por Franqueado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg min-h-[300px] bg-muted/50">
                <Users className="h-24 w-24 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum dado encontrado para os filtros selecionados.
                  <br />
                  Configure a integração com dados reais da frota para visualizar as análises.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Franqueado</TableHead>
                      <TableHead className="text-right">Alugada</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Manutenção</TableHead>
                      <TableHead className="text-right">Relocada</TableHead>
                      <TableHead className="text-right font-semibold">Total Geral</TableHead>
                      <TableHead className="text-right">
                        <div className="text-xs text-muted-foreground">Meta 91%</div>
                        <div>Locadas</div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="text-xs text-muted-foreground">Meta &lt; 5%</div>
                        <div>Manutenção</div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="text-xs text-muted-foreground">Meta &gt; 4,5%</div>
                        <div>Disponível</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.map((item) => (
                      <TableRow key={item.franqueadoName}>
                        <TableCell className="text-left font-medium">{item.franqueadoName}</TableCell>
                        <TableCell className="text-right">{item.counts.alugada}</TableCell>
                        <TableCell className="text-right">{item.counts.active}</TableCell>
                        <TableCell className="text-right">{item.counts.manutencao}</TableCell>
                        <TableCell className="text-right">{item.counts.relocada}</TableCell>
                        <TableCell className="text-right font-bold">{item.totalGeral}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            item.percentLocadas >= 91
                              ? "bg-green-100 text-green-700"
                              : item.percentLocadas >= 85
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {item.percentLocadas.toFixed(1)}%
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            item.percentManutencao > 5
                              ? "bg-red-100 text-red-700"
                              : item.percentManutencao >= 3
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          )}
                        >
                          {item.percentManutencao.toFixed(1)}%
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            item.percentDisponivel < 4.5
                              ? "bg-green-100 text-green-700"
                              : item.percentDisponivel <= 7
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {item.percentDisponivel.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Função para renderizar o conteúdo da aba Frota - Cards
  function renderFrotaCardsContent() {
    return (
      <div className="space-y-6 mt-6">
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="franchisee-search-cards">Franqueado</Label>
              <Input
                id="franchisee-search-cards"
                placeholder="Buscar por franqueado"
                value={selectedFranchisee}
                onChange={e => setSelectedFranchisee(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="start-date-cards">Data de Início</Label>
              <Input
                type="date"
                id="start-date-cards"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date-cards">Data de Fim</Label>
              <Input
                type="date"
                id="end-date-cards"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Bike className="h-6 w-6 text-primary" />
              Status da Frota por Franqueado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg min-h-[300px] bg-muted/50">
                <Users className="h-24 w-24 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum dado encontrado para os filtros selecionados.
                  <br />
                  Configure a integração com dados reais da frota para visualizar as análises.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {processedData.map((item) => (
                  <Card key={item.franqueadoName} className="shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
                      <CardTitle className="text-lg font-bold text-center flex items-center justify-center gap-2">
                        <Bike className="h-5 w-5" />
                        {item.franqueadoName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {/* Renderizar dinamicamente todos os status com contagem > 0 */}
                        {Object.entries(item.counts)
                          .filter(([status, count]) => count > 0)
                          .map(([status, count]) => {
                            const config = getStatusConfig(status);
                            const Icon = config.icon;
                            const percentage = item.totalGeral > 0 ? ((count / item.totalGeral) * 100).toFixed(0) : 0;
                            
                            return (
                              <div key={status} className={`flex items-center justify-between p-3 ${config.bgColor} rounded-lg border-l-4 ${config.borderColor}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 ${config.iconBg} rounded-full`}>
                                    <Icon className={`h-4 w-4 ${config.textColor}`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">{config.label}</p>
                                    <p className="text-sm text-gray-600">{config.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${config.textColor}`}>{count}</div>
                                  <div className={`text-sm font-medium ${config.textColor}`}>
                                    {percentage}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {/* Total */}
                        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-gray-300 mt-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-200 rounded-full">
                              <Bike className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">TOTAL GERAL</p>
                              <p className="text-sm text-gray-600">Toda a frota</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-800">{item.totalGeral}</div>
                            <div className="text-sm font-medium text-gray-600">100%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Função para renderizar o conteúdo da aba Operações (cópia da aba Frota Cards, mas agrupada por cidade)
  function renderOperacoesContent() {
    return (
      <div className="space-y-6 mt-6">
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city-search-operacoes">Cidade</Label>
              <Input
                id="city-search-operacoes"
                placeholder="Buscar por cidade"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="start-date-operacoes">Data de Início</Label>
              <Input
                type="date"
                id="start-date-operacoes"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date-operacoes">Data de Fim</Label>
              <Input
                type="date"
                id="end-date-operacoes"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Settings className="h-6 w-6 text-primary" />
              Operações - Status da Frota por Cidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cityProcessedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg min-h-[300px] bg-muted/50">
                <Settings className="h-24 w-24 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum dado encontrado para os filtros selecionados.
                  <br />
                  Configure a integração com dados reais da frota para visualizar as análises.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cityProcessedData
                  .filter(item => !selectedCity || item.cityName.toLowerCase().includes(selectedCity.toLowerCase()))
                  .map((item) => (
                  <Card key={item.cityName} className="shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
                      <CardTitle className="text-lg font-bold text-center flex items-center justify-center gap-2">
                        <Settings className="h-5 w-5" />
                        {item.cityName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {/* Renderizar dinamicamente todos os status com contagem > 0 */}
                        {Object.entries(item.counts)
                          .filter(([status, count]) => count > 0)
                          .map(([status, count]) => {
                            const config = getStatusConfig(status);
                            const Icon = config.icon;
                            const percentage = item.totalGeral > 0 ? ((count / item.totalGeral) * 100).toFixed(0) : 0;
                            
                            return (
                              <div key={status} className={`flex items-center justify-between p-3 ${config.bgColor} rounded-lg border-l-4 ${config.borderColor}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 ${config.iconBg} rounded-full`}>
                                    <Icon className={`h-4 w-4 ${config.textColor}`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">{config.label}</p>
                                    <p className="text-sm text-gray-600">{config.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-2xl font-bold ${config.textColor}`}>{count}</div>
                                  <div className={`text-sm font-medium ${config.textColor}`}>
                                    {percentage}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {/* Total */}
                        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-gray-300 mt-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-200 rounded-full">
                              <Bike className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">TOTAL GERAL</p>
                              <p className="text-sm text-gray-600">Toda a frota</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-800">{item.totalGeral}</div>
                            <div className="text-sm font-medium text-gray-600">100%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
}