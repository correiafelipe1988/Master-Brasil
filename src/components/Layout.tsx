import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Users, 
  Building, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Settings,
  LogOut,
  Home,
  Store
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { appUser, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer logout."
      });
    }
  };

  const navItems = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/leads', icon: Users, label: 'Leads' },
    { href: '/deals', icon: DollarSign, label: 'Negócios' },
    { href: '/activities', icon: Activity, label: 'Atividades' },
  ];

  const adminItems = [
    { href: '/admin', icon: BarChart3, label: 'Visão Geral' },
    { href: '/admin/cities', icon: Building, label: 'Cidades' },
    { href: '/admin/users', icon: Settings, label: 'Usuários' },
  ];

  const regionalItems = [
    { href: '/franchisees', icon: Store, label: 'Franqueados' },
  ];

  const Navigation = () => (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            onClick={() => setIsOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      {appUser?.role === 'regional' && (
        <>
          <div className="h-px bg-border my-4" />
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Regional
            </h3>
          </div>
          {regionalItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </>
      )}

      {appUser?.role === 'franchisee' && (
        <>
          <div className="h-px bg-border my-4" />
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Franqueado
            </h3>
          </div>
          <div className="px-3 py-2 text-sm text-muted-foreground">
            <p>Seus dados e relatórios estarão aqui.</p>
          </div>
        </>
      )}

      {appUser?.role === 'admin' && (
        <>
          <div className="h-px bg-border my-4" />
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administração
            </h3>
          </div>
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-6">CRM Multi-Cidades</h2>
                  <Navigation />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-bold">CRM Multi-Cidades</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{appUser?.email}</p>
              <p className="text-xs text-muted-foreground">
                {appUser?.role === 'admin' ? 'Administrador' : 
                 appUser?.role === 'master_br' ? 'Master Brasil' :
                 appUser?.role === 'regional' ? 'Regional' :
                 appUser?.role === 'franchisee' ? 'Franqueado' : 'Usuário'} 
                {appUser?.city_name && ` • ${appUser.city_name}`}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 border-r border-border bg-card">
          <div className="p-6 w-full">
            <Navigation />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}