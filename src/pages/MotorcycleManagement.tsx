import { useState, useCallback, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Download, PlusCircle, Edit, Trash2, Bike } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Motorcycle {
  id: string;
  placa: string;
  modelo: string;
  status: 'active' | 'alugada' | 'relocada' | 'manutencao' | 'recolhida' | 'indisponivel_rastreador' | 'indisponivel_emplacamento';
  codigo_cs?: string;
  tipo?: 'Nova' | 'Usada';
  valor_semanal?: number;
  data_ultima_mov?: string;
  data_criacao?: string;
  city_id?: string;
  franchisee_id?: string;
  franchisee?: {
    id: string;
    email: string;
    role: string;
    franchisee_data?: Array<{
      company_name: string;
      fantasy_name: string;
    }>;
  };
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export type MotorcyclePageFilters = {
  status: string | 'all';
  model: string | 'all';
  searchTerm: string;
};

// Componente do formulário de moto
interface MotorcycleFormProps {
  editingMotorcycle: Motorcycle | null;
  onSave: (motorcycleData: Motorcycle) => void;
  onCancel: () => void;
  appUser: any;
}

function MotorcycleForm({ editingMotorcycle, onSave, onCancel, appUser }: MotorcycleFormProps) {
  const [formData, setFormData] = useState({
    placa: editingMotorcycle?.placa || '',
    modelo: editingMotorcycle?.modelo || '',
    tipo: editingMotorcycle?.tipo || 'Usada',
    status: editingMotorcycle?.status || 'active',
    valor_semanal: editingMotorcycle?.valor_semanal?.toString() || '',
    data_ultima_mov: editingMotorcycle?.data_ultima_mov ? 
      new Date(editingMotorcycle.data_ultima_mov).toISOString().split('T')[0] : '',
    dias_parado: '0',
    franchisee_id: editingMotorcycle?.franchisee_id || 'none',
    codigo_cs: editingMotorcycle?.codigo_cs || '',
  });

  const [franchisees, setFranchisees] = useState<Array<{
    id: string,
    email: string,
    role: string,
    franchisee_data?: Array<{
      company_name: string;
      fantasy_name: string;
    }>
  }>>([]);

  // Buscar franqueados da cidade atual
  useEffect(() => {
    const fetchFranchisees = async () => {
      if (!appUser?.city_id) return;

      try {
        const { data, error } = await supabase
          .from('app_users')
          .select(`
            id,
            email,
            role,
            franchisee_data:franchisees!franchisees_user_id_fkey(
              company_name,
              fantasy_name
            )
          `)
          .eq('city_id', appUser.city_id)
          .eq('role', 'franchisee');

        if (error) throw error;
        setFranchisees(data || []);
      } catch (error) {
        console.error('Erro ao buscar franqueados:', error);
      }
    };

    fetchFranchisees();
  }, [appUser?.city_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.placa || !formData.modelo) {
      return;
    }

    const motorcycleData: Motorcycle = {
      id: editingMotorcycle?.id || '',
      placa: formData.placa.toUpperCase(),
      modelo: formData.modelo,
      tipo: formData.tipo as 'Nova' | 'Usada',
      status: formData.status as any,
      valor_semanal: formData.valor_semanal ? parseFloat(formData.valor_semanal) : undefined,
      data_ultima_mov: formData.data_ultima_mov ? new Date(formData.data_ultima_mov).toISOString() : undefined,
      codigo_cs: formData.codigo_cs,
      city_id: appUser?.city_id,
      franchisee_id: formData.franchisee_id === 'none' ? null : formData.franchisee_id || null,
      data_criacao: editingMotorcycle?.data_criacao || new Date().toISOString(),
    };

    onSave(motorcycleData);
  };

  const statusOptions = [
    { value: 'active', label: 'Disponível' },
    { value: 'alugada', label: 'Alugada' },
    { value: 'relocada', label: 'Relocada' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'recolhida', label: 'Recolhida' },
    { value: 'indisponivel_rastreador', label: 'Indisponível - Rastreador' },
    { value: 'indisponivel_emplacamento', label: 'Indisponível - Emplacamento' }
  ];

  const modeloOptions = [
    'Honda CG 160 Start',
    'Honda CG 160 Cargo',
    'Yamaha Factor 125',
    'Shineray SHI 175',
    'Haojue DK160',
    'Haojue DK 150'
  ];

  const tipoOptions = [
    { value: 'Nova', label: 'Nova' },
    { value: 'Usada', label: 'Usada' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-blue-600" />
          {editingMotorcycle ? 'Editar Motocicleta' : 'Adicionar Nova Moto'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Placa */}
        <div className="space-y-2">
          <Label htmlFor="placa" className="text-sm font-medium">
            Placa <span className="text-red-500">*</span>
          </Label>
          <Input
            id="placa"
            type="text"
            placeholder="Ex: BRA2E19"
            maxLength={8}
            value={formData.placa}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') 
            }))}
            className="text-sm"
            required
          />
        </div>

        {/* Modelo e Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelo" className="text-sm font-medium">Modelo</Label>
            <Select value={formData.modelo} onValueChange={(value) => setFormData(prev => ({ ...prev, modelo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {modeloOptions.map(modelo => (
                  <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-sm font-medium">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as 'Nova' | 'Usada' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status e Valor Semanal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_semanal" className="text-sm font-medium">Valor Semanal (R$)</Label>
            <Input
              id="valor_semanal"
              type="number"
              step="0.01"
              placeholder="Ex: 245.00"
              value={formData.valor_semanal}
              onChange={(e) => setFormData(prev => ({ ...prev, valor_semanal: e.target.value }))}
              className="text-sm"
            />
          </div>
        </div>

        {/* Data Última Movimentação e Dias Parado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data_ultima_mov" className="text-sm font-medium">Data Última Movimentação</Label>
            <Input
              id="data_ultima_mov"
              type="date"
              value={formData.data_ultima_mov}
              onChange={(e) => setFormData(prev => ({ ...prev, data_ultima_mov: e.target.value }))}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias_parado" className="text-sm font-medium">Dias Parado</Label>
            <Input
              id="dias_parado"
              type="number"
              value={formData.dias_parado}
              onChange={(e) => setFormData(prev => ({ ...prev, dias_parado: e.target.value }))}
              className="text-sm"
              readOnly
            />
          </div>
        </div>

        {/* Franqueado Responsável */}
        <div className="space-y-2">
          <Label htmlFor="franchisee_id" className="text-sm font-medium">Franqueado Responsável</Label>
          <Select value={formData.franchisee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, franchisee_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o franqueado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum franqueado</SelectItem>
              {franchisees.map(franchisee => (
                <SelectItem key={franchisee.id} value={franchisee.id}>
                  {franchisee.franchisee_data?.[0]?.company_name ||
                   franchisee.franchisee_data?.[0]?.fantasy_name ||
                   franchisee.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CS (Código de Segurança) */}
        <div className="space-y-2">
          <Label htmlFor="codigo_cs" className="text-sm font-medium">CS (Código de Segurança)</Label>
          <Input
            id="codigo_cs"
            type="text"
            placeholder="Identificador do CS (Ex: Nome do Cliente)"
            value={formData.codigo_cs}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo_cs: e.target.value }))}
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          <span>✕</span> Cancelar
        </Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
          <span>💾</span> Salvar Moto
        </Button>
      </div>
    </form>
  );
}

