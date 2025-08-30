import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AppUser {
  id: string;
  email: string;
  role: string;
  city_id: string | null;
  cities?: {
    name: string;
  } | null;
  created_at: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { appUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Buscando usuários...');
      
      const { data, error } = await supabase
        .from('app_users')
        .select(`
          *,
          cities:city_id (name)
        `)
        .order('created_at', { ascending: false });

      console.log('Usuários encontrados:', { data, error });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao carregar usuários."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    if (!confirm('Deseja realmente promover este usuário para Admin?')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ 
          role: 'admin', 
          city_id: null 
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao promover usuário:', error);
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Usuário promovido para Admin."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao promover usuário."
      });
    }
  };

  const promoteToMasterBr = async (userId: string) => {
    if (!confirm('Deseja realmente promover este usuário para Master BR (acesso global read-only)?')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ 
          role: 'master_br', 
          city_id: null 
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao promover usuário:', error);
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Usuário promovido para Master BR."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao promover usuário."
      });
    }
  };

  const demoteToUser = async (userId: string, cityId: string) => {
    if (!confirm('Deseja remover privilégios de Admin deste usuário?')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ 
          role: 'regional', 
          city_id: cityId 
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Usuário rebaixado para Regional."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao rebaixar usuário."
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'master_br':
        return <Badge variant="default">Master BR</Badge>;
      case 'regional':
        return <Badge variant="secondary">Regional</Badge>;
      case 'franchisee':
        return <Badge variant="outline">Franqueado</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários - Admin</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários e promova para administrador
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando usuários...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.role === 'admin' ? 'Todas as cidades' : user.cities?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {user.role === 'regional' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => promoteToMasterBr(user.id)}
                              disabled={user.id === appUser?.id}
                              className="text-xs"
                            >
                              → Master BR
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => promoteToAdmin(user.id)}
                              disabled={user.id === appUser?.id}
                              className="text-xs"
                            >
                              → Admin
                            </Button>
                          </>
                        )}
                        
                        {user.role === 'master_br' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => promoteToAdmin(user.id)}
                              disabled={user.id === appUser?.id}
                              className="text-xs"
                            >
                              → Admin
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => demoteToUser(user.id, user.city_id || '')}
                              disabled={user.id === appUser?.id}
                              className="text-xs"
                            >
                              → Regional
                            </Button>
                          </>
                        )}
                        
                        {user.role === 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => demoteToUser(user.id, user.city_id || '')}
                            disabled={user.id === appUser?.id}
                            className="text-xs"
                          >
                            → Regional
                          </Button>
                        )}
                        
                        {user.role === 'franchisee' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => demoteToUser(user.id, user.city_id || '')}
                            disabled={user.id === appUser?.id}
                            className="text-xs"
                          >
                            → Regional
                          </Button>
                        )}
                      </div>
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
            <h3 className="font-medium">Informações:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Admin</strong>: Acesso total - gerencia tudo</li>
              <li>• <strong>Master BR</strong>: Visualização global - apenas leitura</li>
              <li>• <strong>Regional</strong>: Gerencia cidades designadas e franqueados</li>
              <li>• <strong>Franqueado</strong>: Acesso aos próprios dados (por CNPJ)</li>
              <li>• Você não pode alterar seu próprio role</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}