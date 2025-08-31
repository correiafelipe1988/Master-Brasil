import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Building, 
  BarChart3, 
  Settings,
  LogOut,
  Store,
  LayoutGrid,
  Bike,
  TrendingUp,
  Radio,
  AlertTriangle,
  PiggyBank,
  BarChart2,
  Box,
  Wrench,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/contexts/DashboardContext';
import { useFleetData } from '@/hooks/useFleetData';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { appUser, signOut } = useAuth();
  const { dashboardData } = useDashboard();
  const { fleetStats } = useFleetData();
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
    { href: '/', icon: LayoutGrid, label: 'Dashboard', subtitle: 'Visão geral' },
    { href: '/motos', icon: Bike, label: 'Gestão de Motos', subtitle: 'Frota completa' },
    { href: '/vendas', icon: DollarSign, label: 'Venda de Motos', subtitle: 'Registro de vendas' },
    { href: '/projecao', icon: TrendingUp, label: 'Projeção de Crescimento', subtitle: 'Meta 1.000 motos' },
    { href: '/rastreadores', icon: Radio, label: 'Rastreadores', subtitle: 'Nossos rastreadores' },
    { href: '/distratos', icon: AlertTriangle, label: 'Distratos Locações', subtitle: 'Contratos encerrados' },
    { href: '/franchisees', icon: Store, label: 'Franqueados', subtitle: 'Análise por franqueado' },
    { href: '/financeiro', icon: PiggyBank, label: 'Financeiro', subtitle: 'Receitas e análises' },
    { href: '/ociosidade', icon: BarChart2, label: 'Previsão de Ociosidade', subtitle: 'IA para tempo ocioso' },
    { href: '/frota', icon: Box, label: 'Frota', subtitle: 'Análise de modelos' },
    { href: '/manutencao', icon: Wrench, label: 'Manutenção', subtitle: 'Gestão de manutenção' },
  ];

  const adminItems = [
    { href: '/admin', icon: BarChart3, label: 'Visão Geral' },
    { href: '/admin/cities', icon: Building, label: 'Cidades' },
    { href: '/admin/users', icon: Settings, label: 'Usuários' },
  ];

  const Navigation = () => (
    <nav className="space-y-1">
      <div className="px-3 py-2 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#99A1CB' }}>
          Navegação
        </h3>
      </div>
      
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
            style={{
              backgroundColor: isActive ? '#3649A5' : 'transparent',
              color: isActive ? 'white' : '#99A1CB',
              borderLeft: isActive ? '3px solid #596AC5' : '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#5463AA';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#99A1CB';
              }
            }}
            onClick={() => setIsOpen(false)}
          >
            <Icon 
              className="h-5 w-5 flex-shrink-0" 
              style={{ color: isActive ? 'white' : '#7984B8' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.label}</div>
              <div 
                className="text-xs truncate" 
                style={{ color: isActive ? '#E0E7FF' : '#99A1CB' }}
              >
                {item.subtitle}
              </div>
            </div>
          </Link>
        );
      })}

      {appUser?.role === 'admin' && (
        <>
          <div className="h-px my-6" style={{ backgroundColor: '#5463AA' }} />
          <div className="px-3 py-2 mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#99A1CB' }}>
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive ? '#3649A5' : 'transparent',
                  color: isActive ? 'white' : '#99A1CB',
                  borderLeft: isActive ? '3px solid #596AC5' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#5463AA';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#99A1CB';
                  }
                }}
                onClick={() => setIsOpen(false)}
              >
                <Icon 
                  className="h-5 w-5 flex-shrink-0" 
                  style={{ color: isActive ? 'white' : '#7984B8' }}
                />
                <div className="text-sm font-medium">{item.label}</div>
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Menu Button - Fixed Position */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-lg">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 overflow-hidden" style={{ backgroundColor: '#2C3D94' }}>
            <div className="h-full flex flex-col">
              <div className="p-6 flex-shrink-0">
                <div className="flex items-center gap-3 mb-8">
                <img 
                  src="https://i.postimg.cc/tCTMJV3S/GO-removebg-preview-2.png" 
                  alt="GO Logo" 
                  className="w-10 h-10"
                />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {appUser?.role === 'master_br' 
                      ? 'Master Brasil'
                      : appUser?.city_name 
                        ? `Master ${appUser.city_name}`
                        : 'Master Salvador'
                    }
                  </h2>
                  <p className="text-xs" style={{ color: '#99A1CB' }}>Gestão de Locação</p>
                </div>
                </div>
              </div>

              {/* Scrollable Navigation for Mobile */}
              <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-300">
                <Navigation />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar - Desktop - Full Height with Independent Scroll */}
      <aside className="hidden md:flex w-64 text-white h-screen flex-shrink-0" style={{ backgroundColor: '#2C3D94' }}>
        <div className="flex flex-col w-full h-full">
          {/* Header - Fixed */}
          <div className="p-6 flex-shrink-0">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="https://i.postimg.cc/tCTMJV3S/GO-removebg-preview-2.png" 
                alt="GO Logo" 
                className="w-10 h-10"
              />
              <div>
                <h2 className="text-lg font-bold">
                  {appUser?.role === 'master_br' 
                    ? 'Master Brasil'
                    : appUser?.city_name 
                      ? `Master ${appUser.city_name}`
                      : 'Master Salvador'
                  }
                </h2>
                <p className="text-xs" style={{ color: '#99A1CB' }}>Gestão de Locação</p>
              </div>
            </div>
          </div>

          {/* Scrollable Content - Independent Scroll */}
          <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-300">
            <Navigation />

            {/* Status Cards */}
            <div className="mt-6 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#99A1CB' }}>
                Status Rápido
              </h3>
              <div className="space-y-3">
                {/* Total de Motos */}
                <div className="bg-white rounded-lg p-3 text-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Box className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Total de Motos</p>
                        <p className="text-xs text-gray-500">Placas únicas</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold">{fleetStats?.total || dashboardData?.kpi?.total || '532'}</span>
                  </div>
                </div>

                {/* Disponíveis */}
                <div className="bg-green-50 rounded-lg p-3 text-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Disponíveis</p>
                        <p className="text-xs text-green-600">Motos prontas</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold">{fleetStats?.disponiveis || dashboardData?.monthData?.motosDisponiveis || '0'}</span>
                  </div>
                </div>

                {/* Alugadas */}
                <div className="bg-blue-50 rounded-lg p-3 text-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Bike className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Alugadas</p>
                        <p className="text-xs text-blue-600">Em uso</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold">{fleetStats?.alugadas || (dashboardData?.monthData?.motosAlugadas || 0) + (dashboardData?.monthData?.motosRelocadas || 0) || '0'}</span>
                  </div>
                </div>

                {/* Manutenção */}
                <div className="bg-purple-50 rounded-lg p-3 text-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Manutenção</p>
                        <p className="text-xs text-purple-600">Em oficina</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold">{fleetStats?.manutencao || dashboardData?.monthData?.emManutencao || '0'}</span>
                  </div>
                </div>

                {/* Recolhidas */}
                <div className="bg-orange-50 rounded-lg p-3 text-orange-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Recolhidas</p>
                        <p className="text-xs text-orange-600">Aguardando</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold">{fleetStats?.recolhidas || dashboardData?.monthData?.motosRecuperadas || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Info at Bottom - Fixed */}
          <div className="flex-shrink-0 p-6 pt-0">
            <div className="border-t pt-4" style={{ borderColor: '#5463AA' }}>
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg" style={{ backgroundColor: 'rgba(89, 106, 197, 0.15)' }}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: '#596AC5' }}>
                  {appUser?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{appUser?.email}</p>
                  <p className="text-xs truncate" style={{ color: '#99A1CB' }}>
                    {appUser?.role === 'admin' ? 'Administrador' : 
                     appUser?.role === 'master_br' ? 'Master Brasil' :
                     appUser?.role === 'regional' ? 'Regional' :
                     appUser?.role === 'franchisee' ? 'Franqueado' : 'Usuário'} 
                    {appUser?.city_name && ` • ${appUser.city_name}`}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  title="Sair"
                  className="flex-shrink-0 text-white hover:bg-slate-700 p-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Header - Independent Scroll */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Fixed at top */}
        <header className="bg-white border-b border-gray-200 shadow-sm h-16 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="md:hidden">
                {/* Mobile: Show current page or app name */}
                <h1 className="text-xl font-bold text-gray-900">Master Salvador</h1>
                <p className="text-xs text-gray-500">Gestão de Locação</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Logo Master Salvador - lado direito */}
              <img 
                src="https://i.postimg.cc/Qx6F2FNQ/logo.png" 
                alt="Master Salvador Logo" 
                className="h-12 w-auto"
              />
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {children}
        </main>
      </div>
    </div>
  );
}