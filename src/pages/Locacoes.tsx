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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Rental {
  id: string;
  client_name: string;
  client_cpf: string;
  client_email: string;
  client_phone: string;
  motorcycle_plate: string;
  daily_rate: number;
  total_days: number;
  total_amount: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  franchisee_name?: string;
  plan_name?: string;
  created_at: string;
}

interface RentalPlan {
  id: string;
  name: string;
  daily_rate: number;
  weekly_rate: number;
  monthly_rate: number;
  deposit_amount: number;
  description: string;
}

interface Contract {
  id: string;
  contract_number: string;
  pdf_url: string;
  signature_status: string;
  signature_url: string;
  signed_at: string;
  created_at: string;
}

export default function Locacoes() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [plans, setPlans] = useState<RentalPlan[]>([]);
  const [motorcycles, setMotorcycles] = useState<any[]>([]);
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Métricas
  const totalRentals = rentals.length;
  const activeRentals = rentals.filter(r => r.status === 'active').length;
  const completedRentals = rentals.filter(r => r.status === 'completed').length;

  // Form data para nova locação
  const [formData, setFormData] = useState({
    client_name: '',
    client_cpf: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    motorcycle_id: '',
    plan_id: '',
    start_date: '',
    total_days: 1,
    notes: ''
  });

  useEffect(() => {
    fetchRentals();
    fetchPlans();
    fetchMotorcycles();
    fetchFranchisees();
  }, []);

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('rentals')
        .select(`
          *,
          rental_plans:plan_id (name),
          franchisees:franchisee_id (fantasy_name),
          motorcycles:motorcycle_id (model, brand)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros baseados no papel do usuário
      if (appUser?.role === 'regional' && appUser.city_id) {
        query = query.eq('city_id', appUser.city_id);
      } else if (appUser?.role === 'franchisee') {
        // Buscar franchisee_id do usuário
        const { data: franchiseeData } = await supabase
          .from('franchisees')
          .select('id')
          .eq('user_id', appUser.id)
          .single();
        
        if (franchiseeData) {
          query = query.eq('franchisee_id', franchiseeData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setRentals(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao carregar locações."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_plans')
        .select('*')
        .eq('is_active', true)
        .order('daily_rate');

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const fetchMotorcycles = async () => {
    try {
      let query = supabase
        .from('motorcycles')
        .select('*')
        .eq('status', 'available')
        .order('model');

      // Aplicar filtros baseados no papel do usuário
      if (appUser?.role === 'regional' && appUser.city_id) {
        query = query.eq('city_id', appUser.city_id);
      } else if (appUser?.role === 'franchisee') {
        const { data: franchiseeData } = await supabase
          .from('franchisees')
          .select('id')
          .eq('user_id', appUser.id)
          .single();
        
        if (franchiseeData) {
          query = query.eq('franchisee_id', franchiseeData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setMotorcycles(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar motos:', error);
    }
  };

  const fetchFranchisees = async () => {
    try {
      let query = supabase
        .from('franchisees')
        .select('*')
        .eq('status', 'active')
        .order('fantasy_name');

      if (appUser?.role === 'regional' && appUser.city_id) {
        query = query.eq('city_id', appUser.city_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFranchisees(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar franqueados:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const },
      completed: { label: 'Finalizada', variant: 'secondary' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
      overdue: { label: 'Atrasada', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as locações de motos
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
            {/* Formulário de Nova Locação */}
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_cpf">CPF</Label>
                  <Input
                    id="client_cpf"
                    value={formData.client_cpf}
                    onChange={(e) => setFormData({...formData, client_cpf: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">E-mail</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_address">Endereço</Label>
                <Textarea
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) => setFormData({...formData, client_address: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motorcycle_id">Moto</Label>
                  <Select value={formData.motorcycle_id} onValueChange={(value) => setFormData({...formData, motorcycle_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma moto" />
                    </SelectTrigger>
                    <SelectContent>
                      {motorcycles.map((moto) => (
                        <SelectItem key={moto.id} value={moto.id}>
                          {moto.brand} {moto.model} - {moto.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan_id">Plano</Label>
                  <Select value={formData.plan_id} onValueChange={(value) => setFormData({...formData, plan_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {formatCurrency(plan.daily_rate)}/dia
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_days">Quantidade de Dias</Label>
                  <Input
                    id="total_days"
                    type="number"
                    min="1"
                    value={formData.total_days}
                    onChange={(e) => setFormData({...formData, total_days: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Observações adicionais"
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
            <CardTitle className="text-sm font-medium">Total de Locações</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Locações Ativas</CardTitle>
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
            <CardTitle className="text-sm font-medium">Locações Finalizadas</CardTitle>
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Placa</th>
                  <th className="text-left p-3 font-medium">Franqueado</th>
                  <th className="text-left p-3 font-medium">Período</th>
                  <th className="text-left p-3 font-medium">Diária</th>
                  <th className="text-left p-3 font-medium">Caução</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{rental.client_name}</div>
                        <div className="text-sm text-muted-foreground">{rental.client_email}</div>
                      </div>
                    </td>
                    <td className="p-3 font-mono">{rental.motorcycle_plate}</td>
                    <td className="p-3">{rental.franchisee_name || 'N/A'}</td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{formatDate(rental.start_date)} - {formatDate(rental.end_date)}</div>
                        <div className="text-muted-foreground">{rental.total_days} dias</div>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{formatCurrency(rental.daily_rate)}</td>
                    <td className="p-3 font-medium">{formatCurrency(rental.deposit_amount)}</td>
                    <td className="p-3">{getStatusBadge(rental.status)}</td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRental(rental)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes da Locação */}
      {selectedRental && (
        <Dialog open={!!selectedRental} onOpenChange={() => setSelectedRental(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Locação</DialogTitle>
              <DialogDescription>
                Informações completas da locação e contratos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                    <p className="font-medium">{selectedRental.client_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                    <p className="font-medium">{selectedRental.client_cpf}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                    <p className="font-medium">{selectedRental.client_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{selectedRental.client_phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações da Locação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados da Locação</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Placa da Moto</Label>
                    <p className="font-medium font-mono">{selectedRental.motorcycle_plate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Franqueado</Label>
                    <p className="font-medium">{selectedRental.franchisee_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRental.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Início</Label>
                    <p className="font-medium">{formatDate(selectedRental.start_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Fim</Label>
                    <p className="font-medium">{formatDate(selectedRental.end_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total de Dias</Label>
                    <p className="font-medium">{selectedRental.total_days} dias</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor da Diária</Label>
                    <p className="font-medium">{formatCurrency(selectedRental.daily_rate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Caução</Label>
                    <p className="font-medium">{formatCurrency(selectedRental.deposit_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                    <p className="font-medium text-lg text-green-600">{formatCurrency(selectedRental.total_amount)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Seção de Contratos */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Contratos</CardTitle>
                  <Button className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Gerar Contrato
                  </Button>
                </CardHeader>
                <CardContent>
                  {contracts.length > 0 ? (
                    <div className="space-y-3">
                      {contracts.map((contract) => (
                        <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">Contrato #{contract.contract_number}</p>
                              <p className="text-sm text-muted-foreground">
                                Criado em {formatDate(contract.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={contract.signature_status === 'signed' ? 'default' : 'secondary'}>
                              {contract.signature_status === 'signed' ? 'Assinado' :
                               contract.signature_status === 'sent' ? 'Enviado' :
                               contract.signature_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                            {contract.signature_status === 'pending' && (
                              <Button variant="outline" size="sm">
                                <Send className="h-3 w-3 mr-1" />
                                Enviar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum contrato gerado ainda</p>
                      <p className="text-sm">Clique em "Gerar Contrato" para criar o primeiro contrato</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
