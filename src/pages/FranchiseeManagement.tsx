import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Franchisee {
  id: string;
  cnpj: string;
  company_name: string;
  fantasy_name: string;
  city_id: string;
  status: string;
  cities?: {
    name: string;
  };
  app_users?: {
    email: string;
  };
  created_at: string;
}

interface City {
  id: string;
  name: string;
}

export default function FranchiseeManagement() {
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { appUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchFranchisees();
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar cidades:', error);
    }
  };

  const fetchFranchisees = async () => {
    try {
      setIsLoading(true);
      
      let query = (supabase as any)
        .from('franchisees')
        .select(`
          *,
          cities:city_id (name),
          app_users:user_id (email)
        `)
        .order('created_at', { ascending: false });

      // Se for regional, filtrar por cidade
      if (appUser?.role === 'regional' && appUser.city_id) {
        query = query.eq('city_id', appUser.city_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFranchisees(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar franqueados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao carregar franqueados."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const franchiseeData = {
      cnpj: (formData.get('cnpj') as string).replace(/\D/g, ''),
      company_name: formData.get('company_name') as string,
      fantasy_name: formData.get('fantasy_name') as string,
      city_id: formData.get('city_id') as string,
    };

    try {
      const { error } = await (supabase as any)
        .from('franchisees')
        .insert(franchiseeData);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Franqueado cadastrado com sucesso."
      });

      setIsDialogOpen(false);
      fetchFranchisees();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao cadastrar franqueado."
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Franqueados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cadastre e gerencie franqueados da sua região
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Cadastrar Franqueado</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Franqueado</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      placeholder="00.000.000/0001-00"
                      maxLength={18}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Razão Social</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                    <Input
                      id="fantasy_name"
                      name="fantasy_name"
                      placeholder="Nome fantasia (opcional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city_id">Cidade</Label>
                    <Select name="city_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Cadastrar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando franqueados...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário Vinculado</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {franchisees.map((franchisee) => (
                  <TableRow key={franchisee.id}>
                    <TableCell className="font-mono text-sm">
                      {formatCNPJ(franchisee.cnpj)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {franchisee.company_name}
                    </TableCell>
                    <TableCell>
                      {franchisee.fantasy_name || '-'}
                    </TableCell>
                    <TableCell>
                      {franchisee.cities?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(franchisee.status)}
                    </TableCell>
                    <TableCell>
                      {franchisee.app_users?.email ? (
                        <Badge variant="outline">Vinculado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(franchisee.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-medium">Como funciona:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Cadastre franqueados informando CNPJ e dados da empresa</li>
              <li>• O franqueado acessa o sistema pelo botão "Acesso para Franqueados"</li>
              <li>• No primeiro acesso, ele criará sua senha usando o CNPJ</li>
              <li>• Após isso, poderá fazer login normalmente com CNPJ + senha</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}