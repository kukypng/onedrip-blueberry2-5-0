import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { AdaptiveLayout } from '@/components/adaptive/AdaptiveLayout';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardLiteContent } from '@/components/lite/DashboardLiteContent';
import { DashboardLiteStatsEnhanced } from '@/components/lite/enhanced/DashboardLiteStatsEnhanced';
import { DashboardLiteQuickAccessEnhanced } from '@/components/lite/enhanced/DashboardLiteQuickAccessEnhanced';
import { DashboardLiteLicenseStatus } from '@/components/lite/DashboardLiteLicenseStatus';
import { DashboardLiteHelpSupport } from '@/components/lite/DashboardLiteHelpSupport';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

import { BudgetErrorBoundary, AuthErrorBoundary } from '@/components/ErrorBoundaries';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { useBudgetData } from '@/hooks/useBudgetData';
import { PageTransition } from '@/components/ui/animations/page-transitions';
import { IOSSpinner } from '@/components/ui/animations/loading-states';

export const DashboardLite = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { profile, user, hasPermission } = useAuth();
  const { isDesktop } = useResponsive();
  
  // Memoização da verificação de iOS para evitar recálculos
  const isiOSDevice = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }, []);

  // Aguardar user e profile estarem disponíveis
  const isReady = useMemo(() => Boolean(user?.id && profile), [user?.id, profile]);

  // Hook para gerenciar dados dos orçamentos
  const { budgets, loading, error, refreshing, handleRefresh } = useBudgetData(user?.id || '');

  // Real-time subscription otimizada
  useEffect(() => {
    if (!isReady || !user?.id) return;

    // Subscription para atualizações em tempo real
    let subscription: any = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const setupSubscription = () => {
      subscription = supabase.channel('budget_changes_lite').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'budgets',
        filter: `owner_id=eq.${user.id}`
      }, payload => {
        console.log('Budget change detected:', payload);
        
        // Clear previous timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        // Debounce para evitar múltiplas chamadas
        debounceTimer = setTimeout(() => {
          handleRefresh();
          debounceTimer = null;
        }, 500);
      }).subscribe();
    };
    setupSubscription();
    
    return () => {
      // Clear debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Remove subscription properly
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isReady, user?.id, handleRefresh]);

  // Otimização para iOS: não renderizar nada até dados estarem prontos
  if (!isReady) {
    return (
      <div 
        className="h-[100dvh] bg-background flex items-center justify-center" 
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none'
        }}
      >
        <div className="text-center space-y-4">
          <IOSSpinner size="lg" />
          <p className="text-sm text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Memoização do conteúdo principal para evitar re-renders desnecessários
  const dashboardContent = useMemo(() => (
    <PageTransition type="fadeScale">
      <div className={`${isDesktop ? 'pt-20 desktop-dashboard-layout' : 'p-4 space-y-6'}`}>
        {isDesktop ? (
          // Layout desktop moderno com espaçamento para navigation fixa
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
            <DashboardLiteContent 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              stats={{ budgets, loading, error }}
            />
          </div>
        ) : (
          // Layout mobile/tablet original
          <>
            <DashboardLiteStatsEnhanced budgets={budgets} loading={loading} />
            <DashboardLiteQuickAccessEnhanced 
              onTabChange={setActiveTab}
              activeTab={activeTab}
              quickStats={{ total: budgets.length, pending: budgets.filter(b => b.status === 'pending').length }}
            />
            <DashboardLiteLicenseStatus />
            <DashboardLiteHelpSupport />
          </>
        )}
      </div>
    </PageTransition>
  ), [activeTab, budgets, loading, error, isDesktop]);

  return (
    <AuthGuard>
      <BudgetErrorBoundary>
        <AuthErrorBoundary>
          <LayoutProvider>
            <div className={cn(
              "h-[100dvh] bg-background",
              isDesktop && "desktop-layout"
            )}>
              {/* Navegação aprimorada */}
              <AppSidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
              />
              
              {/* Conteúdo principal */}
              <main className={cn(
                "flex-1 overflow-auto",
                isDesktop && "ml-0" // Sem margin pois nav é fixa no topo
              )}>
                {dashboardContent}
              </main>
            </div>
          </LayoutProvider>
        </AuthErrorBoundary>
      </BudgetErrorBoundary>
    </AuthGuard>
  );
};
