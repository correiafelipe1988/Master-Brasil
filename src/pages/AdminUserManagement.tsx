import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield,
  ShieldOff,
  Key,
  Mail,
  Trash2,
  Edit,
  MoreHorizontal,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppUser {
  id: string;
  email: string;
  role: string;
  city_id: string | null;
  cities?: {
    name: string;
  } | null;
  created_at: string;
  status?: 'active' | 'blocked' | 'inactive';
}

interface City {
  id: string;
  name: string;
  slug: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const { appUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchCities();
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

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, slug')
        .order('name');

      if (error) {
        console.error('Erro ao buscar cidades:', error);
        throw error;
      }

      setCities(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar cidades:', error);
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

  // Novas funções de gestão de usuários
  const blockUser = async (userId: string) => {
    if (!confirm('Deseja realmente bloquear este usuário? Ele não conseguirá mais acessar o sistema.')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ status: 'blocked' })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao bloquear usuário:', error);
        throw error;
      }

      toast({
        title: "Usuário Bloqueado!",
        description: "O usuário foi bloqueado e não pode mais acessar o sistema."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao bloquear usuário."
      });
    }
  };

  const unblockUser = async (userId: string) => {
    if (!confirm('Deseja realmente desbloquear este usuário?')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao desbloquear usuário:', error);
        throw error;
      }

      toast({
        title: "Usuário Desbloqueado!",
        description: "O usuário foi desbloqueado e pode acessar o sistema novamente."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao desbloquear usuário."
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('ATENÇÃO: Esta ação é irreversível! Deseja realmente apagar este usuário permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Erro ao apagar usuário:', error);
        throw error;
      }

      toast({
        title: "Usuário Apagado!",
        description: "O usuário foi removido permanentemente do sistema."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao apagar usuário."
      });
    }
  };

  const resetPassword = async () => {
    if (!resetPasswordUser || !newPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário ou nova senha não informados."
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres."
      });
      return;
    }

    try {
      // Usar Admin API do Supabase para resetar senha
      const { error } = await supabase.auth.admin.updateUserById(
        resetPasswordUser.id,
        { password: newPassword }
      );

      if (error) {
        console.error('Erro ao resetar senha:', error);
        throw error;
      }

      toast({
        title: "Senha Resetada!",
        description: `Nova senha definida para ${resetPasswordUser.email}`
      });

      setIsResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao resetar senha."
      });
    }
  };

  const sendAccessEmail = async (userId: string, userEmail: string) => {
    if (!confirm(`Deseja enviar um email de acesso para ${userEmail}?`)) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Erro ao enviar email:', error);
        throw error;
      }

      toast({
        title: "Email Enviado!",
        description: `Email de redefinição de senha enviado para ${userEmail}`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao enviar email."
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          email: editingUser.email,
          role: editingUser.role,
          city_id: editingUser.city_id
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
      }

      toast({
        title: "Usuário Atualizado!",
        description: "As informações do usuário foram atualizadas com sucesso."
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário."
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'blocked':
        return <Badge variant="destructive">Bloqueado</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'active':
      default:
        return <Badge variant="default">Ativo</Badge>;
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
                  <TableHead>Status</TableHead>
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
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.role === 'admin' ? 'Todas as cidades' : user.cities?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        {/* Dropdown com ações principais */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Editar usuário */}
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingUser(user);
                                setIsEditDialogOpen(true);
                              }}
                              disabled={user.id === appUser?.id}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            {/* Reset de senha */}
                            <DropdownMenuItem
                              onClick={() => {
                                setResetPasswordUser(user);
                                setIsResetPasswordDialogOpen(true);
                              }}
                              disabled={user.id === appUser?.id}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Resetar Senha
                            </DropdownMenuItem>

                            {/* Enviar email de acesso */}
                            <DropdownMenuItem
                              onClick={() => sendAccessEmail(user.id, user.email)}
                              disabled={user.id === appUser?.id}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar Email de Acesso
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Bloquear/Desbloquear */}
                            {user.status === 'blocked' ? (
                              <DropdownMenuItem
                                onClick={() => unblockUser(user.id)}
                                disabled={user.id === appUser?.id}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Desbloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => blockUser(user.id)}
                                disabled={user.id === appUser?.id}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Bloquear
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Apagar usuário */}
                            <DropdownMenuItem
                              onClick={() => deleteUser(user.id)}
                              disabled={user.id === appUser?.id}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Botões de promoção/rebaixamento (mantidos para facilidade) */}
                        <div className="flex gap-1">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="franchisee">Franqueado</SelectItem>
                    <SelectItem value="master_br">Master BR</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Select
                  value={editingUser.city_id || 'none'}
                  onValueChange={(value) => setEditingUser({...editingUser, city_id: value === 'none' ? null : value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma cidade</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateUser}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para resetar senha */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
          </DialogHeader>
          {resetPasswordUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Definir nova senha para: <strong>{resetPasswordUser.email}</strong>
              </p>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsResetPasswordDialogOpen(false);
              setResetPasswordUser(null);
              setNewPassword('');
            }}>
              Cancelar
            </Button>
            <Button onClick={resetPassword}>
              Resetar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <li>• <strong>Novas ações</strong>: Editar, bloquear, resetar senha, enviar email, apagar usuário</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}