import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function TestCities() {
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      console.log('=== DEBUG: Buscando cidades ===');
      
      // Debug do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuário atual:', user);
      
      // Debug do JWT
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sessão atual:', session);

      // Buscar cidades
      const { data, error, count } = await supabase
        .from('cities')
        .select('*', { count: 'exact' })
        .order('name');

      console.log('Resultado da busca cidades:', { 
        data, 
        error, 
        count,
        dataLength: data?.length 
      });
      
      if (error) {
        console.error('Erro detalhado:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      setCities(data || []);
      toast({
        title: "Sucesso",
        description: `${data?.length || 0} cidades encontradas (count: ${count}).`
      });
    } catch (error: any) {
      console.error('Erro capturado:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao carregar cidades."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixRLS = async () => {
    try {
      setIsLoading(true);
      console.log('Tentativa de corrigir RLS...');
      
      toast({
        variant: "destructive",
        title: "Manual Required",
        description: "Execute o SQL do arquivo 'fix_cities_rls.sql' no painel do Supabase para corrigir o RLS."
      });

    } catch (error: any) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const insertCities = async () => {
    try {
      setIsLoading(true);
      console.log('Inserindo cidades...');
      
      const citiesToInsert = [
        { slug: 'salvador', name: 'Salvador' },
        { slug: 'rio-de-janeiro', name: 'Rio de Janeiro' },
        { slug: 'sao-paulo', name: 'São Paulo' },
        { slug: 'brasilia', name: 'Brasília' },
        { slug: 'belo-horizonte', name: 'Belo Horizonte' },
        { slug: 'fortaleza', name: 'Fortaleza' }
      ];

      const { data, error } = await supabase
        .from('cities')
        .upsert(citiesToInsert, { onConflict: 'slug' })
        .select();

      console.log('Resultado da inserção:', { data, error });

      if (error) {
        console.error('Erro ao inserir cidades:', error);
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: `${data?.length || 0} cidades inseridas.`
      });

      await fetchCities();
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao inserir cidades."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste - Cidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={fetchCities} disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Buscar Cidades'}
            </Button>
            <Button onClick={insertCities} disabled={isLoading} variant="outline">
              Inserir Cidades de Teste
            </Button>
            <Button onClick={fixRLS} disabled={isLoading} variant="secondary">
              Corrigir RLS
            </Button>
          </div>

          <div>
            <h3 className="font-medium mb-2">Cidades encontradas ({cities.length}):</h3>
            <div className="space-y-2">
              {cities.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma cidade encontrada.</p>
              ) : (
                cities.map((city) => (
                  <div key={city.id} className="p-2 border rounded">
                    <strong>{city.name}</strong> - {city.slug} (ID: {city.id})
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}