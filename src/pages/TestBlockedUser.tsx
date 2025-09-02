import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function TestBlockedUser() {
  const [email, setEmail] = useState('testesalvador@gmail.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Tentando login com usuário bloqueado...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message
        });
      } else {
        toast({
          title: "Login realizado",
          description: "Aguarde verificação de status..."
        });
        
        // Aguardar um pouco para ver se o sistema detecta o bloqueio
        setTimeout(() => {
          console.log('Verificando se usuário foi deslogado automaticamente...');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('email, status')
        .eq('email', email)
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não encontrado"
        });
      } else {
        toast({
          title: "Status do usuário",
          description: `${data.email}: ${data.status}`
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  const toggleUserStatus = async () => {
    try {
      // Primeiro verificar status atual
      const { data: currentData } = await supabase
        .from('app_users')
        .select('status')
        .eq('email', email)
        .single();

      const newStatus = currentData?.status === 'blocked' ? 'active' : 'blocked';

      const { error } = await supabase
        .from('app_users')
        .update({ status: newStatus })
        .eq('email', email);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message
        });
      } else {
        toast({
          title: "Status alterado",
          description: `Usuário agora está: ${newStatus}`
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Usuário Bloqueado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Button 
              onClick={testLogin} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testando...' : 'Testar Login'}
            </Button>
            
            <Button 
              onClick={checkUserStatus} 
              variant="outline"
              className="w-full"
            >
              Verificar Status
            </Button>
            
            <Button 
              onClick={toggleUserStatus} 
              variant="secondary"
              className="w-full"
            >
              Alternar Status (Bloquear/Desbloquear)
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Teste:</strong></p>
            <p>1. Verificar status atual</p>
            <p>2. Tentar fazer login com usuário bloqueado</p>
            <p>3. Verificar se é redirecionado ou deslogado</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
