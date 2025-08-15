import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { Home, FileText, Settings, Plus, LogOut, User, Star, Users, Database, UserCheck } from 'lucide-react';
import { DesktopNavigation } from './DesktopNavigation';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AppSidebar = ({
  activeTab,
  onTabChange
}: AppSidebarProps) => {
  const {
    signOut,
    user,
    profile,
    hasRole
  } = useAuth();
  const {
    state
  } = useSidebar();
  const {
    isDesktop
  } = useResponsive();

  // Se for desktop, usar a navegação horizontal moderna
  if (isDesktop) {
    return (
      <DesktopNavigation 
        activeTab={activeTab}
        onTabChange={onTabChange}
        className="fixed top-0 left-0 right-0 z-50"
      />
    );
  }

  // Navegação mobile/tablet (sidebar tradicional)
  const navigationItems = [{
    id: 'dashboard',
    label: 'Menu',
    icon: Home,
    permission: true
  }, {
    id: 'budgets',
    label: 'Orçamentos',
    icon: FileText,
    permission: true
  }, {
    id: 'new-budget',
    label: 'Novo Orçamento',
    icon: Plus,
    permission: true
  }, {
    id: 'clients',
    label: 'Clientes',
    icon: UserCheck,
    permission: true
  }, {
    id: 'data-management',
    label: 'Gestão de Dados',
    icon: Database,
    permission: true
  }, {
    id: 'admin',
    label: 'Administração',
    icon: Users,
    permission: hasRole('admin')
  }, {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    permission: true
  }];

  return (
    <Sidebar 
      className={cn(
        "border-r border-border dark:border-white/5",
        "transition-all duration-300 ease-in-out",
        "h-screen flex flex-col"
      )} 
      collapsible="icon"
    >
      {/* Header com animação */}
      {state === "expanded" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <SidebarHeader className="p-4 h-20 flex items-center">
            <div className="flex items-center space-x-4 w-full">
              <motion.div 
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <p className="text-base font-semibold text-foreground truncate">
                  {profile?.name || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </motion.div>
            </div>
          </SidebarHeader>
        </motion.div>
      )}
      
      {state === "expanded" && <SidebarSeparator />}
      
      {/* Conteúdo da navegação */}
      <SidebarContent className="p-3">
        <SidebarMenu className="flex flex-col gap-2">
          {navigationItems.map((item, index) => {
            if (!item.permission) return null;
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <SidebarMenuItem className="p-1">
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    className={cn(
                      "h-12 text-base font-medium rounded-lg transition-all duration-200 ease-in-out w-full",
                      activeTab === item.id && "bg-primary text-primary-foreground shadow-md"
                    )}
                    tooltip={item.label}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={cn(
                      "transition-opacity duration-200",
                      state === "collapsed" && "opacity-0"
                    )}>
                      {item.label}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer com botão de logout */}
      {state === "expanded" && (
        <SidebarFooter className="p-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={signOut}
                className="h-12 text-base font-medium rounded-lg transition-all duration-200 ease-in-out w-full text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </motion.div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};