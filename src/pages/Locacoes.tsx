import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Car, CheckCircle, Clock, Plus, Eye, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { UpdatedMainRentalContractGenerator } from '@/components/contracts/UpdatedMainRentalContractGenerator';
import { ResponsibilityTermGenerator } from '@/components/ResponsibilityTermGenerator';
import { TariffGenerator } from '@/components/contracts/TariffGenerator';
import { DepositReceiptGenerator } from '@/components/contracts/DepositReceiptGenerator';
import { VehicleMonitoringDeclarationGenerator } from '@/components/contracts/VehicleMonitoringDeclarationGenerator';
import { PowerOfAttorneyGenerator } from '@/components/contracts/PowerOfAttorneyGenerator';
import { EmailService } from '@/services/emailService';

interface Rental {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string; // Era client_document, mudou para client_document
  // Campos de endereço do cliente
  client_address_street?: string;
  client_address_number?: string;
  client_address_city?: string;
  client_address_state?: string;
  client_address_zip_code?: string;
  motorcycle_id: string;
  franchisee_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  km_inicial: number;
  km_final: number;
  total_days: number;
  daily_rate: number;
  total_amount: number;
  status: 'active' | 'completed' | 'cancelled';
  observations?: string;
  created_at: string;
  updated_at: string;
}

interface RentalPlan {
  id: string;
  name: string;
  daily_rate: number;
  minimum_days: number;
  maximum_days: number;
  description: string;
}


