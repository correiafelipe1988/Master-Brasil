import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import TestCities from "./pages/TestCities";
import TestAuth from "./pages/TestAuth";
import AdminUserManagement from "./pages/AdminUserManagement";
import FranchiseeManagement from "./pages/FranchiseeManagement";
import FranchiseeDashboard from "./pages/FranchiseeDashboard";
import FranchiseeReports from "./pages/FranchiseeReports";
import Deals from "./pages/Deals";
import MotorcycleManagement from "./pages/MotorcycleManagement";
import ClientManagement from "./pages/ClientManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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

            <Route path="/clientes" element={
              <ProtectedRoute requireRole="regional">
                <Layout>
                  <ClientManagement />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireRole="admin">
                <Layout>
                  <div>Admin Overview (Em construção)</div>
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/cities" element={
              <ProtectedRoute requireRole="admin">
                <Layout>
                  <div>Cities Management (Em construção)</div>
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
