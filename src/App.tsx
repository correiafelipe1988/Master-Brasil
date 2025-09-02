import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import FaviconGenerator from "@/components/FaviconGenerator";

import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import TestCities from "./pages/TestCities";
import TestAuth from "./pages/TestAuth";
import TestBlockedUser from "./pages/TestBlockedUser";
import AdminUserManagement from "./pages/AdminUserManagement";
import FranchiseeManagement from "./pages/FranchiseeManagement";
import FranchiseeDashboard from "./pages/FranchiseeDashboard";
import FranchiseeReports from "./pages/FranchiseeReports";
import Deals from "./pages/Deals";
import MotorcycleManagement from "./pages/MotorcycleManagement";
import VendaMotos from "./pages/VendaMotos";
import ClientManagement from "./pages/ClientManagement";
import Locacoes from "./pages/Locacoes";
import ProjecaoCrescimento from "./pages/ProjecaoCrescimento";
import Rastreadores from "./pages/Rastreadores";
import DistratosLocacoes from "./pages/DistratosLocacoes";
import Financeiro from "./pages/Financeiro";
import PrevisaoOciosidade from "./pages/PrevisaoOciosidade";
import Frota from "./pages/Frota";
import Manutencao from "./pages/Manutencao";
import AdminOverview from "./pages/AdminOverview";
import CitiesManagement from "./pages/CitiesManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FaviconGenerator />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DashboardProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/test-cities" element={<TestCities />} />
            <Route path="/test-auth" element={<TestAuth />} />
            <Route path="/test-blocked-user" element={<TestBlockedUser />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/franchisee-dashboard" element={
              <ProtectedRoute requireRole="franchisee">
                <Layout>
                  <FranchiseeDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/franchisee-reports" element={
              <ProtectedRoute requireRole="franchisee">
                <Layout>
                  <FranchiseeReports />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/leads" element={
              <ProtectedRoute>
                <Layout>
                  <Leads />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/deals" element={
              <ProtectedRoute>
                <Layout>
                  <Deals />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/activities" element={
              <ProtectedRoute>
                <Layout>
                  <div>Activities (Em construção)</div>
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/motos" element={
              <ProtectedRoute>
                <Layout>
                  <MotorcycleManagement />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/vendas" element={
              <ProtectedRoute requireRole={["admin", "master_br", "regional"]}>
                <Layout>
                  <VendaMotos />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/clientes" element={
              <ProtectedRoute requireRole="regional">
                <Layout>
                  <ClientManagement />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/locacoes" element={
              <ProtectedRoute>
                <Layout>
                  <Locacoes />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/projecao" element={
              <ProtectedRoute>
                <Layout>
                  <ProjecaoCrescimento />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/rastreadores" element={
              <ProtectedRoute>
                <Layout>
                  <Rastreadores />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/distratos" element={
              <ProtectedRoute>
                <Layout>
                  <DistratosLocacoes />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/financeiro" element={
              <ProtectedRoute>
                <Layout>
                  <Financeiro />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/ociosidade" element={
              <ProtectedRoute>
                <Layout>
                  <PrevisaoOciosidade />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/frota" element={
              <ProtectedRoute>
                <Layout>
                  <Frota />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/manutencao" element={
              <ProtectedRoute>
                <Layout>
                  <Manutencao />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireRole="admin">
                <Layout>
                  <AdminOverview />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/cities" element={
              <ProtectedRoute requireRole="admin">
                <Layout>
                  <CitiesManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute requireRole="admin">
                <Layout>
                  <AdminUserManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/franchisees" element={
              <ProtectedRoute requireRole={["admin", "master_br", "regional", "franchisee"]}>
                <Layout>
                  <FranchiseeManagement />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin-temp" element={
              <AdminUserManagement />
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
