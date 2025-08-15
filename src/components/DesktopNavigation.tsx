import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  FileText, 
  Settings, 
  Plus, 
  LogOut, 
  User, 
  Star, 
  Users, 
  Database, 
  UserCheck,
  ChevronDown,
  Bell,
  Search,
  Menu
} from 'lucide-react';

interface DesktopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const DesktopNavigation = ({
  activeTab,
  onTabChange,
  className
}: DesktopNavigationProps) => {
  const {
    signOut,
    user,
    profile,
    hasRole
  } = useAuth();
  
  const { isDesktop } = useResponsive();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      permission: true,
      shortcut: '⌘1',
      description: 'Visão geral do sistema'
    },
    {
      id: 'budgets',
      label: 'Orçamentos',
      icon: FileText,
      permission: true,
      shortcut: '⌘2',
      description: 'Gerencie seus orçamentos',
      badge: 'Nova'
    },
    {
      id: 'new-budget',
      label: 'Novo',
      icon: Plus,
      permission: true,
      shortcut: '⌘N',
      description: 'Criar novo orçamento',
      isPrimary: true
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: UserCheck,
      permission: true,
      shortcut: '⌘3',
      description: 'Base de clientes'
    },
    {
      id: 'data-management',
      label: 'Dados',
      icon: Database,
      permission: true,
      shortcut: '⌘4',
      description: 'Gestão de dados'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Users,
      permission: hasRole('admin'),
      shortcut: '⌘A',
      description: 'Painel administrativo',
      isRestricted: true
    },
    {
      id: 'settings',
      label: 'Config',
      icon: Settings,
      permission: true,
      shortcut: '⌘,',
      description: 'Configurações'
    }
  ];

  const availableItems = navigationItems.filter(item => item.permission);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full bg-gradient-to-r from-background via-background/95 to-background",
        "border-b border-border/40 backdrop-blur-xl",
        "sticky top-0 z-50 shadow-sm",
        className
      )}
    >
      {/* Navigation Container */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand */}
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">Sistema</h1>
                <p className="text-xs text-muted-foreground">Orçamentos Pro</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8 hidden lg:block" />
          </motion.div>

          {/* Main Navigation */}
          <motion.div 
            className="flex items-center gap-2 flex-1 max-w-4xl mx-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1 bg-muted/30 rounded-full p-1 backdrop-blur-sm border border-border/20">
              {availableItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="relative group"
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "relative h-9 px-4 rounded-full transition-all duration-300",
                        "hover:scale-105 hover:shadow-md",
                        isActive && "bg-primary text-primary-foreground shadow-lg",
                        !isActive && "hover:bg-muted/50",
                        item.isPrimary && !isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                        item.isRestricted && "border border-amber-200/50 bg-amber-50/50 text-amber-700"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isActive && "scale-110",
                        "group-hover:scale-110"
                      )} />
                      <span className="ml-2 font-medium text-sm">{item.label}</span>
                      
                      {/* Badge */}
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-700"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-primary rounded-full -z-10"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Button>

                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      <div className="bg-foreground text-background text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        <div className="font-medium">{item.description}</div>
                        {item.shortcut && (
                          <div className="text-muted-foreground mt-1">{item.shortcut}</div>
                        )}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Actions */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden md:flex hover:scale-105 transition-transform">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative hover:scale-105 transition-transform">
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {profile?.name || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full p-2 hover:scale-105 transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <ChevronDown className="h-3 w-3 ml-1 text-muted-foreground" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Progress indicator for active section */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      />
    </motion.nav>
  );
};

export default DesktopNavigation;