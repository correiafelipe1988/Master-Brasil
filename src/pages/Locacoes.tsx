import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Car, CheckCircle, Clock, Plus, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PDFGenerator } from '@/components/PDFGenerator';
import { DigitalSignature } from '@/components/DigitalSignature';
import { EmailService } from '@/services/emailService';

interface Rental {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_cpf: string;
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
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedFranchisee, setSelectedFranchisee] = useState<any>(null);
  const [availablePlates, setAvailablePlates] = useState<any[]>([]);
  const [cpfSearch, setCpfSearch] = useState('');

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_cpf: '',
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


      const mockPlans: RentalPlan[] = [
        {
          id: '1',
          name: 'Plano Mensal',
          daily_rate: 45,
          minimum_days: 30,
          maximum_days: 365,
          description: 'Plano ideal para uso prolongado'
        }
      ];

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
      const [motorcyclesResult, franchiseesResult, rentalsResult] = await Promise.all([
        motorcyclesQuery,
        franchiseesQuery,
        rentalsQuery.order('created_at', { ascending: false })
      ]);

      if (motorcyclesResult.error) throw motorcyclesResult.error;
      if (franchiseesResult.error) throw franchiseesResult.error;
      if (rentalsResult.error) throw rentalsResult.error;

      // Converter dados das locações para o formato esperado
      const rentalsData = (rentalsResult.data || []).map((rental: any) => ({
        id: rental.id,
        client_name: rental.client_name,
        client_email: rental.client_email,
        client_phone: rental.client_phone,
        client_cpf: rental.client_cpf,
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
      setPlans(mockPlans);
      setMotorcycles(motorcyclesResult.data || []);
      setFranchisees(franchiseesResult.data || []);

      console.log('🔍 [Locacoes] Dados carregados:', {
        rentals: rentalsData.length,
        plans: mockPlans.length,
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
          cpf: clientData.cpf
        };

        setSelectedClient(foundClient);
        setFormData(prev => ({
          ...prev,
          client_name: foundClient.name,
          client_email: foundClient.email,
          client_phone: foundClient.phone,
          client_cpf: foundClient.cpf
        }));
        toast.success('Cliente encontrado!');
      } else {
        console.log('❌ [Locacoes] Cliente não encontrado para CPF:', cpf);
        
        setSelectedClient(null);
        setFormData(prev => ({
          ...prev,
          client_name: '',
          client_email: '',
          client_phone: '',
          client_cpf: cpf
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
    setFormData(prev => ({
      ...prev,
      motorcycle_id: motorcycleId,
      motorcycle_plate: selectedPlate?.placa || ''
    }));

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
      client_cpf: '',
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
      // Validações básicas
      if (!formData.client_name || !formData.client_cpf || !formData.motorcycle_id || !formData.motorcycle_plate || !formData.start_date) {
        toast.error('Preencha todos os campos obrigatórios');
        console.log('🚨 [Locacoes] Campos faltando:', {
          client_name: formData.client_name,
          client_cpf: formData.client_cpf,
          motorcycle_id: formData.motorcycle_id,
          motorcycle_plate: formData.motorcycle_plate,
          start_date: formData.start_date
        });
        return;
      }

      // Validar se IDs são UUIDs válidos
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(formData.motorcycle_id)) {
        toast.error('Selecione uma motocicleta válida');
        return;
      }

      if (formData.franchisee_id && !uuidRegex.test(formData.franchisee_id)) {
        console.warn('Franchisee ID inválido, será omitido:', formData.franchisee_id);
      }

      // Obter dados necessários
      const selectedPlan = plans.find(p => p.id === formData.plan_id);
      const dailyRate = selectedPlan?.daily_rate || 0;
      
      // Calcular total de dias se temos as datas
      let totalDays = 1;
      if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }


      // Criar dados da locação conforme esquema da tabela
      const rentalData: any = {
        client_name: formData.client_name,
        client_email: formData.client_email || '',
        client_phone: formData.client_phone || '',
        client_cpf: formData.client_cpf,
        motorcycle_id: formData.motorcycle_id,
        motorcycle_plate: formData.motorcycle_plate || '',
        start_date: formData.start_date,
        total_days: totalDays,
        daily_rate: dailyRate,
        total_amount: parseFloat(formData.total_value) || (dailyRate * totalDays),
        status: 'active'
      };

      // Adicionar campos opcionais apenas se tiverem valores válidos
      if (formData.end_date) {
        rentalData.end_date = formData.end_date;
      }

      if (formData.franchisee_id && uuidRegex.test(formData.franchisee_id)) {
        rentalData.franchisee_id = formData.franchisee_id;
      }

      if (formData.deposit_amount) {
        rentalData.deposit_amount = parseFloat(formData.deposit_amount);
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
        toast.error('Erro ao salvar locação no banco de dados');
        return;
      }

      console.log('✅ [Locacoes] Locação salva com sucesso:', savedRental);

      // Criar objeto para adicionar à lista local
      const newRental: Rental = {
        id: savedRental.id,
        client_name: savedRental.client_name,
        client_email: savedRental.client_email,
        client_phone: savedRental.client_phone,
        client_cpf: savedRental.client_cpf,
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
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as locações de motocicletas
          </p>
        </div>
        
        {/* Franqueados não podem criar novas locações */}
        {appUser?.role !== 'franchisee' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
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
                  <Label htmlFor="client_cpf">CPF/CNPJ do Cliente</Label>
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
                          client_cpf: ''
                        }));
                        setCpfSearch('');
                      }}
                    >
                      Limpar Cliente
                    </Button>
                  )}
                </div>
                <Input
                  id="client_cpf"
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
                          {motorcycle.placa} - {motorcycle.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.daily_rate}/dia
                      </SelectItem>
                    ))}
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

              {/* Valor Total */}
              <div className="space-y-2">
                <Label htmlFor="total_amount">Valor Total</Label>
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

              {/* Valor do Depósito */}
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Valor do Depósito</Label>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Locações
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRentals}</div>
            <p className="text-xs text-muted-foreground">
              Todas as locações registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Locações Ativas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeRentals}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento atualmente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Locações Finalizadas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedRentals}</div>
            <p className="text-xs text-muted-foreground">
              Concluídas com sucesso
            </p>
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                    <p><strong>CPF:</strong> {selectedRental.client_cpf}</p>
                    <p><strong>Email:</strong> {selectedRental.client_email}</p>
                    <p><strong>Telefone:</strong> {selectedRental.client_phone}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados da Motocicleta</h3>
                  <div className="space-y-2">
                    <p><strong>Modelo:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.modelo || 'N/A'}</p>
                    <p><strong>Placa:</strong> {motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.placa || 'N/A'}</p>
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

              {/* Gerador de PDF */}
              <div className="border-t pt-6">
                <PDFGenerator
                  rentalData={{
                    ...selectedRental,
                    motorcycle_model: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.modelo || '',
                    motorcycle_plate: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.placa || '',
                    franchisee_name: franchisees.find(f => f.id === selectedRental.franchisee_id)?.fantasy_name || '',
                    franchisee_cnpj: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cnpj || '',
                    plan_name: plans.find(p => p.id === selectedRental.plan_id)?.name || '',
                    plan_price: selectedRental.daily_rate * selectedRental.total_days
                  }}
                  onPDFGenerated={(url, type) => {
                    console.log(`PDF ${type} gerado:`, url);
                  }}
                />
              </div>

              {/* Assinatura Eletrônica */}
              <div className="border-t pt-6">
                <DigitalSignature
                  rentalData={{
                    ...selectedRental,
                    motorcycle_model: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.modelo || '',
                    motorcycle_plate: motorcycles.find(m => m.id === selectedRental.motorcycle_id)?.placa || '',
                    franchisee_name: franchisees.find(f => f.id === selectedRental.franchisee_id)?.fantasy_name || '',
                    franchisee_cnpj: franchisees.find(f => f.id === selectedRental.franchisee_id)?.cnpj || '',
                    plan_name: plans.find(p => p.id === selectedRental.plan_id)?.name || '',
                    plan_price: selectedRental.daily_rate * selectedRental.total_days
                  }}
                  onSignatureRequested={(signatureRequest) => {
                    console.log('Solicitação de assinatura criada:', signatureRequest);
                    toast.success('Solicitação de assinatura enviada!');
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
