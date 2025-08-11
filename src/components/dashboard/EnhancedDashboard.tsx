import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserLicenseCard } from '@/components/dashboard/UserLicenseCard';
import { UserLicenseCardIOS } from '@/components/dashboard/UserLicenseCardIOS';
import { useIOSDetection } from '@/hooks/useIOSDetection';
import { LicenseStatus } from '@/components/dashboard/LicenseStatus';
import { LicenseStatusCard } from '@/components/license/LicenseStatusCard';
import { 
  Sparkles, 
  ShoppingBag, 
  CreditCard, 
  MessageCircle, 
  HeartCrack, 
  AlertTriangle, 
  Shield, 
  Search,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Activity,
  ChevronRight,
  Plus,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLicenseNotifications } from '@/hooks/useLicenseNotifications';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModernDashboardProps {
  onNavigateTo?: (view: string, budgetId?: string) => void;
  activeView?: string;
}

export const EnhancedDashboard = ({ onNavigateTo, activeView }: ModernDashboardProps) => {
  const { profile } = useAuth();
  const isIOS = useIOSDetection();
  useLicenseNotifications();

  const [budgets, setBudgets] = useState<Array<{
    id: string;
    client_name: string;
    created_at: string;
    total_price: number;
  }>>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Configurar atalhos de teclado
  const { getDefaultShortcuts } = useKeyboardShortcuts({
    shortcuts: [],
    isEnabled: true
  });

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!profile?.id) return;

      setBudgetsLoading(true);
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('id, client_name, created_at, total_price')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching recent budgets:', error);
          setBudgets([]);
        } else {
          setBudgets(data || []);
        }
      } catch (error) {
        console.error('Error fetching recent budgets:', error);
        setBudgets([]);
      } finally {
        setBudgetsLoading(false);
      }
    };

    fetchBudgets();
  }, [profile?.id]);

  // Animation variants for desktop
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div className="desktop-horizontal-layout">
        <div className="desktop-content-wrapper">
          <motion.div 
            className="desktop-page-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Enhanced Desktop Header */}
            <motion.div 
              className="desktop-section-header"
              variants={itemVariants}
            >
              <div className="desktop-dashboard-layout">
                <div className="desktop-dashboard-main">
                  <h1 className="desktop-section-title text-4xl font-bold">
                    Olá, {profile?.name || 'Usuário'}! 👋
                  </h1>
                  <p className="text-muted-foreground text-lg mt-2">
                    Painel de controle horizontal - Desktop Mode
                  </p>
                </div>
                <div className="desktop-dashboard-sidebar">
                  <Button
                    variant="outline"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="desktop-primary-button group"
                  >
                    <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Busca Rápida
                    <div className="ml-2 px-2 py-1 bg-muted rounded text-xs font-mono">
                      Ctrl+K
                    </div>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Stats Dashboard */}
            <motion.div 
              className="desktop-stats-grid"
              variants={itemVariants}
            >
              {/* Revenue Card */}
              <motion.div 
                className="desktop-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="desktop-card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Receita Total</h3>
                      <p className="text-3xl font-bold text-foreground">R$ 24.567,00</p>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    +12.5%
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Últimos 30 dias
                </div>
              </motion.div>

              {/* Clients Card */}
              <motion.div 
                className="desktop-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="desktop-card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Clientes Ativos</h3>
                      <p className="text-3xl font-bold text-foreground">147</p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    +8 novos
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Este mês
                </div>
              </motion.div>

              {/* Orders Card */}
              <motion.div 
                className="desktop-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="desktop-card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Orçamentos</h3>
                      <p className="text-3xl font-bold text-foreground">89</p>
                    </div>
                  </div>
                  <div className="text-sm text-purple-600 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    23 pendentes
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Últimos 7 dias
                </div>
              </motion.div>

              {/* Performance Card */}
              <motion.div 
                className="desktop-card group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="desktop-card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                      <Target className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Meta Mensal</h3>
                      <p className="text-3xl font-bold text-foreground">78%</p>
                    </div>
                  </div>
                  <div className="text-sm text-orange-600 flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    R$ 7.433 restantes
                  </div>
                </div>
                <div className="mt-4 w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </motion.div>
            </motion.div>

            {/* Main Dashboard Grid */}
            <motion.div 
              className="desktop-dashboard-layout"
              variants={itemVariants}
            >
              {/* Main Content Area */}
              <div className="desktop-dashboard-main space-y-6">
                {/* Recent Budgets Section */}
                <motion.div 
                  className="desktop-card"
                  variants={itemVariants}
                >
                  <div className="desktop-card-header">
                    <div>
                      <h3 className="text-xl font-semibold">Orçamentos Recentes</h3>
                      <p className="text-sm text-muted-foreground">Seus últimos orçamentos criados</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onNavigateTo?.('budgets')}
                      className="desktop-primary-button"
                    >
                      Ver Todos
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="desktop-card-content">
                    {budgetsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : budgets && budgets.length > 0 ? (
                      <div className="desktop-grid-3 gap-4">
                        {budgets.map((budget) => (
                          <motion.div 
                            key={budget.id}
                            className="desktop-card bg-muted/30 group cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onNavigateTo?.('budget-details', budget.id)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-sm">{budget.client_name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(budget.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-lg font-bold text-primary">
                              R$ {budget.total_price?.toLocaleString('pt-BR') || '0,00'}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Nenhum orçamento recente encontrado</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => onNavigateTo?.('new-budget')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Orçamento
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Analytics Section */}
                <motion.div 
                  className="desktop-flex-row"
                  variants={itemVariants}
                >
                  <div className="desktop-card flex-1">
                    <div className="desktop-card-header">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Análise de Vendas</h3>
                      </div>
                    </div>
                    <div className="desktop-card-content">
                      <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Gráfico de vendas em breve</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="desktop-card flex-1">
                    <div className="desktop-card-header">
                      <div className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Distribuição</h3>
                      </div>
                    </div>
                    <div className="desktop-card-content">
                      <div className="h-32 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Gráfico de distribuição em breve</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Sidebar Area */}
              <div className="desktop-dashboard-sidebar space-y-6">
                {/* License Status */}
                <motion.div variants={itemVariants}>
                  <LicenseStatusCard />
                </motion.div>

                {/* Quick Actions */}
                <motion.div 
                  className="desktop-card"
                  variants={itemVariants}
                >
                  <div className="desktop-card-header">
                    <h3 className="text-lg font-semibold">Ações Rápidas</h3>
                  </div>
                  <div className="desktop-card-content space-y-3">
                    <Button 
                      variant="default" 
                      className="w-full justify-start gap-3 desktop-primary-button"
                      onClick={() => onNavigateTo?.('new-budget')}
                    >
                      <Plus className="h-4 w-4" />
                      Novo Orçamento
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => onNavigateTo?.('clients')}
                    >
                      <Users className="h-4 w-4" />
                      Gerenciar Clientes
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => onNavigateTo?.('settings')}
                    >
                      <Shield className="h-4 w-4" />
                      Configurações
                    </Button>
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div 
                  className="desktop-card"
                  variants={itemVariants}
                >
                  <div className="desktop-card-header">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Atividade Recente</h3>
                    </div>
                  </div>
                  <div className="desktop-card-content space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Orçamento aprovado</p>
                        <p className="text-xs text-muted-foreground">há 2 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Novo cliente cadastrado</p>
                        <p className="text-xs text-muted-foreground">há 4 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Sistema atualizado</p>
                        <p className="text-xs text-muted-foreground">ontem</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};
