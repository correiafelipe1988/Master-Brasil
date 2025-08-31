import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Deal = Tables<'deals'>;
type Lead = Tables<'leads'>;

interface DealWithLead extends Deal {
  leads?: {
    name: string;
  };
}

export default function Deals() {
  const [deals, setDeals] = useState<DealWithLead[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const { appUser } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    stage: 'novo',
    lead_id: ''
  });

  useEffect(() => {
    fetchDeals();
    fetchLeads();
  }, []);

  const fetchDeals = async () => {
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
        .from('deals')
        .select(`
          *,
          leads:lead_id (name)
        `);
      
      // Filtrar por cidade para usuários regionais e franqueados
      if ((appUser?.role === 'regional' || appUser?.role === 'franchisee') && cityId) {
        query = query.eq('city_id', cityId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os negócios."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
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
        .from('leads')
        .select('id, name');
      
      // Filtrar por cidade para usuários regionais e franqueados
      if ((appUser?.role === 'regional' || appUser?.role === 'franchisee') && cityId) {
        query = query.eq('city_id', cityId);
      }
      
      const { data, error } = await query.order('name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Título é obrigatório."
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
      
      const dealData = {
        title: formData.title.trim(),
        amount: parseFloat(formData.amount) || 0,
        stage: formData.stage,
        lead_id: formData.lead_id || null,
        city_id: cityId
      };

      let error;
      if (editingDeal) {
        const { error: updateError } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', editingDeal.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('deals')
          .insert([dealData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Negócio ${editingDeal ? 'atualizado' : 'criado'} com sucesso.`
      });

      resetForm();
      setIsDialogOpen(false);
      fetchDeals();
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
      title: '',
      amount: '',
      stage: 'novo',
      lead_id: ''
    });
    setEditingDeal(null);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      amount: deal.amount.toString(),
      stage: deal.stage,
      lead_id: deal.lead_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Tem certeza que deseja excluir este negócio?')) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Negócio excluído com sucesso."
      });

      fetchDeals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o negócio."
      });
    }
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'novo': 'bg-blue-100 text-blue-800',
      'qualificado': 'bg-yellow-100 text-yellow-800',
      'proposta': 'bg-purple-100 text-purple-800',
      'ganho': 'bg-green-100 text-green-800',
      'perdido': 'bg-red-100 text-red-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStageLabel = (stage: string) => {
    const labels = {
      'novo': 'Novo',
      'qualificado': 'Qualificado',
      'proposta': 'Proposta',
      'ganho': 'Ganho',
      'perdido': 'Perdido'
    };
    return labels[stage as keyof typeof labels] || stage;
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.leads?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Negócios</h1>
          <p className="text-muted-foreground">Gerencie seu pipeline de vendas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Negócio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDeal ? 'Editar' : 'Novo'} Negócio</DialogTitle>
              <DialogDescription>
                {editingDeal ? 'Edite as informações' : 'Adicione um novo negócio ao pipeline'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Venda de moto para João"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="stage">Estágio</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="ganho">Ganho</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="lead_id">Lead Relacionado</Label>
                <Select value={formData.lead_id} onValueChange={(value) => setFormData({...formData, lead_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDeal ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por título ou lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="stage-filter">Estágio</Label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="ganho">Ganho</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Negócios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Negócios ({filteredDeals.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>{deal.leads?.name || '-'}</TableCell>
                    <TableCell>{formatCurrency(deal.amount)}</TableCell>
                    <TableCell>
                      <Badge className={getStageColor(deal.stage)}>
                        {getStageLabel(deal.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(deal.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(deal)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(deal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDeals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum negócio encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
