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

interface Rental {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string;
  motorcycle_id: string;
  franchisee_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
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

      // Carregar motos
      const { data: motorcyclesData, error: motorcyclesError } = await supabase
        .from('motorcycles')
        .select('*');

      if (motorcyclesError) throw motorcyclesError;

      // Carregar franqueados
      const { data: franchiseesData, error: franchiseesError } = await supabase
        .from('franchisees')
        .select('*');

      if (franchiseesError) throw franchiseesError;

      // Carregar contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*');

      if (contractsError) throw contractsError;

      setRentals(rentalsData || []);
      setPlans(plansData || []);
      setMotorcycles(motorcyclesData || []);
      setFranchisees(franchiseesData || []);
      setContracts(contractsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
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
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente</Label>
                  <Input
                    id="client_name"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone</Label>
                  <Input
                    id="client_phone"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_document">CPF/CNPJ</Label>
                  <Input
                    id="client_document"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motorcycle_id">Moto</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma moto" />
                  </SelectTrigger>
                  <SelectContent>
                    {motorcycles.map((motorcycle) => (
                      <SelectItem key={motorcycle.id} value={motorcycle.id}>
                        {motorcycle.brand} {motorcycle.model} - {motorcycle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="franchisee_id">Franqueado</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um franqueado" />
                    </SelectTrigger>
                    <SelectContent>
                      {franchisees.map((franchisee) => (
                        <SelectItem key={franchisee.id} value={franchisee.id}>
                          {franchisee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan_id">Plano</Label>
                  <Select>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Fim</Label>
                  <Input
                    id="end_date"
                    type="date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_amount">Valor Total</Label>
                <Input
                  id="total_amount"
                  placeholder="R$ 0,00"
                  readOnly
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
                  <th className="text-left p-2">Caução</th>
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
                        <div>{formatDate(rental.start_date)} - {formatDate(rental.end_date)}</div>
                        <div className="text-muted-foreground">{rental.total_days} dias</div>
                      </div>
                    </td>
                    <td className="p-2">R$ {rental.daily_rate}</td>
                    <td className="p-2">R$ {rental.total_amount}</td>
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
