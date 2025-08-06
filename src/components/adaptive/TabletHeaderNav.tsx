import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAppInfo } from '@/hooks/useAppConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, FileText, Plus, Settings, Menu, Shield, Database, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabletHeaderNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuToggle?: () => void;
}

export const TabletHeaderNav = ({
  activeTab,
  onTabChange,
  onMenuToggle
}: TabletHeaderNavProps) => {
  const {
    signOut,
    profile,
    hasPermission
  } = useAuth();
  
  const { name, logo } = useAppInfo();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [{
    id: 'dashboard',
    icon: Home,
    label: 'Menu'
  }, {
    id: 'budgets',
    icon: FileText,
    label: 'Orçamentos'
  }, {
    id: 'data-management',
    icon: Database,
    label: 'Gestão de Dados'
  }, {
    id: 'admin',
    icon: Shield,
    label: 'Admin',
    permission: 'manage_users'
  }, {
    id: 'settings',
    icon: Settings,
    label: 'Configurações'
  }].filter(item => !item.permission || hasPermission(item.permission));

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  // Check if we need compact mode for smaller screens
  const isCompactMode = navItems.length > 4;

  return (
    <>
      <motion.div 
        className={cn(
          "flex items-center justify-between sticky top-0 z-40 transition-all duration-300",
          "border-b px-3 sm:px-4 lg:px-6 h-16",
          isScrolled 
            ? "bg-card/98 backdrop-blur-xl shadow-sm" 
            : "bg-card/95 backdrop-blur-xl"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div 
          className="flex items-center gap-3 sm:gap-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <img 
              alt={`${name} Logo`} 
              className="h-8 w-8 transition-all duration-300" 
              src={logo} 
            />
            <h1 className="text-xl font-bold text-foreground">{name}</h1>
          </div>
          
          {/* Desktop Navigation */}
          <motion.nav 
            className="hidden lg:flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Button 
                    variant={isActive ? "default" : "ghost"} 
                    size="sm" 
                    onClick={() => handleTabChange(item.id)} 
                    className={cn(
                      "gap-2 transition-all duration-300 hover:scale-105",
                      "px-3 py-2",
                      isActive && "bg-primary text-primary-foreground shadow-lg scale-105"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Button>
                </motion.div>
              );
            })}
          </motion.nav>
        </motion.div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {profile.role.toUpperCase()}
              </Badge>
            </div>
          )}
          
          <Button 
            onClick={() => handleTabChange('new-budget')} 
            size="sm" 
            className="gap-2 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Orçamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>

          {/* Mobile/Tablet Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden transition-all duration-300 hover:scale-105"
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Mobile/Tablet Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-x-0 top-16 z-30 bg-card/98 backdrop-blur-xl border-b shadow-lg lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col p-4 gap-2 max-w-md mx-auto">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        "w-full justify-start gap-3 transition-all duration-300 hover:scale-[1.02]",
                        "px-4 py-3 text-left",
                        isActive && "bg-primary text-primary-foreground shadow-md"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};