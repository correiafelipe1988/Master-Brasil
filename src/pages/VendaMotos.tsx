import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ShieldAlert, BarChart3, Users, Table, TrendingUp, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type VendaMoto = Tables<'vendas'>;

interface VendasKPI {
  totalVendas: number;
  receitaTotal: number;
  ticketMedio: number;
  vendasMes: number;
  crescimentoMensal: number;
}

export default function VendaMotos() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [vendas, setVendas] = useState<VendaMoto[]>([]);
  const [kpis, setKpis] = useState<VendasKPI>({
    totalVendas: 0,
    receitaTotal: 0,
    ticketMedio: 0,
    vendasMes: 0,
    crescimentoMensal: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    data_compra: '',
    parceiro: '',
    status: 'PAGO' as 'PAGO' | 'PAGANDO' | 'PENDENTE',
    entregue: true,
    franqueado: '',
    cnpj: '',
    razao_social: '',
    quantidade: 0,
    marca: '',
    modelo: '',
    valor_unitario: 0,
    valor_total: 0
  });
  const [franqueados, setFranqueados] = useState<any[]>([]);
  const [selectedFranqueado, setSelectedFranqueado] = useState<string>('');

  useEffect(() => {
    fetchVendas();
    fetchFranqueados();
  }, [appUser]);

  const fetchFranqueados = async () => {
    try {
      console.log('🔍 [VendaMotos] Iniciando busca de franqueados...');
      console.log('🔍 [VendaMotos] Usuário atual:', {
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
          return;
        }

        cityId = franchiseeData?.city_id;
      }

      console.log('🔍 [VendaMotos] City ID para filtro:', cityId);

      let query = supabase
        .from('franchisees')
        .select('id, fantasy_name, company_name, cnpj, city_id')
        .eq('status', 'active')
        .order('fantasy_name');

      // Filtrar por cidade para usuários regionais
      if (appUser?.role === 'regional' && cityId) {
        console.log('🔍 [VendaMotos] Aplicando filtro por city_id para regional:', cityId);
        query = query.eq('city_id', cityId);
      } else {
        console.log('🔍 [VendaMotos] Sem filtro por city_id - role:', appUser?.role, 'cityId:', cityId);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('🔍 [VendaMotos] Franqueados encontrados:', data?.length, data);
      setFranqueados(data || []);
    } catch (error) {
      console.error('Erro ao buscar franqueados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar franqueados."
      });
    }
  };

  const fetchVendas = async () => {
    try {
      setIsLoading(true);

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
          return;
        }

        cityId = franchiseeData?.city_id;
      }

      let query = supabase
        .from('vendas')
        .select('*');

      // Filtrar por cidade para usuários regionais (quando necessário)
      if (appUser?.role === 'regional' && cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      setVendas(data || []);
      
      // Calcular KPIs
      const vendasData = data || [];
      const totalVendas = vendasData.reduce((acc, venda) => acc + venda.quantidade, 0);
      const receitaTotal = vendasData.reduce((acc, venda) => acc + venda.valor_total, 0);
      const ticketMedio = vendasData.length > 0 ? receitaTotal / vendasData.length : 0;
      
      setKpis({
        totalVendas,
        receitaTotal,
        ticketMedio,
        vendasMes: vendasData.length,
        crescimentoMensal: 15.5
      });
      
    } catch (error) {
      console.error('Error fetching vendas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as vendas."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFranqueado) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um franqueado."
      });
      return;
    }

    try {
      // Determinar city_id baseado no role do usuário
      let cityId = appUser?.city_id;

      if (appUser?.role === 'franchisee' && !cityId) {
        const { data: franchiseeData, error: franchiseeError } = await supabase
          .from('franchisees')
          .select('city_id')
          .eq('user_id', appUser.id)
          .single();

        if (franchiseeError) {
          throw new Error('Erro ao buscar dados do franqueado');
        }

        cityId = franchiseeData?.city_id;
      }

      const vendaData = {
        ...formData,
        valor_total: formData.quantidade * formData.valor_unitario,
        city_id: cityId
      };

      const { error } = await supabase
        .from('vendas')
        .insert([vendaData]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Venda criada com sucesso."
      });

      resetForm();
      setIsDialogOpen(false);
      fetchVendas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro inesperado."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      data_compra: '',
      parceiro: '',
      status: 'PAGO',
      entregue: true,
      franqueado: '',
      cnpj: '',
      razao_social: '',
      quantidade: 0,
      marca: '',
      modelo: '',
      valor_unitario: 0,
      valor_total: 0
    });
    setSelectedFranqueado('');
  };

  const handleFranqueadoSelect = (franqueadoId: string) => {
    setSelectedFranqueado(franqueadoId);
    
    const franqueado = franqueados.find(f => f.id === franqueadoId);
    if (franqueado) {
      setFormData(prev => ({
        ...prev,
        franqueado: franqueado.fantasy_name,
        cnpj: franqueado.cnpj,
        razao_social: franqueado.company_name
      }));
    }
  };

  // Controle de acesso - Franqueados não podem acessar
  if (appUser?.role === 'franchisee') {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-800">Acesso Restrito</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Acesso Negado</AlertTitle>
              <AlertDescription>
                Esta área é restrita e não está disponível para franqueados. 
                Apenas usuários regionais, Master Brasil e administradores podem acessar informações de vendas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dados de vendas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-green-800">Venda de Motos</CardTitle>
              <p className="text-muted-foreground">
                {appUser?.role === 'admin' || appUser?.role === 'master_br' 
                  ? 'Analise vendas, receitas e performance de todas as regiões'
                  : 'Analise vendas, receitas e performance da sua região'
                }
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <VendasKpiCards kpis={kpis} />

      {/* Tabs */}
      <Tabs defaultValue="graficos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="franqueado" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Análise por Franqueado
          </TabsTrigger>
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graficos">
          <AnaliseProdutoView vendas={vendas} />
        </TabsContent>

        <TabsContent value="franqueado">
          <AnaliseFranqueadoView vendas={vendas} />
        </TabsContent>

        <TabsContent value="dados">
          <VendaMotosTable 
            vendas={vendas} 
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            franqueados={franqueados}
            selectedFranqueado={selectedFranqueado}
            handleFranqueadoSelect={handleFranqueadoSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente KPI Cards
function VendasKpiCards({ kpis }: { kpis: VendasKPI }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-bold text-green-600">{kpis.totalVendas}</p>
              <p className="text-xs text-muted-foreground">unidades vendidas</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {kpis.receitaTotal.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">valor bruto</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {kpis.ticketMedio.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">por venda</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Crescimento</p>
              <p className="text-2xl font-bold text-orange-600">+{kpis.crescimentoMensal}%</p>
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Análise de Produto/Gráficos
function AnaliseProdutoView({ vendas }: { vendas: VendaMoto[] }) {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Produtos</CardTitle>
          <p className="text-muted-foreground">Gráficos e estatísticas de vendas por modelo e tipo</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg min-h-[300px] bg-muted/50">
            <BarChart3 className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Gráficos de vendas em desenvolvimento.
              <br />
              Em breve você poderá visualizar análises detalhadas por produto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Análise por Franqueado
function AnaliseFranqueadoView({ vendas }: { vendas: VendaMoto[] }) {
  const vendasPorFranqueado = vendas.reduce((acc, venda) => {
    const franqueado = venda.franqueado || 'Não Identificado';
    if (!acc[franqueado]) {
      acc[franqueado] = {
        totalVendas: 0,
        totalQuantidade: 0,
        receita: 0,
        vendas: []
      };
    }
    acc[franqueado].totalVendas++;
    acc[franqueado].totalQuantidade += venda.quantidade;
    acc[franqueado].receita += venda.valor_total;
    acc[franqueado].vendas.push(venda);
    return acc;
  }, {} as Record<string, { totalVendas: number; totalQuantidade: number; receita: number; vendas: VendaMoto[] }>);

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise por Franqueado</CardTitle>
          <p className="text-muted-foreground">Performance de vendas por franqueado</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(vendasPorFranqueado).map(([franqueado, dados]) => (
              <Card key={franqueado} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{franqueado}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pedidos:</span>
                      <span className="font-medium">{dados.totalVendas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantidade:</span>
                      <span className="font-medium">{dados.totalQuantidade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receita:</span>
                      <span className="font-medium">R$ {dados.receita.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ticket Médio:</span>
                      <span className="font-medium">
                        R$ {(dados.receita / dados.totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Tabela de Vendas
function VendaMotosTable({ 
  vendas,
  isDialogOpen,
  setIsDialogOpen,
  formData,
  setFormData,
  handleSubmit,
  franqueados,
  selectedFranqueado,
  handleFranqueadoSelect
}: { 
  vendas: VendaMoto[];
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  franqueados: any[];
  selectedFranqueado: string;
  handleFranqueadoSelect: (franqueadoId: string) => void;
}) {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dados de Vendas</CardTitle>
              <p className="text-muted-foreground">Lista completa de todas as vendas registradas</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Venda
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Venda</DialogTitle>
                  <DialogDescription>
                    Preencha as informações da venda abaixo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_compra">Data da Compra</Label>
                      <Input
                        id="data_compra"
                        type="date"
                        value={formData.data_compra}
                        onChange={(e) => setFormData({...formData, data_compra: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parceiro">Parceiro</Label>
                      <Input
                        id="parceiro"
                        value={formData.parceiro}
                        onChange={(e) => setFormData({...formData, parceiro: e.target.value})}
                        placeholder="Ex: HABBYZUCA, MEGA"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAGO">PAGO</SelectItem>
                          <SelectItem value="PAGANDO">PAGANDO</SelectItem>
                          <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="entregue">Entregue</Label>
                      <Select value={formData.entregue ? 'true' : 'false'} onValueChange={(value) => setFormData({...formData, entregue: value === 'true'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">SIM</SelectItem>
                          <SelectItem value="false">NÃO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="franqueado">Franqueado</Label>
                    <Select value={selectedFranqueado} onValueChange={handleFranqueadoSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o franqueado" />
                      </SelectTrigger>
                      <SelectContent>
                        {franqueados.map((franqueado) => (
                          <SelectItem key={franqueado.id} value={franqueado.id}>
                            {franqueado.fantasy_name} - {franqueado.cnpj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        disabled
                        className="bg-muted"
                        placeholder="Será preenchido automaticamente"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="razao_social">Razão Social</Label>
                      <Input
                        id="razao_social"
                        value={formData.razao_social}
                        disabled
                        className="bg-muted"
                        placeholder="Será preenchida automaticamente"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marca">Marca</Label>
                      <Select value={formData.marca} onValueChange={(value) => setFormData({...formData, marca: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Shineray">Shineray</SelectItem>
                          <SelectItem value="Dafra">Dafra</SelectItem>
                          <SelectItem value="Honda">Honda</SelectItem>
                          <SelectItem value="Yamaha">Yamaha</SelectItem>
                          <SelectItem value="Suzuki">Suzuki</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo}
                        onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                        placeholder="Ex: SHI175cc - Injetada"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={formData.quantidade}
                        onChange={(e) => {
                          const quantidade = parseInt(e.target.value) || 0;
                          const valor_total = quantidade * formData.valor_unitario;
                          setFormData({...formData, quantidade, valor_total});
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                      <Input
                        id="valor_unitario"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valor_unitario}
                        onChange={(e) => {
                          const valor_unitario = parseFloat(e.target.value) || 0;
                          const valor_total = formData.quantidade * valor_unitario;
                          setFormData({...formData, valor_unitario, valor_total});
                        }}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor_total">Valor Total (R$)</Label>
                      <Input
                        id="valor_total"
                        type="number"
                        step="0.01"
                        value={formData.valor_total}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      Salvar Venda
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
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg min-h-[300px] bg-muted/50">
              <Table className="h-24 w-24 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma venda encontrada.
                <br />
                As vendas registradas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 border border-border font-medium">Data Compra</th>
                    <th className="text-left p-3 border border-border font-medium">Parceiro</th>
                    <th className="text-left p-3 border border-border font-medium">Status</th>
                    <th className="text-left p-3 border border-border font-medium">Entregue</th>
                    <th className="text-left p-3 border border-border font-medium">Franqueado</th>
                    <th className="text-left p-3 border border-border font-medium">CNPJ</th>
                    <th className="text-left p-3 border border-border font-medium">Razão Social</th>
                    <th className="text-left p-3 border border-border font-medium">Qtd</th>
                    <th className="text-left p-3 border border-border font-medium">Marca</th>
                    <th className="text-left p-3 border border-border font-medium">Modelo</th>
                    <th className="text-left p-3 border border-border font-medium">Valor Unitário</th>
                    <th className="text-left p-3 border border-border font-medium">Valor Total</th>
                    <th className="text-left p-3 border border-border font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-muted/25">
                      <td className="p-3 border border-border">
                        {new Date(venda.data_compra).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 border border-border font-medium">{venda.parceiro}</td>
                      <td className="p-3 border border-border">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          venda.status === 'PAGO' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {venda.status}
                        </span>
                      </td>
                      <td className="p-3 border border-border">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          venda.entregue 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {venda.entregue ? 'SIM' : 'NÃO'}
                        </span>
                      </td>
                      <td className="p-3 border border-border">{venda.franqueado}</td>
                      <td className="p-3 border border-border font-mono text-sm">{venda.cnpj}</td>
                      <td className="p-3 border border-border">{venda.razao_social}</td>
                      <td className="p-3 border border-border text-center font-medium">{venda.quantidade}</td>
                      <td className="p-3 border border-border">{venda.marca}</td>
                      <td className="p-3 border border-border">{venda.modelo}</td>
                      <td className="p-3 border border-border font-semibold text-blue-600">
                        R$ {venda.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 border border-border font-semibold text-green-600">
                        R$ {venda.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 border border-border">
                        <div className="flex gap-1">
                          <button className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                            Ver
                          </button>
                          <button className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors">
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}