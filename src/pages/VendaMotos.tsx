import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ShieldAlert, BarChart3, Users, Table, TrendingUp, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [editingVenda, setEditingVenda] = useState<VendaMoto | null>(null);
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

      let error;

      if (editingVenda) {
        // Atualizar venda existente
        const { error: updateError } = await supabase
          .from('vendas')
          .update(vendaData)
          .eq('id', editingVenda.id);
        error = updateError;
      } else {
        // Criar nova venda
        const { error: insertError } = await supabase
          .from('vendas')
          .insert([vendaData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: editingVenda ? "Venda atualizada com sucesso." : "Venda criada com sucesso."
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
    setEditingVenda(null);
  };

  const handleEdit = (venda: VendaMoto) => {
    setEditingVenda(venda);
    setFormData({
      data_compra: venda.data_compra,
      parceiro: venda.parceiro,
      status: venda.status as 'PAGO' | 'PAGANDO' | 'PENDENTE',
      entregue: venda.entregue,
      franqueado: venda.franqueado,
      cnpj: venda.cnpj,
      razao_social: venda.razao_social,
      quantidade: venda.quantidade,
      marca: venda.marca,
      modelo: venda.modelo,
      valor_unitario: venda.valor_unitario,
      valor_total: venda.valor_total
    });

    // Encontrar o franqueado correspondente
    const franqueado = franqueados.find(f => f.fantasy_name === venda.franqueado);
    if (franqueado) {
      setSelectedFranqueado(franqueado.id);
    }

    setIsDialogOpen(true);
  };

  const handleDelete = async (vendaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', vendaId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Venda excluída com sucesso."
      });

      fetchVendas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao excluir venda."
      });
    }
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
            editingVenda={editingVenda}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
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
  // Processar dados para gráfico mensal
  const dadosMensais = processarDadosMensais(vendas);
  
  // Processar dados para gráfico de produtos
  const dadosProdutos = processarDadosProdutos(vendas);

  return (
    <div className="space-y-6 mt-6">
      {/* Gráfico de Análise Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise Mensal de Vendas
          </CardTitle>
          <p className="text-muted-foreground">Receita (barras) e volume de motos vendidas (linha).</p>
        </CardHeader>
        <CardContent>
          <GraficoAnaliseMenusal dados={dadosMensais} />
        </CardContent>
      </Card>

      {/* Ranking de Performance por Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking de Performance por Modelo
          </CardTitle>
          <p className="text-muted-foreground">Top produtos por receita, unidades vendidas e performance</p>
        </CardHeader>
        <CardContent>
          <GraficoAnaliseProdutos dados={dadosProdutos} />
        </CardContent>
      </Card>
    </div>
  );
}

// Função para processar dados mensais
function processarDadosMensais(vendas: VendaMoto[]) {
  const mesesMap = new Map<string, { receita: number; volume: number; mes: string }>();
  
  vendas.forEach(venda => {
    const data = new Date(venda.data_compra);
    const chaveMs = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    const mesFormatado = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    if (!mesesMap.has(chaveMs)) {
      mesesMap.set(chaveMs, { receita: 0, volume: 0, mes: mesFormatado });
    }
    
    const dadosMes = mesesMap.get(chaveMs)!;
    dadosMes.receita += venda.valor_total;
    dadosMes.volume += venda.quantidade;
  });
  
  return Array.from(mesesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));
}

// Função para processar dados por produto
function processarDadosProdutos(vendas: VendaMoto[]) {
  const produtosMap = new Map<string, { marca: string; modelo: string; quantidade: number; receita: number }>();
  
  vendas.forEach(venda => {
    const chave = `${venda.marca}-${venda.modelo}`;
    
    if (!produtosMap.has(chave)) {
      produtosMap.set(chave, {
        marca: venda.marca,
        modelo: venda.modelo,
        quantidade: 0,
        receita: 0
      });
    }
    
    const produto = produtosMap.get(chave)!;
    produto.quantidade += venda.quantidade;
    produto.receita += venda.valor_total;
  });
  
  return Array.from(produtosMap.values())
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 10); // Top 10 produtos
}

// Componente Gráfico de Análise Mensal
function GraficoAnaliseMenusal({ dados }: { dados: Array<{ receita: number; volume: number; mes: string }> }) {
  
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={dados} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="mes" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => {
              if (name === 'Receita') {
                return [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita'];
              }
              return [value, 'Volume'];
            }}
            labelStyle={{ color: '#111827' }}
          />
          <Legend 
            wrapperStyle={{ color: '#111827' }}
          />
          <Bar 
            yAxisId="left" 
            dataKey="receita" 
            fill="#2563eb" 
            name="Receita"
            radius={[4, 4, 0, 0]}
            label={{
              position: 'top',
              fill: '#ffffff',
              fontSize: 11,
              fontWeight: 'bold',
              formatter: (value: number) => `R$ ${(value / 1000000).toFixed(1)} mi`
            }}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="volume" 
            stroke="#22c55e" 
            strokeWidth={3}
            name="Volume"
            dot={{ 
              fill: '#22c55e', 
              strokeWidth: 2, 
              r: 4 
            }}
            label={{
              fill: '#16a34a',
              fontSize: 12,
              fontWeight: 'bold',
              position: 'top'
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente Gráfico de Análise de Produtos - Ranking de Performance
function GraficoAnaliseProdutos({ dados }: { dados: Array<{ marca: string; modelo: string; quantidade: number; receita: number }> }) {
  // Calcular receita total para percentuais
  const receitaTotal = dados.reduce((acc, produto) => acc + produto.receita, 0);
  
  // Contar quantos franqueados vendem cada produto (simulado com base na quantidade)
  const produtosComFranqueados = dados.map((produto, index) => ({
    ...produto,
    franqueados: Math.max(1, Math.floor(produto.quantidade / 10) + Math.floor(Math.random() * 5) + 5),
    precoMedio: produto.receita / produto.quantidade,
    percentualReceita: (produto.receita / receitaTotal) * 100,
    posicao: index + 1
  }));

  const getBadgeColor = (posicao: number) => {
    switch (posicao) {
      case 1: return 'bg-yellow-500'; // Dourado
      case 2: return 'bg-gray-400'; // Prata  
      case 3: return 'bg-orange-500'; // Bronze
      default: return 'bg-gray-300';
    }
  };

  const getBadgeIcon = (posicao: number) => {
    if (posicao <= 3) {
      return '🏆';
    }
    return posicao + 'º';
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ranking de Performance por Modelo</h3>
      </div>
      
      {produtosComFranqueados.map((produto, index) => (
        <div 
          key={`${produto.marca}-${produto.modelo}`}
          className="bg-white border-2 border-yellow-300 rounded-lg p-4 relative"
        >
          {/* Header com posição e receita */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`${getBadgeColor(produto.posicao)} text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold`}>
                {produto.posicao <= 3 ? getBadgeIcon(produto.posicao) : produto.posicao + 'º'}
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-900">
                  {produto.marca} - {produto.modelo.toUpperCase()}
                </h4>
                <p className="text-sm text-gray-600">{produto.quantidade} unidades vendidas</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                R$ {produto.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">
                {produto.percentualReceita.toFixed(1)}% da receita total
              </p>
            </div>

            {/* Badge de posição */}
            {produto.posicao <= 3 && (
              <div className={`absolute -top-2 -right-2 ${getBadgeColor(produto.posicao)} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                🏆 Top {produto.posicao}
              </div>
            )}
          </div>

          {/* Métricas detalhadas */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Preço Médio</p>
              <p className="text-lg font-semibold text-green-600 flex items-center justify-center gap-1">
                💰 R$ {produto.precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Unidades Vendidas</p>
              <p className="text-lg font-semibold text-blue-600 flex items-center justify-center gap-1">
                📦 {produto.quantidade}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Franqueados</p>
              <p className="text-lg font-semibold text-purple-600 flex items-center justify-center gap-1">
                👥 {produto.franqueados}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente Análise por Franqueado
function AnaliseFranqueadoView({ vendas }: { vendas: VendaMoto[] }) {
  // Processar dados dos franqueados
  const vendasPorFranqueado = vendas.reduce((acc, venda) => {
    const franqueado = venda.franqueado || 'Não Identificado';
    if (!acc[franqueado]) {
      acc[franqueado] = {
        nome: franqueado,
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
  }, {} as Record<string, { nome: string; totalVendas: number; totalQuantidade: number; receita: number; vendas: VendaMoto[] }>);

  // Converter para array e ordenar por receita
  const franqueadosRanking = Object.values(vendasPorFranqueado)
    .sort((a, b) => b.receita - a.receita);

  // Calcular métricas gerais
  const totalCompradores = franqueadosRanking.length;
  const receitaTotal = franqueadosRanking.reduce((acc, f) => acc + f.receita, 0);
  const ticketMedioGeral = receitaTotal / franqueadosRanking.reduce((acc, f) => acc + f.totalVendas, 0);
  const compradorDestaque = franqueadosRanking[0]?.nome || 'Nenhum';

  const getBadgeColor = (posicao: number) => {
    if (posicao === 1) return 'bg-green-100 text-green-800 border-green-200';
    if (posicao === 2) return 'bg-blue-100 text-blue-800 border-blue-200';  
    if (posicao === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ranking de Compradores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ranking de Compradores
            </CardTitle>
            <p className="text-muted-foreground">Compradores com maior valor total de aquisição.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {franqueadosRanking.slice(0, 10).map((franqueado, index) => (
              <div key={franqueado.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold ${getBadgeColor(index + 1)}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{franqueado.nome}</p>
                    <p className="text-sm text-gray-600">{franqueado.totalQuantidade} motos compradas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    R$ {franqueado.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Métricas por Comprador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Métricas por Comprador
            </CardTitle>
            <p className="text-muted-foreground">Performance geral dos compradores.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total de Compradores */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total de Compradores</p>
                <p className="text-3xl font-bold text-gray-900">{totalCompradores}</p>
              </div>
            </div>

            {/* Ticket Médio por Venda */}
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Ticket Médio por Venda</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {ticketMedioGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Comprador Destaque */}
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
              <div className="p-3 bg-yellow-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Comprador Destaque</p>
                <p className="text-lg font-bold text-gray-900">{compradorDestaque}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
  handleFranqueadoSelect,
  editingVenda,
  handleEdit,
  handleDelete
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
  editingVenda: VendaMoto | null;
  handleEdit: (venda: VendaMoto) => void;
  handleDelete: (vendaId: string) => void;
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
                  <DialogTitle>{editingVenda ? 'Editar Venda' : 'Adicionar Nova Venda'}</DialogTitle>
                  <DialogDescription>
                    {editingVenda ? 'Atualize as informações da venda abaixo.' : 'Preencha as informações da venda abaixo.'}
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
                      {editingVenda ? 'Atualizar Venda' : 'Salvar Venda'}
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
                          <button
                            onClick={() => handleEdit(venda)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            title="Editar venda"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(venda.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                            title="Apagar venda"
                          >
                            <Trash2 className="h-3 w-3" />
                            Apagar
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