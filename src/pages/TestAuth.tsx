import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuth() {
  const [authState, setAuthState] = useState<any>(null);
  const [motorcycles, setMotorcycles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { appUser, user } = useAuth();

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      setAuthState({ user, error });
      console.log('Auth check:', { user, error });
    } catch (err) {
      console.error('Auth check error:', err);
      setAuthState({ error: err });
    }
  };

  const testMotorcyclesQuery = async () => {
    try {
      setError(null);
      console.log('Testing motorcycles query...');
      
      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .limit(5);
      
      console.log('Motorcycles query result:', { data, error });
      
      if (error) {
        setError(error.message);
      } else {
        setMotorcycles(data || []);
      }
    } catch (err: any) {
      console.error('Motorcycles query error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Teste de Autenticação</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Estado da Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>useAuth - User:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>useAuth - AppUser:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(appUser, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Supabase Auth State:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
          
          <Button onClick={checkAuth}>
            Verificar Autenticação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Query Motorcycles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testMotorcyclesQuery}>
            Testar Query Motorcycles
          </Button>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Erro:</strong> {error}
            </div>
          )}
          
          <div>
            <strong>Resultados ({motorcycles.length}):</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm max-h-64 overflow-y-auto">
              {JSON.stringify(motorcycles, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