export default function MotorcycleManagement() {
  const [filters, setFilters] = useState<MotorcyclePageFilters>({
    status: 'all',
    model: 'all',
    searchTerm: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(null);
  const [isDeleteAllAlertOpen, setIsDeleteAllAlertOpen] = useState(false);
  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const { appUser } = useAuth();

  // Redirecionar franqueados para seu dashboard específico
  if (appUser?.role === 'franchisee') {
    return <Navigate to="/franchisee-dashboard" replace />;
  }

  const fetchMotorcycles = useCallback(async () => {
    if (!appUser) {
      console.log('[MotorcycleManagement] Aguardando dados do usuário...');
      return;
    }

    setIsLoading(true);
    try {
      console.debug('[MotorcycleManagement] Carregando motos para usuário:', {
        role: appUser.role,
        city_id: appUser.city_id,
        user_id: appUser.id
      });

      // Verificar se o usuário está autenticado no Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[MotorcycleManagement] Erro de autenticação:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }

      if (!user) {
        throw new Error('Usuário não está autenticado no Supabase. Faça login novamente.');
      }

      console.log('[MotorcycleManagement] Usuário autenticado:', {
        id: user.id,
        email: user.email,
        appUserId: appUser.id
      });

      // Verificar se o ID do usuário autenticado corresponde ao appUser
      if (user.id !== appUser.id) {
        console.warn('[MotorcycleManagement] IDs não coincidem:', {
          authUserId: user.id,
          appUserId: appUser.id
        });
      }

      // Primeiro, vamos testar uma consulta simples para verificar a conexão
      console.log('[MotorcycleManagement] Testando conexão com Supabase...');

      try {
        const { data: testData, error: testError } = await supabase
          .from('motorcycles')
          .select('count', { count: 'exact', head: true });

        if (testError) {
          console.error('[MotorcycleManagement] Erro no teste de conexão:', testError);
          throw new Error(`Erro de conexão: ${testError.message}`);
        }

        console.log('[MotorcycleManagement] Conexão OK. Total de registros:', testData);
      } catch (testErr) {
        console.error('[MotorcycleManagement] Falha no teste de conexão:', testErr);
        throw testErr;
      }

      // Construir a query baseada no papel do usuário
      console.log('[MotorcycleManagement] Construindo query para usuário:', appUser.role);

      let query = supabase.from('motorcycles').select(`
        id,
        placa,
        modelo,
        status,
        tipo,
        valor_semanal,
        data_ultima_mov,
        codigo_cs,
        city_id,
        franchisee_id,
        created_at,
        updated_at,
        franchisee:app_users!motorcycles_franchisee_id_fkey(
          id,
          email,
          role,
          franchisee_data:franchisees!franchisees_user_id_fkey(
            company_name,
            fantasy_name
          )
        )
      `);

      // Aplicar filtros baseados no papel do usuário
      switch (appUser.role) {
        case 'admin':
        case 'master_br':
          // Admin e Master BR veem todas as motos
          console.log('[MotorcycleManagement] Usuário admin/master_br - carregando todas as motos');
          break;
        case 'regional':
          // Regional vê apenas motos da sua cidade
          if (appUser.city_id) {
            console.log('[MotorcycleManagement] Usuário regional - filtrando por cidade:', appUser.city_id);
            query = query.eq('city_id', appUser.city_id);
          } else {
            console.warn('[MotorcycleManagement] Usuário regional sem cidade - carregando todas as motos');
          }
          break;
        case 'franchisee':
          // Franqueado vê motos da sua cidade
          if (appUser.city_id) {
            console.log('[MotorcycleManagement] Usuário franqueado - filtrando por cidade:', appUser.city_id);
            query = query.eq('city_id', appUser.city_id);
          } else {
            console.warn('[MotorcycleManagement] Usuário franqueado sem cidade - carregando todas as motos');
          }
          break;
        default:
          // Filtrar por cidade se disponível
          if (appUser.city_id) {
            console.log('[MotorcycleManagement] Usuário padrão - filtrando por cidade:', appUser.city_id);
            query = query.eq('city_id', appUser.city_id);
          }
      }

      console.log('[MotorcycleManagement] Executando query...');
      const { data: motorcyclesData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[MotorcycleManagement] Erro na query:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Verificar se é um erro de RLS
        if (error.message?.includes('RLS') || error.message?.includes('policy') || error.code === 'PGRST116') {
          throw new Error('Sem permissão para acessar os dados. Verifique se você está logado corretamente e tem as permissões necessárias.');
        }

        throw error;
      }

      console.log('[MotorcycleManagement] Motos carregadas:', {
        count: motorcyclesData?.length || 0,
        sample: motorcyclesData?.slice(0, 2), // Mostrar apenas 2 para debug
        franchiseeData: motorcyclesData?.map(m => ({
          id: m.id,
          placa: m.placa,
          franchisee_id: m.franchisee_id,
          franchisee: m.franchisee
        })).slice(0, 3)
      });

      // Os dados já vêm com o JOIN correto
      setMotorcycles(motorcyclesData as any as Motorcycle[]);

      toast({
        title: "Dados Carregados",
        description: `Carregadas ${motorcyclesData?.length || 0} motocicletas da base de dados.`
      });

    } catch (err: any) {
      console.error('[MotorcycleManagement] Erro ao carregar motos:', err);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados",
        description: err.message || "Erro ao carregar dados das motocicletas. Verifique sua conexão e permissões."
      });
    } finally {
      setIsLoading(false);
    }
  }, [appUser, toast]);

  useEffect(() => {
    fetchMotorcycles();
  }, [fetchMotorcycles]);

  // Filtros são controlados diretamente no state

  const handleSaveMotorcycle = useCallback(async (motorcycleData: Motorcycle) => {
    const { id, ...dataToSave } = motorcycleData;
    
    try {
      console.log('[MotorcycleManagement] Salvando moto:', motorcycleData);
      
      if (editingMotorcycle && id) {
        // Atualizar moto existente
        const { data, error } = await supabase
          .from('motorcycles')
          .update({
            placa: motorcycleData.placa,
            modelo: motorcycleData.modelo,
            tipo: motorcycleData.tipo,
            status: motorcycleData.status,
            valor_semanal: motorcycleData.valor_semanal,
            data_ultima_mov: motorcycleData.data_ultima_mov,
            codigo_cs: motorcycleData.codigo_cs,
            franchisee_id: (motorcycleData.franchisee_id && motorcycleData.franchisee_id !== 'none' && motorcycleData.franchisee_id !== '') ? motorcycleData.franchisee_id : null,
            observacoes: motorcycleData.observacoes,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();

        if (error) {
          throw error;
        }

        // Recarregar os dados do banco para garantir que as informações do franqueado apareçam
        fetchMotorcycles();

        toast({
          title: "Moto Atualizada!",
          description: `A moto ${motorcycleData.placa} foi atualizada com sucesso.`,
        });
      } else {
        // Adicionar nova moto
        console.log('[MotorcycleManagement] appUser:', appUser);
        console.log('[MotorcycleManagement] city_id será:', motorcycleData.city_id || appUser?.city_id);
        
        // Garantir que o usuário está associado a uma cidade
        const cityId = motorcycleData.city_id || appUser?.city_id;
        if (!cityId) {
          throw new Error('Usuário deve estar associado a uma cidade para cadastrar motocicletas. Entre em contato com o administrador.');
        }
        
        const { data, error } = await supabase
          .from('motorcycles')
          .insert({
            placa: motorcycleData.placa,
            modelo: motorcycleData.modelo,
            tipo: motorcycleData.tipo || 'Usada',
            status: motorcycleData.status || 'active',
            valor_semanal: motorcycleData.valor_semanal,
            data_ultima_mov: motorcycleData.data_ultima_mov,
            codigo_cs: motorcycleData.codigo_cs,
            city_id: cityId,
            franchisee_id: (motorcycleData.franchisee_id && motorcycleData.franchisee_id !== 'none' && motorcycleData.franchisee_id !== '') ? motorcycleData.franchisee_id : null,
            observacoes: motorcycleData.observacoes,
            data_criacao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) {
          throw error;
        }

        console.log('[MotorcycleManagement] Moto inserida:', data);

        // Recarregar os dados do banco para garantir que as informações do franqueado apareçam
        fetchMotorcycles();

        toast({
          title: "Moto Adicionada!",
          description: `A moto ${motorcycleData.placa} foi adicionada com sucesso.`,
        });
      }
      
      setIsModalOpen(false);
      setEditingMotorcycle(null);
      
    } catch (error: any) {
      console.error("Erro ao salvar moto:", error);
      toast({
        title: "Erro ao Salvar",
        description: `Erro: ${error.message || 'Não foi possível salvar a moto.'}`,
        variant: "destructive",
      });
    }
  }, [toast, editingMotorcycle, appUser, fetchMotorcycles]);

  const handleOpenAddModal = useCallback(() => {
    // Verificar se o usuário tem uma cidade associada antes de abrir o modal
    if (!appUser?.city_id) {
      toast({
        title: "Erro de Permissão",
        description: "Usuário deve estar associado a uma cidade para cadastrar motocicletas. Entre em contato com o administrador.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingMotorcycle(null);
    setIsModalOpen(true);
  }, [appUser, toast]);

  const handleOpenEditModal = useCallback((motorcycle: Motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingMotorcycle(null);
  }, []);

  const handleUpdateMotorcycleStatus = useCallback(async (motorcycleId: string, newStatus: string) => {
    try {
      // Atualizar status da moto
      toast({
        title: "Status Atualizado!",
        description: `O status da moto foi atualizado para ${newStatus}.`,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao Atualizar Status",
        description: "Não foi possível atualizar o status da moto.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDeleteMotorcycle = useCallback(async (motorcycleId: string) => {
    try {
      console.log('[MotorcycleManagement] Tentando excluir moto com ID:', motorcycleId);
      
      const { data, error, count } = await supabase
        .from('motorcycles')
        .delete()
        .eq('id', motorcycleId)
        .select();

      console.log('[MotorcycleManagement] Resultado da exclusão:', { data, error, count });

      if (error) {
        console.error('[MotorcycleManagement] Erro do Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('[MotorcycleManagement] Nenhum registro foi excluído. Possível problema de RLS ou ID não encontrado.');
        toast({
          title: "Aviso",
          description: "Nenhum registro foi encontrado para exclusão.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar a lista local removendo a moto excluída
      setMotorcycles(prev => prev.filter(moto => moto.id !== motorcycleId));

      toast({
        title: "Moto Excluída!",
        description: `A moto foi excluída com sucesso.`,
      });
    } catch (error: any) {
      console.error("Erro ao excluir moto:", error);
      toast({
        title: "Erro ao Excluir",
        description: `Erro: ${error.message || 'Não foi possível excluir a moto.'}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleExportCSV = useCallback(() => {
    if (motorcycles.length === 0) {
      toast({
        title: "Nenhuma moto para exportar",
        description: "A lista de motocicletas está vazia.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "id", "placa", "modelo", "status", "data_ultima_mov", "city_id", "franchisee_id"
    ];

    const csvRows = [
      headers.join(','),
      ...motorcycles.map(moto => [
        moto.id,
        moto.placa,
        moto.modelo,
        moto.status,
        moto.data_ultima_mov || '',
        moto.city_id || '',
        moto.franchisee_id || ''
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "motos_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação Concluída",
      description: "Os dados das motocicletas foram exportados para motos_export.csv.",
    });
  }, [motorcycles, toast]);

  // Filtrar motos baseado nos filtros aplicados
  const filteredMotorcycles = motorcycles.filter(motorcycle => {
    const matchesStatus = filters.status === 'all' || motorcycle.status === filters.status;
    const matchesSearch = !filters.searchTerm || 
      motorcycle.placa.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      motorcycle.modelo.toLowerCase().includes(filters.searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pageActions = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExportCSV}>
        <Download className="mr-2 h-4 w-4" />
        Exportar CSV
      </Button>
      <Button onClick={handleOpenAddModal}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Nova Moto
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dados das motocicletas...</p>
            {appUser && (
              <p className="text-sm text-muted-foreground mt-2">
                Usuário: {appUser.email} ({appUser.role})
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Motos</h1>
            <p className="text-muted-foreground">
              Controle completo da frota - {filteredMotorcycles.length} motocicletas
            </p>
          </div>
        </div>
        {pageActions}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="active">Disponível</option>
                <option value="alugada">Alugada</option>
                <option value="relocada">Relocada</option>
                <option value="manutencao">Manutenção</option>
                <option value="recolhida">Recolhida</option>
                <option value="indisponivel_rastreador">Indisponível - Rastreador</option>
                <option value="indisponivel_emplacamento">Indisponível - Emplacamento</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Modelo</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.model}
                onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="Honda CG 160 Start">Honda CG 160 Start</option>
                <option value="Yamaha Factor 125">Yamaha Factor 125</option>
                <option value="Honda CG 160 Cargo">Honda CG 160 Cargo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Buscar por placa ou modelo..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Motos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Motocicletas ({filteredMotorcycles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">CS</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Placa</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Modelo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Franqueado</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Valor Semanal</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Últ. Movimento</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Ociosa (Dias)</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMotorcycles.map((motorcycle) => {
                  // Calcular dias ociosos
                  const lastMovement = motorcycle.data_ultima_mov ? new Date(motorcycle.data_ultima_mov) : null;
                  const today = new Date();
                  const daysSinceLastMovement = lastMovement ? 
                    Math.floor((today.getTime() - lastMovement.getTime()) / (1000 * 3600 * 24)) : 
                    null;

                  return (
                    <tr key={motorcycle.id} className="border-b hover:bg-muted/25">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{motorcycle.codigo_cs || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{motorcycle.placa}</td>
                      <td className="p-3 text-sm">{motorcycle.modelo}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                          motorcycle.status === 'active' ? 'bg-green-100 text-green-800' :
                          motorcycle.status === 'alugada' ? 'bg-blue-100 text-blue-800' :
                          motorcycle.status === 'relocada' ? 'bg-blue-100 text-blue-800' :
                          motorcycle.status === 'manutencao' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {motorcycle.status === 'active' ? 'Disponível' :
                           motorcycle.status === 'alugada' ? 'Alugada' :
                           motorcycle.status === 'relocada' ? 'Relocada' :
                           motorcycle.status === 'manutencao' ? 'Manutenção' :
                           motorcycle.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{motorcycle.tipo || 'Usada'}</td>
                      <td className="p-3 text-sm">
                        {motorcycle.franchisee?.franchisee_data?.[0]?.company_name ||
                         motorcycle.franchisee?.franchisee_data?.[0]?.fantasy_name ||
                         motorcycle.franchisee?.email || '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {motorcycle.valor_semanal ? 
                          `R$ ${motorcycle.valor_semanal.toFixed(2)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="p-3 text-sm">
                        {lastMovement ? 
                          lastMovement.toLocaleDateString('pt-BR') : 
                          'N/A'
                        }
                      </td>
                      <td className="p-3 text-sm">
                        {daysSinceLastMovement !== null ? daysSinceLastMovement : 'N/A'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(motorcycle)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMotorcycleId(motorcycle.id);
                              setIsDeleteAllAlertOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredMotorcycles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma motocicleta encontrada com os filtros aplicados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) handleCloseModal();
        else setIsModalOpen(true);
      }}>
        <DialogContent className="sm:max-w-[625px]">
          <MotorcycleForm 
            editingMotorcycle={editingMotorcycle}
            onSave={handleSaveMotorcycle}
            onCancel={handleCloseModal}
            appUser={appUser}
          />
        </DialogContent>
      </Dialog>

      {/* Alert de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteAllAlertOpen} onOpenChange={setIsDeleteAllAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta motocicleta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAllAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedMotorcycleId) {
                handleDeleteMotorcycle(selectedMotorcycleId);
              }
              setIsDeleteAllAlertOpen(false);
              setSelectedMotorcycleId(null);
            }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}