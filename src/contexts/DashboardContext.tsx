import { createContext, useContext, useState, ReactNode } from 'react';

export interface DashboardData {
  todayData: {
    motosAlugadasHoje: number;
    motosRelocadasHoje: number;
    motosDisponiveisHoje: number;
    motosRecuperadasHoje: number;
    motosEmManutencao: number;
  };
  monthData: {
    motosAlugadas: number;
    motosRelocadas: number;
    motosDisponiveis: number;
    motosRecuperadas: number;
    emManutencao: number;
  };
  kpi: {
    total: string;
    locacoes: string;
  };
  statusDistribution: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  baseGrowth: Array<{
    month: string;
    cumulativeCount: number;
  }>;
  monthlyRentals: any[];
  dailyRentals?: any[];
}

interface DashboardContextType {
  dashboardData: DashboardData | null;
  setDashboardData: (data: DashboardData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <DashboardContext.Provider 
      value={{ 
        dashboardData, 
        setDashboardData, 
        isLoading, 
        setIsLoading 
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
