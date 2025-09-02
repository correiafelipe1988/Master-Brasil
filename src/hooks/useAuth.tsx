import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'master_br' | 'regional' | 'franchisee';
  city_id: string | null;
  city_name?: string;
  status: 'active' | 'blocked' | 'inactive';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refetchAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select(`
          *,
          cities:city_id (name)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching app user:', error);
        return;
      }

      if (data) {
        // Verificar se o usuário está bloqueado
        if ((data as any).status === 'blocked') {
          console.log('Usuário bloqueado, fazendo logout...');
          await signOut();
          return;
        }

        const appUserData = {
          id: data.id,
          email: data.email,
          role: data.role as 'admin' | 'master_br' | 'regional' | 'franchisee',
          city_id: data.city_id,
          city_name: (data.cities as any)?.name,
          status: (data as any).status as 'active' | 'blocked' | 'inactive'
        };

        setAppUser(appUserData);

        // Cache user data in localStorage for persistence
        try {
          localStorage.setItem('app_user', JSON.stringify(appUserData));
        } catch (e) {
          console.error('Error caching user data:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching app user:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer app user fetch to avoid auth state change deadlock
          setTimeout(() => {
            fetchAppUser(session.user.id);
          }, 0);
        } else {
          setAppUser(null);
        }

        setLoading(false);
      }
    );

    // Verificar status do usuário periodicamente (a cada 30 segundos)
    const statusCheckInterval = setInterval(() => {
      if (user && appUser) {
        fetchAppUser(user.id);
      }
    }, 30000);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchAppUser(session.user.id);
        }, 0);
      } else {
        // Fallback: try to get cached user data from localStorage
        try {
          const cachedUser = localStorage.getItem('app_user');
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            console.log('Using cached user data:', parsedUser);
            setAppUser(parsedUser);
          }
        } catch (e) {
          console.error('Error loading cached user:', e);
        }
      }
      
      setLoading(false);
    }).catch(error => {
      console.error('Error in getSession:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(statusCheckInterval);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/onboarding`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    // Clear cached user data
    try {
      localStorage.removeItem('app_user');
    } catch (e) {
      console.error('Error clearing user cache:', e);
    }
    
    await supabase.auth.signOut();
    setAppUser(null);
  };

  const refetchAppUser = async () => {
    if (user) {
      await fetchAppUser(user.id);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        appUser, 
        loading, 
        signUp, 
        signIn, 
        signOut, 
        refetchAppUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}