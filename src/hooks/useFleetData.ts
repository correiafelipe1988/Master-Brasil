import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface FleetStats {
  total: number;
  disponiveis: number;
  alugadas: number;
  manutencao: number;
  recolhidas: number;
}

export function useFleetData() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats>({
    total: 0,
    disponiveis: 0,
    alugadas: 0,
    manutencao: 0,
    recolhidas: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { appUser } = useAuth();

  const fetchFleetData = async () => {
    if (!appUser) return;

    try {
      setIsLoading(true);
      
      // Buscar dados dos franqueados para criar o mapeamento
      const { data: franchiseesData, error: franchiseesError } = await supabase
        .from('franchisees')
        .select('id, company_name, fantasy_name, user_id');

      if (franchiseesError) {
        console.error('Erro ao buscar franqueados:', franchiseesError);
      }

      // Criar mapeamento de user_id para nome do franqueado
      const franchiseeMap: Record<string, string> = {};
      franchiseesData?.forEach(franchisee => {
        if (franchisee.user_id) {
          const name = franchisee.fantasy_name || franchisee.company_name;
          franchiseeMap[franchisee.user_id] = name;
        }
      });

      // Construir query baseada no papel do usuário
      let query = supabase.from('motorcycles').select('*');

      // Aplicar filtros baseados no papel do usuário
      switch (appUser?.role) {
        case 'admin':
        case 'master_br':
          // Admin e Master BR veem todas as motos
          break;
        case 'regional':
          // Regional vê apenas motos da sua cidade
          if (appUser.city_id) {
            query = query.eq('city_id', appUser.city_id);
          }
          break;
        case 'franchisee':
          // Franqueado vê APENAS as motos atribuídas a ele (franchisee_id = user.id)
          console.log('[useFleetData] Usuário franqueado - filtrando por franchisee_id:', appUser.id);
          query = query.eq('franchisee_id', appUser.id);
          break;
        default:
          console.log('Papel de usuário não reconhecido:', appUser?.role);
      }

      query = query.order('created_at', { ascending: false });

      const { data: motorcycles, error } = await query;

      if (error) {
        console.error('Erro ao buscar motos:', error);
        return;
      }

      // Converter dados para o formato esperado
      const formattedMotorcycles: Motorcycle[] = (motorcycles || []).map((moto: any) => {
        let franqueadoName = 'Não Especificado';
        
        if (moto.franqueado && moto.franqueado.trim() !== '') {
          franqueadoName = moto.franqueado.trim();
        } else if (moto.franchisee_id && franchiseeMap[moto.franchisee_id]) {
          franqueadoName = franchiseeMap[moto.franchisee_id];
        } else if (moto.franchisee_id) {
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

      // Aplicar regra de placas únicas: considerar apenas a última atualização por placa
      const uniqueMotorcyclesByPlaca: { [placa: string]: Motorcycle } = {};
      formattedMotorcycles.forEach(moto => {
        if (!moto.placa) return;
        const existingMoto = uniqueMotorcyclesByPlaca[moto.placa];
        if (!existingMoto ||
            (moto.data_ultima_mov && existingMoto.data_ultima_mov && new Date(moto.data_ultima_mov) > new Date(existingMoto.data_ultima_mov)) ||
            (moto.data_ultima_mov && !existingMoto.data_ultima_mov)) {
          uniqueMotorcyclesByPlaca[moto.placa] = moto;
        }
      });
      
      const uniqueMotorcycles = Object.values(uniqueMotorcyclesByPlaca);

      // Calcular estatísticas
      const stats = uniqueMotorcycles.reduce((acc, moto) => {
        acc.total++;
        
        switch (moto.status) {
          case 'active':
            acc.disponiveis++;
            break;
          case 'alugada':
          case 'relocada':
          case 'renegociado':
            acc.alugadas++;
            break;
          case 'manutencao':
            acc.manutencao++;
            break;
          case 'recolhida':
            acc.recolhidas++;
            break;
        }
        
        return acc;
      }, {
        total: 0,
        disponiveis: 0,
        alugadas: 0,
        manutencao: 0,
        recolhidas: 0
      });

      setMotorcycles(uniqueMotorcycles);
      setFleetStats(stats);

    } catch (error) {
      console.error('Erro ao carregar dados da frota:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appUser) {
      fetchFleetData();
    }
  }, [appUser]);

  return {
    motorcycles,
    fleetStats,
    isLoading,
    refetch: fetchFleetData
  };
}