import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [selectedFranchisee, setSelectedFranchisee] = useState<any>(null);
  const { user, signUp, signIn } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro na autenticação",
          description: error.message
        });
      } else if (isSignUp) {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta."
        });
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao CRM."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFranchiseeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const cnpj = formData.get('cnpj') as string;
    const password = formData.get('password') as string;

    // Limpar e formatar CNPJ
    const cleanCnpj = cnpj.replace(/\D/g, '');
    console.log('CNPJ digitado:', cnpj);
    console.log('CNPJ limpo:', cleanCnpj);

    try {
      // Buscar franqueado pelo CNPJ (incluindo email se disponível)
      console.log('Buscando franqueado com CNPJ:', cleanCnpj);
      const { data: franchisee, error: franchiseeError } = await (supabase as any)
        .from('franchisees')
        .select('*, email')
        .eq('cnpj', cleanCnpj)
        .single();

      console.log('Resultado da busca:', { franchisee, franchiseeError });

      if (franchiseeError || !franchisee) {
        toast({
          variant: "destructive",
          title: "CNPJ não encontrado",
          description: "Verifique o CNPJ informado ou contate seu regional."
        });
        return;
      }

      // Verificar se tem usuário vinculado e email disponível
      console.log('Verificando user_id e email do franchisee:', { 
        user_id: franchisee.user_id, 
        email: franchisee.email 
      });
      
      if (franchisee.user_id && franchisee.email) {
        // Já tem usuário e email - fazer login direto
        console.log('Tentando login com email do franchisee:', franchisee.email);
        const { error } = await signIn(franchisee.email, password);
        
        if (error) {
          console.log('Erro no login:', error);
          toast({
            variant: "destructive",
            title: "Erro no login",
            description: "Senha incorreta. Verifique sua senha."
          });
        } else {
          toast({
            title: "Login realizado!",
            description: `Bem-vindo, ${franchisee.fantasy_name || franchisee.company_name}!`
          });
        }
      } else if (franchisee.user_id && !franchisee.email) {
        // Tem user_id mas não tem email na tabela - franqueado antigo
        // Orientar para usar login padrão
        toast({
          variant: "destructive", 
          title: "Use o login padrão",
          description: "Sua conta já existe. Use a primeira aba (login padrão) com seu email e senha."
        });
      } else {
        // Não tem usuário - redirecionar para cadastro de primeira senha
        console.log('Franqueado encontrado, redirecionando para primeira senha:', franchisee);
        setSelectedFranchisee(franchisee);
        setActiveTab('franchisee-setup');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFranchiseeSetup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Criar conta no Supabase Auth diretamente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (authError) {
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: authError.message
        });
        return;
      }

      if (authData.user) {
        // Aguardar um pouco para processar
        await new Promise(resolve => setTimeout(resolve, 500));

        // Criar registro em app_users com role franchisee
        const { error: userError } = await supabase
          .from('app_users')
          .insert({
            id: authData.user.id,
            email: email,
            role: 'franchisee',
            city_id: selectedFranchisee.city_id
          });

        if (userError) {
          console.error('Erro ao criar perfil:', userError);
          // Continuar mesmo com erro no perfil
        }

        // Atualizar franchisee com user_id e email
        console.log('Atualizando franchisee com user_id:', authData.user.id, 'e email:', email, 'para franchisee:', selectedFranchisee.id);
        const { data: updateData, error: updateError } = await (supabase as any)
          .from('franchisees')
          .update({ 
            user_id: authData.user.id,
            email: email
          })
          .eq('id', selectedFranchisee.id)
          .select();

        console.log('Resultado do update:', { updateData, updateError });

        if (updateError) {
          console.error('Erro ao atualizar franchisee:', updateError);
        }
      }

      if (!authError) {
        // Aguardar processamento e tentar login automático
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          // Tentar fazer login automaticamente
          const { error: loginError } = await signIn(email, password);
          
          if (loginError) {
            toast({
              title: "Conta criada!",
              description: "Confirme seu email e faça login com CNPJ + senha."
            });
            setActiveTab('franchisee');
          } else {
            toast({
              title: "Bem-vindo ao sistema!",
              description: `Conta criada e login realizado, ${selectedFranchisee.fantasy_name || selectedFranchisee.company_name}!`
            });
            // Será redirecionado automaticamente pelo useAuth
          }
        } catch (error) {
          toast({
            title: "Conta criada!",
            description: "Faça login com CNPJ + senha para acessar."
          });
          setActiveTab('franchisee');
        }
        
        setSelectedFranchisee(null);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Logo Section */}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="https://i.postimg.cc/tCTMJV3S/GO-removebg-preview-2.png" 
              alt="GO Logo" 
              className="w-16 h-16 mr-3"
            />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Master Salvador</h1>
              <p className="text-gray-500 text-sm">Gestão de Locação</p>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <img 
              src="https://locagora.com.br/wp-content/uploads/2023/09/locagora.png" 
              alt="Locagora" 
              className="w-24 h-8 object-contain"
            />
          </div>
        </div>

        <Card className="bg-white shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="p-6">
              {/* Signin Tab */}
              <TabsContent value="signin" className="mt-0">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso ao Sistema</h2>
                  <p className="text-gray-600">Entre com suas credenciais para acessar o painel</p>
                </div>

                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <path d="M3 4l7 5 7-5v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signin-password" className="text-gray-700 font-medium">Senha</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <path d="M1 10s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg mt-6"
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>

                <div className="text-center mt-6 space-y-3">
                  <p className="text-gray-600">
                    Não tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Criar conta
                    </button>
                  </p>
                  <div className="border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('franchisee')}
                      className="text-green-600 hover:underline font-medium flex items-center justify-center mx-auto"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      Acesso para Franqueados
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <div className="text-center mb-6">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-600">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h2>
                  <p className="text-gray-600">Preencha os dados para criar sua conta no sistema</p>
                </div>

                <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <path d="M3 4l7 5 7-5v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password" className="text-gray-700 font-medium">Senha</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg mt-6"
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {isLoading ? "Cadastrando..." : "Criar Conta"}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Já tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Fazer login
                    </button>
                  </p>
                </div>
              </TabsContent>

              {/* Franchisee Login Tab */}
              <TabsContent value="franchisee" className="mt-0">
                <div className="text-center mb-6">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-600">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Franqueado</h2>
                  <p className="text-gray-600">Entre com seu CNPJ cadastrado pelo regional</p>
                </div>

                <form onSubmit={handleFranchiseeSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="franchisee-cnpj" className="text-gray-700 font-medium">CNPJ</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <path d="M2 3h16a2 2 0 012 2v10a2 2 0 01-2 2H2a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M6 8h8M6 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <Input
                        id="franchisee-cnpj"
                        name="cnpj"
                        type="text"
                        placeholder="00.000.000/0001-00"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        maxLength={18}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="franchisee-password" className="text-gray-700 font-medium">Senha</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <Input
                        id="franchisee-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg mt-6"
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {isLoading ? "Verificando..." : "Entrar"}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Voltar para{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Login padrão
                    </button>
                  </p>
                </div>
              </TabsContent>

              {/* Franchisee Setup Tab */}
              <TabsContent value="franchisee-setup" className="mt-0">
                <div className="text-center mb-6">
                  <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-600">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Primeira Senha</h2>
                  <p className="text-gray-600">
                    CNPJ encontrado! Crie sua senha de acesso.
                  </p>
                  {selectedFranchisee && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        {selectedFranchisee.fantasy_name || selectedFranchisee.company_name}
                      </p>
                      <p className="text-xs text-green-600">
                        CNPJ: {selectedFranchisee.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                      </p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleFranchiseeSetup} className="space-y-4">
                  <div>
                    <Label htmlFor="setup-email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <path d="M3 4l7 5 7-5v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <Input
                        id="setup-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="setup-password" className="text-gray-700 font-medium">Senha</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                          <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <Input
                        id="setup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-12 bg-gray-50 border-gray-200"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg mt-6"
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Voltar para{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('franchisee');
                        setSelectedFranchisee(null);
                      }}
                      className="text-green-600 hover:underline font-medium"
                    >
                      Login por CNPJ
                    </button>
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <div className="flex items-center justify-center text-slate-600">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M10 16.5c-4.5 0-8-3.5-8-6.5s3.5-6.5 8-6.5 8 3.5 8 6.5-3.5 6.5-8 6.5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M10 7v3h2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
            Sistema de Gestão de Motocicletas
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Master Salvador - Todos os direitos reservados
          </p>
        </div>
      </div>

    </div>
  );
}