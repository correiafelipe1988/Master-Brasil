import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Car, Users, CheckCircle, Clock, Plus, Eye, FileText, Download, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

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

interface Contract {
  id: string;
  rental_id: string;
  contract_number: string;
  signed_date: string;
  status: 'pending' | 'signed' | 'expired';
  document_url?: string;
}

export default function Locacoes() {
  const { appUser } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [plans, setPlans] = useState<RentalPlan[]>([]);
  const [motorcycles, setMotorcycles] = useState<any[]>([]);
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedFranchisee, setSelectedFranchisee] = useState<any>(null);
  const [availablePlates, setAvailablePlates] = useState<any[]>([]);
  const [cpfSearch, setCpfSearch] = useState('');
  const [clients, setClients] = useState<any[]>([]);

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

      // Carregar locações
      const { data: rentalsData, error: rentalsError } = await supabase
        .from('rentals')
        .select('*')
        .order('created_at', { ascending: false });

      if (rentalsError) throw rentalsError;

      // Carregar planos
      const { data: plansData, error: plansError } = await supabase
        .from('rental_plans')
        .select('*');

      if (plansError) throw plansError;

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

      // Executar queries
      const { data: motorcyclesData, error: motorcyclesError } = await motorcyclesQuery;
      if (motorcyclesError) throw motorcyclesError;

      const { data: franchiseesData, error: franchiseesError } = await franchiseesQuery;
      if (franchiseesError) throw franchiseesError;

      // Carregar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) throw clientsError;

      setRentals(rentalsData || []);
      setPlans(plansData || []);
      setMotorcycles(motorcyclesData || []);
      setFranchisees(franchiseesData || []);
      setClients(clientsData || []);

      console.log('🔍 [Locacoes] Dados carregados:', {
        motorcycles: motorcyclesData?.length || 0,
        franchisees: franchiseesData?.length || 0,
        clients: clientsData?.length || 0
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

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('cpf', cpf)
        .single();

      console.log('🔍 [Locacoes] Resultado da busca:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar cliente:', error);
        toast.error('Erro ao buscar cliente');
        return;
      }

      if (data) {
        console.log('🔍 [Locacoes] Cliente encontrado:', data);
        setSelectedClient(data);

        // Verificar se os campos existem no objeto data
        console.log('🔍 [Locacoes] Campos do cliente:', {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          cpf: data.cpf
        });

        setFormData(prev => ({
          ...prev,
          client_name: data.full_name || '',
          client_email: data.email || '',
          client_phone: data.phone || '',
          client_cpf: data.cpf || cpf
        }));
        toast.success('Cliente encontrado!');
      } else {
        console.log('🔍 [Locacoes] Cliente não encontrado');
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
      console.error('Erro ao buscar cliente:', error);
      toast.error('Erro ao buscar cliente');
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
    if (selectedMotorcycle) {
      const franchisee = franchisees.find(f => f.user_id === selectedMotorcycle.franchisee_id);
      if (franchisee) {
        setSelectedFranchisee(franchisee);
        setFormData(prev => ({
          ...prev,
          franchisee_id: franchisee.id
        }));
      }
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
      if (!formData.client_name || !formData.client_cpf || !formData.motorcycle_id || !formData.plan_id) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Criar dados da locação
      const rentalData: any = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        client_cpf: formData.client_cpf,
        motorcycle_id: formData.motorcycle_id,
        franchisee_id: formData.franchisee_id,
        plan_id: formData.plan_id,
        start_date: formData.start_date,
        km_inicial: parseInt(formData.km_inicial) || 0,
        km_final: parseInt(formData.km_final) || 0,
        total_amount: parseFloat(formData.total_value) || 0,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Só adicionar end_date se foi fornecida
      if (formData.end_date) {
        rentalData.end_date = formData.end_date;
      }

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('rentals')
        .insert([rentalData])
        .select();

      if (error) {
        console.error('Erro ao salvar locação:', error);
        toast.error('Erro ao salvar locação: ' + error.message);
        return;
      }

      toast.success('Locação criada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      loadData(); // Recarregar dados

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
                    ✓ Cliente encontrado: {selectedClient.full_name}
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
                          onClick={() => setSelectedRental(rental)}
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
    </div>
  );
}
