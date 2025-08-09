import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AcceptTermsModal, useTermsAcceptance } from "@/components/AcceptTermsModal";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SignPage } from "./pages/SignPage";
import { PlansPage } from "./plans/PlansPage";
import { PurchaseSuccessPage } from "./pages/PurchaseSuccessPage";
import { DashboardLite } from "./pages/DashboardLite";
import { CookiePage } from "./pages/CookiePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { CookiesPage } from "./pages/CookiesPage";
import { IOSRedirectHandler } from "./components/IOSRedirectHandler";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/ThemeProvider";
import SecurityHeaders from "@/components/security/SecurityHeaders";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ResetEmailPage } from "./pages/ResetEmailPage";
import { VerifyPage } from "./pages/VerifyPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { ServiceOrdersPage } from "./pages/ServiceOrdersPage";
import { ServiceOrderFormPage } from "./pages/ServiceOrderFormPage";
import { ServiceOrderDetailsPage } from "./pages/ServiceOrderDetailsPage";
import { ServiceOrderTrashPage } from "./pages/ServiceOrderTrashPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { LicensePage } from "./pages/LicensePage";
import { PWAProvider } from "./components/PWAProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: true,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { needsAcceptance, isLoading: termsLoading, markAsAccepted } = useTermsAcceptance();
  const location = useLocation();

  const handleAcceptTerms = () => {
    markAsAccepted();
  };

  const handleDeclineTerms = () => {
    // Redirecionar para página inicial ou mostrar mensagem
    window.location.href = '/';
  };

  // Mostrar loading enquanto carrega autenticação ou termos
  if (authLoading || termsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Páginas onde o modal NÃO deve aparecer
  const excludedPages = ['/terms', '/privacy', '/cookies'];
  const isExcludedPage = excludedPages.includes(location.pathname);

  // Só mostrar o modal se:
  // - O usuário estiver logado
  // - Precisar aceitar os termos
  // - NÃO estiver em uma página excluída
  const shouldShowModal = user && needsAcceptance && !isExcludedPage;

  return (
    <>
      <SecurityHeaders />
      <Toaster />
      <Sonner
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
      <IOSRedirectHandler />
      
      {/* Modal de aceitação de termos - apenas para usuários logados */}
      <AcceptTermsModal
        isOpen={shouldShowModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/licenca" element={<LicensePage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/purchase-success" element={<PurchaseSuccessPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route
          path="/reset-email"
          element={
            <ProtectedRoute>
              <ResetEmailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signup"
          element={<SignUpPage />}
        />
        <Route
          path="/sign"
          element={<SignPage />}
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLite />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/painel" 
          element={
            <ProtectedRoute>
              <DashboardLite />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/budgets" 
          element={
            <ProtectedRoute>
              <BudgetsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/service-orders" 
          element={
            <ProtectedRoute>
              <ServiceOrdersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/service-orders/new" 
          element={
            <ProtectedRoute>
              <ServiceOrderFormPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/service-orders/:id/edit" 
          element={
            <ProtectedRoute>
              <ServiceOrderFormPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/service-orders/:id" 
          element={
            <ProtectedRoute>
              <ServiceOrderDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/service-orders-trash" 
          element={
            <ProtectedRoute>
              <ServiceOrderTrashPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/cookie" element={<CookiePage />} />
        
        {/* Novas rotas para políticas e termos */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <PWAProvider>
                <AppContent />
              </PWAProvider>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;