export default function Locacoes() {
  const { appUser } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [plans, setPlans] = useState<RentalPlan[]>([]);
  const [motorcycles, setMotorcycles] = useState<any[]>([]);
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedFranchisee, setSelectedFranchisee] = useState<any>(null);
  const [availablePlates, setAvailablePlates] = useState<any[]>([]);
  const [cpfSearch, setCpfSearch] = useState('');

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_document: '',
    // Campos de endereço do cliente
    client_address_street: '',
    client_address_number: '',
    client_address_city: '',
    client_address_state: '',
    client_address_zip_code: '',
    motorcycle_model: '',
    motorcycle_id: '',
    motorcycle_plate: '',
    franchisee_id: '',
    plan_id: '',
    start_date: '',
    end_date: '',
    total_value: '',
    deposit_amount: '',
    km_inicial: '',
    km_final: '',
    observations: ''
  });

  // Métricas
  const totalRentals = rentals.length;
  const activeRentals = rentals.filter(r => r.status === 'active').length;
  const completedRentals = rentals.filter(r => r.status === 'completed').length;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      console.log('🔍 [Locacoes] Carregando dados...');
      console.log('🔍 [Locacoes] Usuário atual:', {
        id: appUser?.id,
        role: appUser?.role,
        city_id: appUser?.city_id
      });

      // Para franqueados, buscar primeiro os dados da franquia para obter city_id
      let cityId = appUser?.city_id;

      if (appUser?.role === 'franchisee' && !cityId) {
        const { data: franchiseeData, error: franchiseeError } = await supabase
          .from('franchisees')
          .select('city_id')
          .eq('user_id', appUser.id)
          .single();

        if (franchiseeError) {
          console.error('Erro ao buscar dados do franqueado:', franchiseeError);
        } else {
          cityId = franchiseeData?.city_id;
        }
      }

      console.log('🔍 [Locacoes] City ID para filtro:', cityId);


      // Query para planos de locação
      let plansQuery = (supabase as any)
        .from('rental_plans')
        .select('*')
        .eq('status', 'active');

      console.log('📋 [Locacoes] Configurando query de planos:', {
        userRole: appUser?.role,
        cityId: cityId,
        willFilterByCity: appUser?.role !== 'admin' && appUser?.role !== 'master_br'
      });

      // Aplicar filtros baseados no papel do usuário para planos
      switch (appUser?.role) {
        case 'admin':
        case 'master_br':
          // Admin e Master BR veem todos os planos
          console.log('📋 [Locacoes] Admin/Master BR - sem filtro por cidade');
          break;
        case 'regional':
        case 'franchisee':
          // Regional e Franqueado veem planos da sua cidade OU planos globais (city_id null)
          if (cityId) {
            console.log('📋 [Locacoes] Aplicando filtro por cidade (incluindo globais):', cityId);
            plansQuery = plansQuery.or(`city_id.eq.${cityId},city_id.is.null`);
          } else {
            console.warn('⚠️ [Locacoes] Usuário regional/franqueado sem cityId - apenas planos globais');
            plansQuery = plansQuery.is('city_id', null);
          }
          break;
        default:
          // Caso padrão: filtrar por cidade se disponível, incluindo planos globais
          if (cityId) {
            console.log('📋 [Locacoes] Usuário padrão - filtrando por cidade (incluindo globais):', cityId);
            plansQuery = plansQuery.or(`city_id.eq.${cityId},city_id.is.null`);
          } else {
            console.log('📋 [Locacoes] Usuário padrão sem cityId - apenas planos globais');
            plansQuery = plansQuery.is('city_id', null);
          }
      }

      // Query para motocicletas com filtro por cidade
      let motorcyclesQuery = supabase
        .from('motorcycles')
        .select('*')
        .eq('status', 'active');

      // Query para franqueados com filtro por cidade
      let franchiseesQuery = supabase
        .from('franchisees')
        .select('*')
        .eq('status', 'active');

      // Aplicar filtros baseados no papel do usuário
      switch (appUser?.role) {
        case 'admin':
        case 'master_br':
          // Admin e Master BR veem todas as motos e franqueados
          console.log('🔍 [Locacoes] Usuário admin/master_br - carregando todos os dados');
          break;
        case 'regional':
        case 'franchisee':
          // Regional e Franqueado veem apenas dados da sua cidade
          if (cityId) {
            console.log('🔍 [Locacoes] Usuário regional/franqueado - filtrando por cidade:', cityId);
            motorcyclesQuery = motorcyclesQuery.eq('city_id', cityId);
            franchiseesQuery = franchiseesQuery.eq('city_id', cityId);
          } else {
            console.warn('🔍 [Locacoes] Usuário regional/franqueado sem cidade - carregando todos os dados');
          }
          break;
        default:
          // Caso padrão: filtrar por cidade se disponível
          if (cityId) {
            motorcyclesQuery = motorcyclesQuery.eq('city_id', cityId);
            franchiseesQuery = franchiseesQuery.eq('city_id', cityId);
            console.log('🔍 [Locacoes] Usuário padrão - filtrando por cidade:', cityId);
          }
      }

      // Query para locações com filtro por usuário
      let rentalsQuery = (supabase as any).from('rentals').select('*');
      
      // Aplicar filtros baseados no papel do usuário para locações
      switch (appUser?.role) {
        case 'admin':
        case 'master_br':
          // Admin e Master BR veem todas as locações
          break;
        case 'regional':
          // Regional vê locações de todos os franqueados da sua cidade
          if (cityId) {
            // Filtrar por franqueados da cidade (através do franchisee_id)
            const franchiseeIds = (await supabase
              .from('franchisees')
              .select('id')
              .eq('city_id', cityId)).data?.map(f => f.id) || [];
            
            if (franchiseeIds.length > 0) {
              rentalsQuery = rentalsQuery.in('franchisee_id', franchiseeIds);
            }
          }
          break;
        case 'franchisee':
          // Franqueado vê APENAS suas próprias locações
          const { data: franchiseeData } = await supabase
            .from('franchisees')
            .select('id')
            .eq('user_id', appUser.id)
            .single();
          
          if (franchiseeData?.id) {
            console.log('🔍 [Locacoes] Franqueado - filtrando por franchisee_id:', franchiseeData.id);
            rentalsQuery = rentalsQuery.eq('franchisee_id', franchiseeData.id);
          } else {
            // Se não encontrou o franchisee_id, não mostrar nenhuma locação
            rentalsQuery = rentalsQuery.eq('franchisee_id', 'nenhum');
          }
          break;
      }

      // Executar queries
      const [motorcyclesResult, franchiseesResult, rentalsResult, plansResult] = await Promise.all([
        motorcyclesQuery,
        franchiseesQuery,
        rentalsQuery.order('created_at', { ascending: false }),
        plansQuery.order('daily_rate', { ascending: true })
      ]);

      if (motorcyclesResult.error) throw motorcyclesResult.error;
      if (franchiseesResult.error) throw franchiseesResult.error;
      if (rentalsResult.error) throw rentalsResult.error;
      
      // Tratar erro de planos separadamente para dar feedback específico
      if (plansResult.error) {
        console.error('❌ [Locacoes] Erro ao carregar planos do banco:', plansResult.error);
        console.error('❌ [Locacoes] Detalhes do erro:', {
          message: plansResult.error.message,
          code: plansResult.error.code,
          details: plansResult.error.details
        });
        toast.error(`Erro ao carregar planos: ${plansResult.error.message}`);
        // Definir array vazio para planos em caso de erro
        setPlans([]);
      } else {
        console.log('✅ [Locacoes] Planos carregados com sucesso do banco:', {
          count: plansResult.data?.length || 0,
          data: plansResult.data
        });
      }

      // Converter dados das locações para o formato esperado
      const rentalsData = (rentalsResult.data || []).map((rental: any) => ({
        id: rental.id,
        client_name: rental.client_name,
        client_email: rental.client_email,
        client_phone: rental.client_phone,
        client_document: rental.client_cpf, // Tabela usa client_cpf
        // Campos de endereço do cliente
        client_address_street: rental.client_address_street || '',
        client_address_number: rental.client_address_number || '',
        client_address_city: rental.client_address_city || '',
        client_address_state: rental.client_address_state || '',
        client_address_zip_code: rental.client_address_zip_code || '',
        motorcycle_id: rental.motorcycle_id,
        franchisee_id: rental.franchisee_id,
        plan_id: rental.plan_id,
        start_date: rental.start_date,
        end_date: rental.end_date || '',
        km_inicial: rental.km_inicial || 0,
        km_final: rental.km_final || 0,
        total_days: rental.total_days,
        daily_rate: rental.daily_rate,
        total_amount: rental.total_amount,
        status: rental.status,
        observations: rental.notes || '',
        created_at: rental.created_at,
        updated_at: rental.updated_at
      }));

      setRentals(rentalsData);
      
      // Converter dados dos planos para o formato esperado (somente se não houver erro)
      if (!plansResult.error) {
        const plansData = (plansResult.data || []).map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          daily_rate: parseFloat(plan.daily_rate),
          minimum_days: plan.minimum_days,
          maximum_days: plan.maximum_days || 9999,
          description: plan.description || ''
        }));
        
        setPlans(plansData);
        
        console.log('✅ [Locacoes] Planos carregados do banco:', plansData.length);
      }
      
      // Se usando mock data, adicionar dados de exemplo para motocicletas
      const motorcyclesData = motorcyclesResult.data || [];
      if (motorcyclesData.length > 0) {
        // Adicionar dados de exemplo se não existirem
        const motorcyclesWithDetails = motorcyclesData.map((moto: any, index: number) => ({
          ...moto,
          chassi: moto.chassi || `9BD176H78H${String(1234567 + index).padStart(7, '0')}`,
          renavam: moto.renavam || `${String(12345678901 + index)}`,
          marca: moto.marca || ['Yamaha', 'Honda', 'Suzuki', 'Kawasaki'][index % 4],
          ano: moto.ano || (2020 + (index % 4)),
          cor: moto.cor || ['Azul', 'Vermelha', 'Preta', 'Branca'][index % 4],
          quilometragem: moto.quilometragem || (15000 + (index * 5000))
        }));
        setMotorcycles(motorcyclesWithDetails);
      } else {
        setMotorcycles(motorcyclesData);
      }
      
      setFranchisees(franchiseesResult.data || []);

      console.log('🔍 [Locacoes] Dados carregados:', {
        rentals: rentalsData.length,
        plans: plansResult.error ? 0 : (plansResult.data?.length || 0),
        motorcycles: motorcyclesResult.data?.length || 0,
        franchisees: franchiseesResult.data?.length || 0
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const searchClientByCpf = async (cpf: string) => {
    if (!cpf || cpf.length < 11) {
      setSelectedClient(null);
      return;
    }

    try {
      console.log('🔍 [Locacoes] Buscando cliente por CPF:', cpf);
      
      // Limpar formatação do CPF (remover pontos e traços)
      const cleanCpf = cpf.replace(/\D/g, '');
      
      // Buscar cliente no banco de dados (usando any para evitar erro de tipagem)
      const { data: clientData, error } = await (supabase as any)
        .from('clients')
        .select('*')
        .or(`cpf.eq.${cleanCpf},cpf.eq.${cpf}`)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar cliente:', error);
        toast.error('Erro ao buscar cliente');
        return;
      }

      if (clientData) {
        console.log('✅ [Locacoes] Cliente encontrado:', clientData);

        const foundClient = {
          id: clientData.id,
          name: clientData.full_name,
          email: clientData.email || '',
          phone: clientData.phone || '',
          cpf: clientData.cpf,
          address: clientData.address || '',
          number: clientData.number || '',
          city: clientData.city || '',
          state: clientData.state || '',
          zip_code: clientData.zip_code || ''
        };

        setSelectedClient(foundClient);

        console.log('🏠 [Locacoes] Dados de endereço do cliente:', {
          address: foundClient.address,
          number: foundClient.number,
          city: foundClient.city,
          state: foundClient.state,
          zip_code: foundClient.zip_code
        });

        setFormData(prev => ({
          ...prev,
          client_name: foundClient.name,
          client_email: foundClient.email,
          client_phone: foundClient.phone,
          client_document: foundClient.cpf,
          // Dados de endereço agora serão salvos na locação
          client_address_street: foundClient.address,
          client_address_number: foundClient.number,
          client_address_city: foundClient.city,
          client_address_state: foundClient.state,
          client_address_zip_code: foundClient.zip_code
        }));
        toast.success('Cliente encontrado! Dados e endereço preenchidos automaticamente.');
      } else {
        console.log('❌ [Locacoes] Cliente não encontrado para CPF:', cpf);
        
        setSelectedClient(null);
        setFormData(prev => ({
          ...prev,
          client_name: '',
          client_email: '',
          client_phone: '',
          client_document: cpf,
          // Limpar campos de endereço quando cliente não é encontrado
          client_address_street: '',
          client_address_number: '',
          client_address_city: '',
          client_address_state: '',
          client_address_zip_code: ''
        }));
        toast.info('Cliente não encontrado. Preencha os dados para cadastrar um novo cliente.');
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar cliente:', error);
      toast.error('Erro inesperado ao buscar cliente');
    }
  };

  const handleModelChange = (model: string) => {
    setFormData(prev => ({ ...prev, motorcycle_model: model, motorcycle_id: '', motorcycle_plate: '' }));
    
    // Obter cityId do usuário atual
    let userCityId = appUser?.city_id;
    
    // Para franqueados, buscar city_id através da tabela franchisees se não estiver no appUser
    if (appUser?.role === 'franchisee' && !userCityId) {
      const franchisee = franchisees.find(f => f.user_id === appUser.id);
      userCityId = franchisee?.city_id;
    }
    
    // Filtrar motocicletas por modelo e cidade (apenas para usuários não-admin)
    let filteredMotorcycles = motorcycles.filter(m => m.modelo === model);
    
    if (appUser?.role !== 'admin' && appUser?.role !== 'master_br' && userCityId) {
      filteredMotorcycles = filteredMotorcycles.filter(m => m.city_id === userCityId);
      console.log('🔍 [Locacoes] Filtrando motos por cidade:', userCityId, 'Resultado:', filteredMotorcycles.length);
    }
    
    setAvailablePlates(filteredMotorcycles);
    setSelectedFranchisee(null);
  };

  const handlePlateChange = (motorcycleId: string) => {
    const selectedPlate = availablePlates.find(m => m.id === motorcycleId);
    console.log('🏍️ [Locacoes] Placa selecionada:', selectedPlate);

    setFormData(prev => ({
      ...prev,
      motorcycle_id: motorcycleId,
      motorcycle_plate: selectedPlate?.placa || 'N/A'
    }));

    console.log('🔍 [Locacoes] FormData atualizado com placa:', selectedPlate?.placa || 'N/A');

    // Encontrar a moto selecionada e definir o franqueado automaticamente
    const selectedMotorcycle = motorcycles.find(m => m.id === motorcycleId);
    console.log('🔍 [Locacoes] Moto selecionada:', selectedMotorcycle);
    console.log('🔍 [Locacoes] Franqueados disponíveis:', franchisees.length, franchisees.map(f => ({ id: f.id, name: f.fantasy_name })));
    
    if (selectedMotorcycle) {
      console.log('🔍 [Locacoes] Buscando franqueado com ID:', selectedMotorcycle.franchisee_id);
      
      // Tentar buscar por ID direto primeiro
      let franchisee = franchisees.find(f => f.id === selectedMotorcycle.franchisee_id);
      
      // Se não encontrar, tentar buscar por user_id (caso o banco tenha essa estrutura)
      if (!franchisee) {
        franchisee = franchisees.find(f => f.user_id === selectedMotorcycle.franchisee_id);
        console.log('🔍 [Locacoes] Tentando buscar por user_id...');
      }
      
      if (franchisee) {
        setSelectedFranchisee(franchisee);
        setFormData(prev => ({
          ...prev,
          franchisee_id: franchisee.id
        }));
        console.log('✅ [Locacoes] Franqueado selecionado automaticamente:', franchisee.fantasy_name);
      } else {
        console.error('❌ [Locacoes] Franqueado não encontrado!', {
          motorcycle_franchisee_id: selectedMotorcycle.franchisee_id,
          available_franchisee_ids: franchisees.map(f => f.id),
          available_franchisee_user_ids: franchisees.map(f => f.user_id)
        });
        // Limpar seleção de franqueado se não encontrar
        setSelectedFranchisee(null);
        setFormData(prev => ({
          ...prev,
          franchisee_id: ''
        }));
      }
    } else {
      console.error('❌ [Locacoes] Motocicleta não encontrada com ID:', motorcycleId);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      client_phone: '',
      client_document: '',
      // Campos de endereço do cliente
      client_address_street: '',
      client_address_number: '',
      client_address_city: '',
      client_address_state: '',
      client_address_zip_code: '',
      motorcycle_model: '',
      motorcycle_id: '',
      motorcycle_plate: '',
      franchisee_id: '',
      plan_id: '',
      start_date: '',
      end_date: '',
      total_value: '',
      deposit_amount: '',
      km_inicial: '',
      km_final: '',
      observations: ''
    });
    setSelectedClient(null);
    setSelectedFranchisee(null);
    setAvailablePlates([]);
    setCpfSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('🚀 [Locacoes] Iniciando processo de salvamento...');
      console.log('🔍 [Locacoes] FormData completo:', formData);
      console.log('👤 [Locacoes] Usuário atual:', {
        id: appUser?.id,
        role: appUser?.role,
        city_id: appUser?.city_id,
        email: appUser?.email
      });

      // Validações básicas
      if (!formData.client_name || !formData.client_document || !formData.motorcycle_id || !formData.plan_id || !formData.start_date) {
        toast.error('Preencha todos os campos obrigatórios');
        console.log('🚨 [Locacoes] Campos faltando:', {
          client_name: formData.client_name,
          client_document: formData.client_document,
          motorcycle_id: formData.motorcycle_id,
          plan_id: formData.plan_id,
          start_date: formData.start_date
        });
        return;
      }

      console.log('✅ [Locacoes] Validações básicas passaram');

      // Definir city_id (Salvador como padrão para master_br)
      const cityId = appUser?.city_id || '73fbe697-17c3-4f2f-a727-75c55cbc8dea'; // Salvador como padrão
      console.log('🏙️ [Locacoes] City ID definido:', cityId);

      // Validar se IDs são UUIDs válidos
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      console.log('🔍 [Locacoes] Validando UUIDs:', {
        motorcycle_id: formData.motorcycle_id,
        plan_id: formData.plan_id,
        franchisee_id: formData.franchisee_id
      });

      if (!uuidRegex.test(formData.motorcycle_id)) {
        console.error('❌ [Locacoes] Motorcycle ID inválido:', formData.motorcycle_id);
        toast.error('Selecione uma motocicleta válida');
        return;
      }

      if (!uuidRegex.test(formData.plan_id)) {
        console.error('❌ [Locacoes] Plan ID inválido:', formData.plan_id);
        toast.error('Selecione um plano válido');
        return;
      }

      if (formData.franchisee_id && !uuidRegex.test(formData.franchisee_id)) {
        console.warn('⚠️ [Locacoes] Franchisee ID inválido, será omitido:', formData.franchisee_id);
      }

      console.log('✅ [Locacoes] Validações de UUID passaram');

      // Obter dados necessários
      const selectedPlan = plans.find(p => p.id === formData.plan_id);
      const dailyRate = selectedPlan?.daily_rate || 0;

      // Validar se o plano foi encontrado
      if (!selectedPlan) {
        console.error('❌ [Locacoes] Plano não encontrado:', formData.plan_id);
        toast.error('Plano de locação não encontrado. Selecione um plano válido.');
        return;
      }

      if (dailyRate <= 0) {
        console.error('❌ [Locacoes] Valor da diária inválido:', dailyRate);
        toast.error('Valor da diária do plano é inválido.');
        return;
      }

      // Calcular total de dias se temos as datas
      let totalDays = 1;
      if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);

        // Validar se as datas são válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('❌ [Locacoes] Datas inválidas:', { start_date: formData.start_date, end_date: formData.end_date });
          toast.error('Datas de início ou fim são inválidas.');
          return;
        }

        if (endDate < startDate) {
          console.error('❌ [Locacoes] Data de fim anterior à data de início');
          toast.error('A data de fim deve ser posterior à data de início.');
          return;
        }

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      console.log('🔍 [Locacoes] Cálculos realizados:', {
        selectedPlan: selectedPlan.name,
        dailyRate,
        totalDays,
        totalAmount: dailyRate * totalDays
      });


      // Criar dados da locação conforme esquema da tabela
      const rentalData: any = {
        client_name: formData.client_name,
        client_email: formData.client_email || 'nao-informado@email.com', // Campo obrigatório na tabela
        client_phone: formData.client_phone || '',
        client_cpf: formData.client_document, // Tabela usa client_cpf
        client_address: '', // Campo legado - mantido para compatibilidade
        // Novos campos de endereço detalhado
        client_address_street: formData.client_address_street || '',
        client_address_number: formData.client_address_number || '',
        client_address_city: formData.client_address_city || '',
        client_address_state: formData.client_address_state || '',
        client_address_zip_code: formData.client_address_zip_code || '',
        motorcycle_id: formData.motorcycle_id,
        motorcycle_plate: formData.motorcycle_plate || 'N/A', // Campo obrigatório na tabela
        franchisee_id: formData.franchisee_id || selectedFranchisee?.id,
        plan_id: formData.plan_id,
        city_id: cityId,
        start_date: formData.start_date,
        total_days: totalDays,
        daily_rate: dailyRate,
        total_amount: parseFloat(formData.total_value) || (dailyRate * totalDays),
        deposit_amount: parseFloat(formData.deposit_amount) || 0,
        status: 'active'
      };

      // Validar campos obrigatórios conforme estrutura da tabela
      const requiredFields = {
        client_name: rentalData.client_name,
        client_cpf: rentalData.client_cpf,
        client_email: rentalData.client_email,
        motorcycle_plate: rentalData.motorcycle_plate,
        daily_rate: rentalData.daily_rate,
        total_days: rentalData.total_days,
        total_amount: rentalData.total_amount,
        deposit_amount: rentalData.deposit_amount,
        start_date: rentalData.start_date
      };

      console.log('🔍 [Locacoes] Verificando campos obrigatórios:', requiredFields);

      // Verificar se todos os campos obrigatórios estão preenchidos
      const missingFields = Object.entries(requiredFields)
        .filter(([, value]) => !value && value !== 0)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.error('❌ [Locacoes] Campos obrigatórios faltando:', missingFields);
        toast.error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
        return;
      }

      console.log('✅ [Locacoes] Todas as validações passaram, preparando para salvar...');

      // Adicionar campos opcionais apenas se tiverem valores válidos
      if (formData.end_date) {
        rentalData.end_date = formData.end_date;
      }

      if (formData.observations) {
        rentalData.notes = formData.observations;
      }

      if (formData.km_inicial) {
        rentalData.km_inicial = parseInt(formData.km_inicial);
      }

      if (formData.km_final) {
        rentalData.km_final = parseInt(formData.km_final);
      }

      // Garantir que a placa da motocicleta está preenchida
      if (!rentalData.motorcycle_plate || rentalData.motorcycle_plate === '') {
        const selectedMoto = motorcycles.find(m => m.id === formData.motorcycle_id);
        rentalData.motorcycle_plate = selectedMoto?.placa || 'N/A';
        console.log('🔧 [Locacoes] Placa da moto corrigida:', rentalData.motorcycle_plate);
      }

      console.log('🔍 [Locacoes] Dados a serem enviados:', rentalData);
      console.log('🔍 [Locacoes] FormData original:', {
        motorcycle_id: formData.motorcycle_id,
        franchisee_id: formData.franchisee_id,
        plan_id: formData.plan_id
      });

      // Salvar locação no banco de dados
      const { data: savedRental, error: saveError } = await (supabase as any)
        .from('rentals')
        .insert([rentalData])
        .select()
        .single();

      if (saveError) {
        console.error('❌ [Locacoes] Erro ao salvar locação:', saveError);
        console.error('❌ [Locacoes] Detalhes do erro:', {
          message: saveError.message,
          code: saveError.code,
          details: saveError.details,
          hint: saveError.hint
        });
        console.error('❌ [Locacoes] Dados que causaram o erro:', rentalData);

        // Mensagem de erro mais específica baseada no tipo de erro
        let errorMessage = 'Erro ao salvar locação no banco de dados';
        if (saveError.code === '23505') {
          errorMessage = 'Já existe uma locação com estes dados';
        } else if (saveError.code === '23503') {
          errorMessage = 'Dados de referência inválidos (motocicleta, plano ou franqueado não encontrado)';
        } else if (saveError.code === '23514') {
          errorMessage = 'Dados inválidos (verifique valores numéricos e datas)';
        } else if (saveError.message) {
          errorMessage = `Erro: ${saveError.message}`;
        }

        toast.error(errorMessage);
        return;
      }

      console.log('✅ [Locacoes] Locação salva com sucesso:', savedRental);

      // Criar objeto para adicionar à lista local
      const newRental: Rental = {
        id: savedRental.id,
        client_name: savedRental.client_name,
        client_email: savedRental.client_email,
        client_phone: savedRental.client_phone,
        client_document: savedRental.client_cpf, // Tabela usa client_cpf
        // Campos de endereço do cliente
        client_address_street: savedRental.client_address_street || '',
        client_address_number: savedRental.client_address_number || '',
        client_address_city: savedRental.client_address_city || '',
        client_address_state: savedRental.client_address_state || '',
        client_address_zip_code: savedRental.client_address_zip_code || '',
        motorcycle_id: savedRental.motorcycle_id,
        franchisee_id: savedRental.franchisee_id,
        plan_id: savedRental.plan_id,
        start_date: savedRental.start_date,
        end_date: savedRental.end_date || '',
        km_inicial: savedRental.km_inicial || 0,
        km_final: savedRental.km_final || 0,
        total_days: savedRental.total_days,
        daily_rate: savedRental.daily_rate,
        total_amount: savedRental.total_amount,
        status: savedRental.status,
        observations: savedRental.notes || '',
        created_at: savedRental.created_at,
        updated_at: savedRental.updated_at || savedRental.created_at
      };

      // Adicionar à lista de locações
      setRentals(prev => [newRental, ...prev]);

      // Enviar notificação por email
      try {
        await EmailService.sendRentalCreatedNotification({
          ...newRental,
          motorcycle_model: motorcycles.find(m => m.id === newRental.motorcycle_id)?.modelo || '',
          motorcycle_plate: motorcycles.find(m => m.id === newRental.motorcycle_id)?.placa || ''
        });
        console.log('✅ [Locacoes] Email de confirmação enviado');
      } catch (emailError) {
        console.error('❌ [Locacoes] Erro ao enviar email:', emailError);
        // Não falhar a criação da locação por causa do email
      }

      toast.success('Locação criada com sucesso!');
      setIsDialogOpen(false);
      resetForm();

    } catch (error) {
      console.error('Erro ao criar locação:', error);
      toast.error('Erro inesperado ao criar locação');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const },
      completed: { label: 'Concluída', variant: 'secondary' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    if (status === 'active') {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          {config.label}
        </Badge>
      );
    }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleEditRental = (rental: Rental) => {
    console.log('✏️ [Locacoes] Preparando edição da locação:', rental);
    
    // Preencher o formulário com os dados da locação
    setFormData({
      client_name: rental.client_name,
      client_email: rental.client_email,
      client_phone: rental.client_phone,
      client_document: rental.client_document,
      // Campos de endereço do cliente (podem estar vazios em locações antigas)
      client_address_street: rental.client_address_street || '',
      client_address_number: rental.client_address_number || '',
      client_address_city: rental.client_address_city || '',
      client_address_state: rental.client_address_state || '',
      client_address_zip_code: rental.client_address_zip_code || '',
      motorcycle_model: motorcycles.find(m => m.id === rental.motorcycle_id)?.modelo || '',
      motorcycle_id: rental.motorcycle_id,
      motorcycle_plate: motorcycles.find(m => m.id === rental.motorcycle_id)?.placa || '',
      franchisee_id: rental.franchisee_id,
      plan_id: rental.plan_id,
      start_date: rental.start_date,
      end_date: rental.end_date,
      total_value: rental.total_amount.toString(),
      deposit_amount: '',
      km_inicial: rental.km_inicial.toString(),
      km_final: rental.km_final.toString(),
      observations: rental.observations || ''
    });

    // Configurar cliente selecionado
    setSelectedClient({
      id: rental.id,
      name: rental.client_name,
      email: rental.client_email,
      phone: rental.client_phone,
      cpf: rental.client_document
    });
    
    setCpfSearch(rental.client_document);
    setSelectedRental(rental);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRental = async (rentalId: string) => {
    try {
      // Confirmar a exclusão com o usuário
      const confirmed = window.confirm('Tem certeza que deseja apagar esta locação? Esta ação não pode ser desfeita.');
      
      if (!confirmed) {
        return;
      }

      console.log('🗑️ [Locacoes] Apagando locação:', rentalId);

      // Deletar do banco de dados
      const { error } = await (supabase as any)
        .from('rentals')
        .delete()
        .eq('id', rentalId);

      if (error) {
        console.error('❌ [Locacoes] Erro ao apagar locação:', error);
        toast.error('Erro ao apagar locação');
        return;
      }

      // Remover da lista local
      setRentals(prev => prev.filter(r => r.id !== rentalId));
      
      console.log('✅ [Locacoes] Locação apagada com sucesso');
      toast.success('Locação apagada com sucesso!');

    } catch (error) {
      console.error('❌ [Locacoes] Erro inesperado ao apagar locação:', error);
      toast.error('Erro inesperado ao apagar locação');
    }
  };

  const handleUpdateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRental) {
      toast.error('Nenhuma locação selecionada para edição');
      return;
    }

    try {
      console.log('📝 [Locacoes] Atualizando locação:', selectedRental.id);

      // Dados atualizados
      const updatedData: any = {
        client_name: formData.client_name,
        client_email: formData.client_email || '',
        km_inicial: parseInt(formData.km_inicial) || 0,
        km_final: parseInt(formData.km_final) || 0,
        notes: formData.observations || ''
      };

      // Atualizar no banco de dados
      const { error } = await (supabase as any)
        .from('rentals')
        .update(updatedData)
        .eq('id', selectedRental.id);

      if (error) {
        console.error('❌ [Locacoes] Erro ao atualizar locação:', error);
        toast.error('Erro ao atualizar locação');
        return;
      }

      // Atualizar na lista local
      setRentals(prev => prev.map(rental => 
        rental.id === selectedRental.id 
          ? {
              ...rental,
              client_name: formData.client_name,
              client_email: formData.client_email,
              km_inicial: parseInt(formData.km_inicial) || 0,
              km_final: parseInt(formData.km_final) || 0,
              observations: formData.observations || ''
            }
          : rental
      ));

      console.log('✅ [Locacoes] Locação atualizada com sucesso');
      toast.success('Locação atualizada com sucesso!');
      
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedRental(null);

    } catch (error) {
      console.error('❌ [Locacoes] Erro inesperado ao atualizar locação:', error);
      toast.error('Erro inesperado ao atualizar locação');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Obter modelos únicos das motos (filtrar por cidade para usuários não-admin)
  const getFilteredMotorcycles = () => {
    let userCityId = appUser?.city_id;
    
    console.log('🔍 [Locacoes] Debug filtro de motos:', {
      userRole: appUser?.role,
      userCityId: userCityId,
      totalMotorcycles: motorcycles.length,
      motorcyclesCities: motorcycles.map(m => ({ id: m.id, city_id: m.city_id, modelo: m.modelo }))
    });
    
    // Para franqueados, buscar city_id através da tabela franchisees se não estiver no appUser
    if (appUser?.role === 'franchisee' && !userCityId) {
      const franchisee = franchisees.find(f => f.user_id === appUser?.id);
      userCityId = franchisee?.city_id;
      console.log('🔍 [Locacoes] City ID encontrado via franchisee:', userCityId);
    }
    
    // Admin e Master BR veem todas as motos
    if (appUser?.role === 'admin' || appUser?.role === 'master_br') {
      console.log('🔍 [Locacoes] Usuário admin/master_br - sem filtro');
      return motorcycles;
    }
    
    // Outros usuários veem apenas motos da sua cidade
    if (userCityId) {
      const filtered = motorcycles.filter(m => m.city_id === userCityId);
      console.log('🔍 [Locacoes] Filtrando motos por cidade:', userCityId, 'Resultado:', filtered.length);
      return filtered;
    }
    
    console.log('🔍 [Locacoes] Sem filtro aplicado - retornando todas');
    return motorcycles;
  };
  
  const filteredMotorcycles = getFilteredMotorcycles();
  const models = [...new Set(filteredMotorcycles.map(m => m.modelo))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2D3E95' }}>
            <Car className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locações</h1>
          </div>
        </div>
        
        {/* Franqueados não podem criar novas locações */}
        {appUser?.role !== 'franchisee' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-[#2D3E95] hover:bg-[#1d2d7a] text-white">
                <Plus className="h-4 w-4" />
                Nova Locação
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Locação</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova locação
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Busca por CPF */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="client_document">CPF/CNPJ do Cliente</Label>
                  {selectedClient && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClient(null);
                        setFormData(prev => ({
                          ...prev,
                          client_name: '',
                          client_email: '',
                          client_phone: '',
                          client_document: '',
                          // Limpar campos de endereço
                          client_address_street: '',
                          client_address_number: '',
                          client_address_city: '',
                          client_address_state: '',
                          client_address_zip_code: ''
                        }));
                        setCpfSearch('');
                      }}
                    >
                      Limpar Cliente
                    </Button>
                  )}
                </div>
                <Input
                  id="client_document"
                  value={cpfSearch}
                  onChange={(e) => {
                    setCpfSearch(e.target.value);
                    searchClientByCpf(e.target.value);
                  }}
                  placeholder="Digite o CPF/CNPJ para buscar"
                  className={selectedClient ? "border-green-500 bg-green-50" : ""}
                />
                {selectedClient && (
                  <p className="text-sm text-green-600">
                    ✓ Cliente encontrado: {selectedClient.name}
                  </p>
                )}
                {cpfSearch && !selectedClient && cpfSearch.length >= 11 && (
                  <p className="text-sm text-orange-600">
                    Cliente não encontrado. Preencha os dados abaixo para cadastrar.
                  </p>
                )}
              </div>

              {/* Dados do Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({...prev, client_name: e.target.value}))}
                    placeholder="Nome completo"
                    required
                    className={selectedClient ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData(prev => ({...prev, client_email: e.target.value}))}
                    placeholder="email@exemplo.com"
                    className={selectedClient ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData(prev => ({...prev, client_phone: e.target.value}))}
                  placeholder="(11) 99999-9999"
                  className={selectedClient ? "bg-gray-50" : ""}
                />
              </div>

              {/* Campos de Endereço do Cliente */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Endereço do Cliente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_address_street">Rua/Avenida</Label>
                    <Input
                      id="client_address_street"
                      value={formData.client_address_street}
                      onChange={(e) => setFormData(prev => ({...prev, client_address_street: e.target.value}))}
                      placeholder="Nome da rua"
                      className={selectedClient ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_address_number">Número</Label>
                    <Input
                      id="client_address_number"
                      value={formData.client_address_number}
                      onChange={(e) => setFormData(prev => ({...prev, client_address_number: e.target.value}))}
                      placeholder="123"
                      className={selectedClient ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_address_city">Cidade</Label>
                    <Input
                      id="client_address_city"
                      value={formData.client_address_city}
                      onChange={(e) => setFormData(prev => ({...prev, client_address_city: e.target.value}))}
                      placeholder="Salvador"
                      className={selectedClient ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_address_state">Estado</Label>
                    <Input
                      id="client_address_state"
                      value={formData.client_address_state}
                      onChange={(e) => setFormData(prev => ({...prev, client_address_state: e.target.value}))}
                      placeholder="BA"
                      className={selectedClient ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_address_zip_code">CEP</Label>
                    <Input
                      id="client_address_zip_code"
                      value={formData.client_address_zip_code}
                      onChange={(e) => setFormData(prev => ({...prev, client_address_zip_code: e.target.value}))}
                      placeholder="40000-000"
                      className={selectedClient ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
                {selectedClient && (
                  <p className="text-sm text-green-600">
                    ✓ Endereço preenchido automaticamente dos dados do cliente
                  </p>
                )}
              </div>

              {/* Seleção de Moto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motorcycle_model">Modelo da Moto</Label>
                  <Select onValueChange={handleModelChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle_id">Placa da Moto</Label>
                  <Select
                    onValueChange={handlePlateChange}
                    disabled={!formData.motorcycle_model}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.motorcycle_model ? "Selecione a placa" : "Primeiro selecione o modelo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlates.map((motorcycle) => (
                        <SelectItem key={motorcycle.id} value={motorcycle.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{motorcycle.placa} - {motorcycle.modelo}</span>
                            <span className="text-xs text-muted-foreground">
                              {motorcycle.marca} {motorcycle.ano} • {motorcycle.cor} • {motorcycle.quilometragem?.toLocaleString('pt-BR')} km
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informações da Motocicleta Selecionada */}
              {formData.motorcycle_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Motocicleta Selecionada
                  </h4>
                  {(() => {
                    const selectedMoto = motorcycles.find(m => m.id === formData.motorcycle_id);
                    if (!selectedMoto) return <p className="text-sm text-muted-foreground">Motocicleta não encontrada</p>;
                    
                    return (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p><strong>Placa:</strong> {selectedMoto.placa || 'N/A'}</p>
                          <p><strong>Modelo:</strong> {selectedMoto.modelo || 'N/A'}</p>
                          <p><strong>Marca:</strong> {selectedMoto.marca || 'N/A'}</p>
                          <p><strong>Ano:</strong> {selectedMoto.ano || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <p><strong>Chassi:</strong> {selectedMoto.chassi || 'N/A'}</p>
                          <p><strong>RENAVAM:</strong> {selectedMoto.renavam || 'N/A'}</p>
                          <p><strong>Cor:</strong> {selectedMoto.cor || 'N/A'}</p>
                          <p><strong>Quilometragem:</strong> {selectedMoto.quilometragem?.toLocaleString('pt-BR') || 'N/A'} km</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Franqueado (somente leitura) */}
              <div className="space-y-2">
                <Label htmlFor="franchisee_id">Franqueado</Label>
                <Input
                  value={selectedFranchisee ? selectedFranchisee.fantasy_name : ''}
                  placeholder="Será preenchido automaticamente ao selecionar a moto"
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              {/* Plano */}
              <div className="space-y-2">
                <Label htmlFor="plan_id">Plano</Label>
                <Select onValueChange={(value) => setFormData(prev => ({...prev, plan_id: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      console.log('🔍 [Locacoes] Renderizando planos:', {
                        plansLength: plans.length,
                        plans: plans
                      });

                      return plans.length > 0 ? (
                        plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{plan.name} - R$ {plan.daily_rate}/dia</span>
                              <span className="text-xs text-muted-foreground">
                                {plan.minimum_days}-{plan.maximum_days === 9999 ? '∞' : plan.maximum_days} dias • {plan.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-plans" disabled>
                          <span className="text-muted-foreground">Nenhum plano disponível</span>
                        </SelectItem>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>

              {/* KM */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="km_inicial">KM Inicial</Label>
                  <Input
                    id="km_inicial"
                    type="number"
                    value={formData.km_inicial}
                    onChange={(e) => setFormData(prev => ({...prev, km_inicial: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="km_final">KM Final</Label>
                  <Input
                    id="km_final"
                    type="number"
                    value={formData.km_final}
                    onChange={(e) => setFormData(prev => ({...prev, km_final: e.target.value}))}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  placeholder="Observações adicionais..."
                  onChange={(e) => setFormData(prev => ({...prev, observations: e.target.value}))}
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Fim <span className="text-muted-foreground">(opcional)</span></Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se não informada, a locação ficará em aberto
                  </p>
                </div>
              </div>

              {/* Valor Semanal */}
              <div className="space-y-2">
                <Label htmlFor="total_amount">Valor Semanal</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_value}
                  onChange={(e) => setFormData(prev => ({...prev, total_value: e.target.value}))}
                  placeholder="0.00"
                />
                {formData.start_date && formData.plan_id && (
                  <p className="text-sm text-muted-foreground">
                    Valor calculado automaticamente baseado no plano selecionado
                  </p>
                )}
              </div>

              {/* Valor do Caução */}
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Valor do Caução</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  step="0.01"
                  value={formData.deposit_amount}
                  placeholder="0.00"
                  onChange={(e) => setFormData(prev => ({...prev, deposit_amount: e.target.value}))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Criar Locação
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total de Locações</p>
              <p className="text-2xl font-bold text-blue-500">{totalRentals}</p>
              <p className="text-xs text-muted-foreground">registradas</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <Car className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Locações Ativas</p>
              <p className="text-2xl font-bold text-green-500">{activeRentals}</p>
              <p className="text-xs text-muted-foreground">em andamento</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Locações Finalizadas</p>
              <p className="text-2xl font-bold text-orange-500">{completedRentals}</p>
              <p className="text-xs text-muted-foreground">concluídas</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Locações */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Locações</CardTitle>
          <CardDescription>
            Lista completa de todas as locações registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Endereço</th>
                  <th className="text-left p-2">Placa</th>
                  <th className="text-left p-2">Franqueado</th>
                  <th className="text-left p-2">Período</th>
                  <th className="text-left p-2">Diária</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{rental.client_name}</div>
                        <div className="text-sm text-muted-foreground">{rental.client_email}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div className="font-medium">Dados cadastrais no sistema de clientes</div>
                        <div className="text-muted-foreground text-xs">
                          Endereço não armazenado em locações
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div className="font-medium">{motorcycles.find(m => m.id === rental.motorcycle_id)?.placa || 'N/A'}</div>
                        <div className="text-muted-foreground">
                          {motorcycles.find(m => m.id === rental.motorcycle_id)?.modelo || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div className="font-medium">
                          {franchisees.find(f => f.id === rental.franchisee_id)?.fantasy_name || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div>{formatDate(rental.start_date)} - {formatDate(rental.end_date)}</div>
                        <div className="text-muted-foreground">{rental.total_days} dias</div>
                      </div>
                    </td>
                    <td className="p-2">R$ {rental.daily_rate}</td>
                    <td className="p-2">R$ {rental.total_amount || 0}</td>
                    <td className="p-2">{getStatusBadge(rental.status)}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRental(rental);
                            setIsDetailsDialogOpen(true);
                          }}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {appUser?.role !== 'franchisee' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRental(rental)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            title="Editar locação"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {appUser?.role !== 'franchisee' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRental(rental.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Apagar locação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Locação */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Locação</DialogTitle>
            <DialogDescription>
              Visualize os detalhes e gere documentos da locação
            </DialogDescription>
          </DialogHeader>

          {selectedRental && (
            <div className="space-y-6">
              {/* Informações da Locação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados do Cliente</h3>
                  <div className="space-y-2">
                    <p><strong>Nome:</strong> {selectedRental.client_name}</p>
                    <p><strong>CPF:</strong> {selectedRental.client_document}</p>
                    <p><strong>Email:</strong> {selectedRental.client_email}</p>
                    <p><strong>Telefone:</strong> {selectedRental.client_phone}</p>

                    {/* Endereço do Cliente */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Endereço</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Rua:</strong> {selectedRental.client_address_street || 'Não informado'}</p>
                        <p><strong>Número:</strong> {selectedRental.client_address_number || 'Não informado'}</p>
                        <p><strong>Cidade:</strong> {selectedRental.client_address_city || 'Não informado'}</p>
                        <p><strong>Estado:</strong> {selectedRental.client_address_state || 'Não informado'}</p>
                        <p><strong>CEP:</strong> {selectedRental.client_address_zip_code || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados da Motocicleta</h3>
                  <div className="space-y-2">
                    <p><strong>Placa:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.placa || 'N/A'}</p>
                    <p><strong>Modelo:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.modelo || 'N/A'}</p>
                    <p><strong>Marca:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.marca || 'N/A'}</p>
                    <p><strong>Ano:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.ano || 'N/A'}</p>
                    <p><strong>Cor:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.cor || 'N/A'}</p>
                    <p><strong>Chassi:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.chassi || 'N/A'}</p>
                    <p><strong>RENAVAM:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.renavam || 'N/A'}</p>
                    <p><strong>Quilometragem:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.quilometragem?.toLocaleString('pt-BR') || 'N/A'} km</p>
                    <p><strong>Tipo:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.status === 'active' ? 'Ativa' : motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.status || 'N/A'}</p>
                    <p><strong>Franqueado:</strong> {franchisees.find(f => f.id === selectedRental.franchisee_id)?.fantasy_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados da Locação</h3>
                  <div className="space-y-2">
                    <p><strong>Plano:</strong> {plans.find(p => p.id === selectedRental.plan_id)?.name || 'N/A'}</p>
                    <p><strong>Período:</strong> {formatDate(selectedRental.start_date)} - {formatDate(selectedRental.end_date)}</p>
                    <p><strong>Total de Dias:</strong> {selectedRental.total_days}</p>
                    <p><strong>Diária:</strong> R$ {selectedRental.daily_rate}</p>
                    <p><strong>Total:</strong> R$ {selectedRental.total_amount || 0}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quilometragem</h3>
                  <div className="space-y-2">
                    <p><strong>KM Inicial:</strong> {selectedRental.km_inicial?.toLocaleString('pt-BR') || 'N/A'}</p>
                    <p><strong>KM Final:</strong> {selectedRental.km_final?.toLocaleString('pt-BR') || 'Não informado'}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedRental.status)}</p>
                  </div>
                </div>
              </div>

              {selectedRental.observations && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Observações</h3>
                  <p className="text-sm text-gray-600">{selectedRental.observations}</p>
                </div>
              )}

              {/* Contrato Principal de Locação */}
              <div className="border-t pt-6">
                <UpdatedMainRentalContractGenerator
                  contractData={{
                    contract_number: selectedRental.id,
                    attendant_name: 'Atendente Sistema',
                    monthly_km_limit: '6.000',
                    excess_km_rate: 'R$0,39',
                    start_date: new Date(selectedRental.start_date).toLocaleDateString('pt-BR'),
                    delivery_location: franchisees.find(f => f.id === selectedRental.franchisee_id)?.endereco || '',
                    payment_frequency: 'Semanal',
                    end_date: selectedRental.end_date ? new Date(selectedRental.end_date).toLocaleDateString('pt-BR') : '',
                    return_location: franchisees.find(f => f.id === selectedRental.franchisee_id)?.endereco || '',
                    daily_rate: `R$${selectedRental.daily_rate?.toFixed(2) || '0,00'}`,
                    franchisee_name: franchisees.find(f => f.id === selectedRental.franchisee_id)?.fantasy_name || '',
                    franchisee_cnpj: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cnpj || '',
                    franchisee_address: franchisees.find(f => f.id === selectedRental.franchisee_id)?.endereco || '',
                    franchisee_city: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cidade || '',
                    franchisee_state: franchisees.find(f => f.id === selectedRental.franchisee_id)?.estado || '',
                    client_name: selectedRental.client_name,
                    client_address_street: selectedRental.client_address_street || '',
                    client_address_number: selectedRental.client_address_number || '',
                    client_address_city: selectedRental.client_address_city || '',
                    client_address_zip_code: selectedRental.client_address_zip_code || '',
                    client_address_state: selectedRental.client_address_state || '',
                    client_phone: selectedRental.client_phone || '',
                    client_phone_2: '', // Campo adicional
                    client_cpf: selectedRental.client_document,
                    client_cnh: '', // Precisa ser adicionado ao modelo se necessário
                    client_cnh_category: 'AB', // Valor padrão
                    client_email: selectedRental.client_email || '',
                    motorcycle_plate: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.placa || '',
                    motorcycle_chassi: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.chassi || '',
                    motorcycle_km: '0', // Valor padrão - pode ser adicionado ao modelo
                    motorcycle_brand: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.marca || '',
                    motorcycle_renavam: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.renavam || '',
                    fuel_level: 'Reserva', // Valor padrão
                    motorcycle_model: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.modelo || '',
                    motorcycle_year: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.ano?.toString() || '',
                    motorcycle_color: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.cor || '',
                    total_days: selectedRental.total_days?.toString() || '0',
                    total_amount: `R$${(selectedRental.daily_rate * selectedRental.total_days)?.toFixed(2) || '0,00'}`,
                    contract_city: selectedRental.client_address_city || '',
                    contract_date: new Date().toLocaleDateString('pt-BR'),
                    contract_state: selectedRental.client_address_state || '',
                  }}
                  cityId={appUser?.city_id || ''}
                  rentalId={selectedRental.id}
                  onContractGenerated={(contractUrl) => {
                    console.log('Contrato gerado:', contractUrl);
                    toast.success('Contrato Principal gerado com sucesso!');
                  }}
                />
              </div>

              {/* Anexo V - Termo de Responsabilidade */}
              <div className="border-t pt-6">
                <ResponsibilityTermGenerator
                  rentalData={{
                    ...selectedRental,
                    // Mapear campos de endereço para o formato esperado pelo ResponsibilityTermGenerator
                    client_address: selectedRental.client_address_street || '',
                    client_number: selectedRental.client_address_number || '',
                    client_city: selectedRental.client_address_city || '',
                    client_state: selectedRental.client_address_state || 'BA',
                    client_cep: selectedRental.client_address_zip_code || '',
                    motorcycle_model: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.modelo || '',
                    motorcycle_plate: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.placa || '',
                    motorcycle_chassi: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.chassi || '',
                    motorcycle_brand: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.marca || '',
                    client_cpf: selectedRental.client_document, // Usando client_cpf para componente
                    contract_city: 'Salvador' // ou pegar da cidade do usuário
                  }}
                  cityId={appUser?.city_id || ''}
                  onTermGenerated={(termUrl) => {
                    console.log('Anexo V gerado:', termUrl);
                    toast.success('Anexo V gerado com sucesso!');
                  }}
                />
              </div>

              {/* Anexo IV - Tarifário LOCAGORA */}
              <div className="border-t pt-6">
                <TariffGenerator
                  tariffData={{
                    client_name: selectedRental.client_name,
                    client_cpf: selectedRental.client_document, // TariffData espera client_cpf
                    client_address: selectedRental.client_address_street || '',
                    client_neighborhood: '',
                    client_city: selectedRental.client_address_city || 'Salvador',
                    client_state: selectedRental.client_address_state || 'BA',
                    client_number: selectedRental.client_address_number || '',
                    client_cep: selectedRental.client_address_zip_code || '',
                    client_email: selectedRental.client_email || '',
                    client_phone: selectedRental.client_phone || '',
                    motorcycle_model: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.modelo || '',
                    motorcycle_brand: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.marca || '',
                    motorcycle_plate: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.placa || '',
                    contract_city: selectedRental.client_address_city || 'Salvador',
                    contract_date: new Date().toLocaleDateString('pt-BR')
                  }}
                  cityId={appUser?.city_id || ''}
                  rentalId={selectedRental.id}
                  onTariffGenerated={(tariffUrl) => {
                    console.log('Anexo IV gerado:', tariffUrl);
                    toast.success('Anexo IV gerado com sucesso!');
                  }}
                />
              </div>

              {/* Anexo VI - Recebimento de Caução */}
              <div className="border-t pt-6">
                <DepositReceiptGenerator
                  depositData={{
                    client_name: selectedRental.client_name,
                    client_cpf: selectedRental.client_document,
                    client_cnh: '', // Precisa ser adicionado ao modelo de dados se necessário
                    client_address: selectedRental.client_address_street || '',
                    client_neighborhood: '',
                    client_city: selectedRental.client_address_city || 'Salvador',
                    client_state: selectedRental.client_address_state || 'BA',
                    client_number: selectedRental.client_address_number || '',
                    client_cep: selectedRental.client_address_zip_code || '',
                    client_email: selectedRental.client_email || '',
                    client_phone: selectedRental.client_phone || '',
                    deposit_value: 700.00, // Valor padrão da caução
                    franchisee_name: franchisees.find(f => f.id === selectedRental.franchisee_id)?.fantasy_name || '',
                    franchisee_cnpj: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cnpj || '',
                    franchisee_address: franchisees.find(f => f.id === selectedRental.franchisee_id)?.endereco || '',
                    franchisee_neighborhood: franchisees.find(f => f.id === selectedRental.franchisee_id)?.bairro || '',
                    franchisee_city: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cidade || 'Salvador',
                    franchisee_state: franchisees.find(f => f.id === selectedRental.franchisee_id)?.estado || 'BA',
                    franchisee_cep: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cep || '',
                    contract_city: selectedRental.client_address_city || 'Salvador',
                    contract_date: new Date().toLocaleDateString('pt-BR')
                  }}
                  cityId={appUser?.city_id || ''}
                  rentalId={selectedRental.id}
                  onReceiptGenerated={(receiptUrl) => {
                    console.log('Anexo VI gerado:', receiptUrl);
                    toast.success('Anexo VI gerado com sucesso!');
                  }}
                />
              </div>

              {/* Anexo VII - Declaração de Conhecimento de Monitoramento do Veículo */}
              <div className="border-t pt-6">
                <VehicleMonitoringDeclarationGenerator
                  vehicleMonitoringData={{
                    client_name: selectedRental.client_name,
                    client_cpf: selectedRental.client_document,
                    client_cnh: '', // Precisa ser adicionado ao modelo de dados se necessário
                    client_address: selectedRental.client_address_street || '',
                    client_neighborhood: selectedRental.client_address_state || '', // Usando state como neighborhood temporariamente
                    client_city: selectedRental.client_address_city || 'Maceió',
                    client_state: selectedRental.client_address_state || 'AL',
                    client_number: selectedRental.client_address_number || '',
                    client_cep: selectedRental.client_address_zip_code || '',
                    client_email: selectedRental.client_email || '',
                    client_phone: selectedRental.client_phone || '',
                    contract_city: selectedRental.client_address_city || 'Maceió',
                    contract_date: new Date().toLocaleDateString('pt-BR')
                  }}
                  cityId={appUser?.city_id || ''}
                  rentalId={selectedRental.id}
                  onDeclarationGenerated={(declarationUrl) => {
                    console.log('Anexo VII gerado:', declarationUrl);
                    toast.success('Anexo VII gerado com sucesso!');
                  }}
                />
              </div>

              {/* Anexo III - Procuração */}
              <div className="border-t pt-6">
                <PowerOfAttorneyGenerator
                  powerOfAttorneyData={{
                    client_name: selectedRental.client_name,
                    client_cpf: selectedRental.client_document,
                    client_cnh: '', // Precisa ser adicionado ao modelo de dados se necessário
                    client_profession: 'profissional', // Valor padrão
                    client_marital_status: 'solteiro(a)', // Valor padrão
                    client_address: selectedRental.client_address_street || '',
                    client_neighborhood: selectedRental.client_address_state || '', // Usando state como neighborhood temporariamente
                    client_city: selectedRental.client_address_city || 'Maceió',
                    client_state: selectedRental.client_address_state || 'AL',
                    client_number: selectedRental.client_address_number || '',
                    client_cep: selectedRental.client_address_zip_code || '',
                    client_email: selectedRental.client_email || '',
                    client_phone: selectedRental.client_phone || '',
                    franchisee_name: franchisees.find(f => f.id === selectedRental.franchisee_id)?.fantasy_name || '',
                    franchisee_cnpj: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cnpj || '',
                    franchisee_address: franchisees.find(f => f.id === selectedRental.franchisee_id)?.endereco || '',
                    franchisee_neighborhood: franchisees.find(f => f.id === selectedRental.franchisee_id)?.bairro || '',
                    franchisee_city: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cidade || '',
                    franchisee_state: franchisees.find(f => f.id === selectedRental.franchisee_id)?.estado || '',
                    franchisee_number: franchisees.find(f => f.id === selectedRental.franchisee_id)?.numero || '',
                    franchisee_cep: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cep || '',
                    contract_city: selectedRental.client_address_city || '',
                    contract_date: new Date().toLocaleDateString('pt-BR')
                  }}
                  cityId={appUser?.city_id || ''}
                  rentalId={selectedRental.id}
                  onPowerOfAttorneyGenerated={(powerOfAttorneyUrl) => {
                    console.log('Anexo III gerado:', powerOfAttorneyUrl);
                    toast.success('Anexo III gerado com sucesso!');
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição da Locação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Locação</DialogTitle>
            <DialogDescription>
              Modifique os dados da locação selecionada
            </DialogDescription>
          </DialogHeader>
          
          {/* Usar o mesmo formulário do modal de criação, mas com handleSubmit modificado */}
          <form className="space-y-4" onSubmit={(e) => handleUpdateRental(e)}>
            {/* Dados do Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_client_name">Nome do Cliente</Label>
                <Input
                  id="edit_client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData(prev => ({...prev, client_name: e.target.value}))}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_client_email">Email</Label>
                <Input
                  id="edit_client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData(prev => ({...prev, client_email: e.target.value}))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            {/* KM */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_km_inicial">KM Inicial</Label>
                <Input
                  id="edit_km_inicial"
                  type="number"
                  value={formData.km_inicial}
                  onChange={(e) => setFormData(prev => ({...prev, km_inicial: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_km_final">KM Final</Label>
                <Input
                  id="edit_km_final"
                  type="number"
                  value={formData.km_final}
                  onChange={(e) => setFormData(prev => ({...prev, km_final: e.target.value}))}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="edit_observations">Observações</Label>
              <Textarea
                id="edit_observations"
                value={formData.observations}
                placeholder="Observações adicionais..."
                onChange={(e) => setFormData(prev => ({...prev, observations: e.target.value}))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Atualizar Locação
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
