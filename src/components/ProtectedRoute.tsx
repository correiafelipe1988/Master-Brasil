import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'master_br' | 'regional' | 'franchisee' | Array<'admin' | 'master_br' | 'regional' | 'franchisee'>;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, appUser, loading } = useAuth();
  const location = useLocation();

  // Ainda carregando
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

  // Não está logado
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Não tem perfil no app_users (precisa fazer onboarding)
  if (!appUser) {
    return <Navigate to="/onboarding" replace />;
  }

  // Verifica role se necessário
  if (requireRole) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!allowedRoles.includes(appUser.role as any)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}