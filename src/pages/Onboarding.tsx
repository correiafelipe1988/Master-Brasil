import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface City {
  id: string;
  name: string;
  slug: string;
}

export default function Onboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const { user, appUser, refetchAppUser, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, slug')
        .order('name');

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as cidades."
        });
      } else {
        setCities(data || []);
      }
    };

    fetchCities();
  }, [toast]);

  // Se não estiver logado, vai para auth
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Se já tem app_user, pula onboarding
  if (!loading && appUser) {
    return <Navigate to="/" replace />;
  }

  // Se ainda está carregando
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    if (!selectedCityId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione uma cidade."
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('app_users')
        .upsert({
          id: user!.id,
          email: user!.email!,
          role: 'city_user',
          city_id: selectedCityId
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível completar o perfil."
        });
      } else {
        await refetchAppUser();
        toast({
          title: "Perfil completo!",
          description: "Bem-vindo ao CRM."
        });
        navigate('/', { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete seu Perfil</CardTitle>
          <CardDescription>
            Selecione a cidade em que você trabalha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Select value={selectedCityId} onValueChange={setSelectedCityId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua cidade" />
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

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Seu papel:</h3>
            <p className="text-sm text-muted-foreground">
              <strong>Operador da cidade</strong> - Você poderá gerenciar leads, negócios e atividades da sua cidade.
            </p>
          </div>

          <Button 
            onClick={handleComplete} 
            className="w-full" 
            disabled={isLoading || !selectedCityId}
          >
            {isLoading ? "Concluindo..." : "Concluir"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}