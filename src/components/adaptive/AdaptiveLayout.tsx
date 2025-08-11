
import React, { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLayout } from '@/contexts/LayoutContext';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import '@/styles/hamburger-menu.css';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TabletHeaderNav } from './TabletHeaderNav';
import { cn } from '@/lib/utils';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { MobileMenuProvider } from '@/components/mobile/MobileMenuProvider';
import { NotificationIndicator } from '@/components/NotificationIndicator';
import { MobileHamburgerButton } from '@/components/mobile/MobileHamburgerButton';
import { MobileHamburgerMenu } from '@/components/mobile/MobileHamburgerMenu';
import { useMobileMenuContext } from '@/components/mobile/MobileMenuProvider';

interface AdaptiveLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Enhanced Mobile Layout with better responsiveness
const MobileLayoutContent = ({ children, activeTab, onTabChange }: AdaptiveLayoutProps) => {
  const { safeArea, orientation } = useLayout();
  const [isScrolled, setIsScrolled] = useState(false);
  const { 
    isOpen, 
    menuData, 
    toggleMenu, 
    closeMenu, 
    handleLogout 
  } = useMobileMenuContext();

  // Handle scroll state for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={cn(
        "min-h-[100dvh] flex flex-col bg-background w-full overflow-hidden relative",
        "transition-all duration-300 ease-in-out"
      )}
      style={{
        paddingTop: `${safeArea.top}px`,
        paddingLeft: `${safeArea.left}px`,
        paddingRight: `${safeArea.right}px`,
      }}
    >
      {/* Enhanced Mobile Header */}
      <motion.header 
        className={cn(
          "flex items-center justify-between border-b border-border sticky top-0 z-30 transition-all duration-300",
          "px-3 py-2 sm:px-4 sm:py-3",
          isScrolled 
            ? "bg-background/98 backdrop-blur-xl shadow-sm" 
            : "bg-background/95 backdrop-blur-sm",
          orientation === 'landscape' ? "h-12" : "h-14"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <MobileHamburgerButton
              isOpen={isOpen}
              onClick={toggleMenu}
            />
            <img 
              src="/lovable-uploads/logoo.png" 
              alt="OneDrip Logo" 
              className={cn(
                "transition-all duration-300",
                orientation === 'landscape' ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8"
              )} 
            />
            <h1 className={cn(
              "font-bold text-foreground transition-all duration-300",
              orientation === 'landscape' ? "text-lg" : "text-lg sm:text-xl"
            )}>
              OneDrip
            </h1>
          </div>
          
          <NotificationIndicator 
            size="sm"
            className="mr-2"
          />
        </div>
      </motion.header>

      {/* Enhanced Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto w-full relative",
        "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      )}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            className="w-full min-h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <MobileHamburgerMenu 
        isOpen={isOpen}
        onClose={closeMenu}
        onTabChange={onTabChange}
        menuData={menuData}
        onLogout={handleLogout}
      />
    </div>
  );
};

export const AdaptiveLayout = ({ children, activeTab, onTabChange }: AdaptiveLayoutProps) => {
  // All hooks must be called at the top, before any conditional logic
  const layoutContext = useLayout();
  const authContext = useAuth();
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    isCompactHeight, 
    isLandscape,
    reducedMotion,
    width,
    height 
  } = useResponsive();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll state for all layouts
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Proteção contra contextos não inicializados
  if (!layoutContext || !authContext) {
    return <MobileLoading message="Inicializando aplicação..." />;
  }

  const { 
    navHeight, 
    containerMaxWidth,
    safeArea,
    orientation,
    isUltraWide
  } = layoutContext;
  const { hasPermission } = authContext;

  if (isDesktop) {
    return (
      <SidebarProvider defaultOpen={false}>
        <ResponsiveContainer 
          className={cn(
            "min-h-screen flex w-full bg-background transition-all duration-300",
            "desktop-horizontal-layout", // Global desktop class
            safeArea && "safe-area-inset",
            isUltraWide && "max-w-screen-2xl"
          )}
          padding="none"
          maxWidth="full"
          optimized={true}
        >
          <motion.div 
            className="w-full flex desktop-main-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
            
            <SidebarInset className={cn(
              "flex-1 flex flex-col min-w-0 desktop-content-area",
              "transition-all duration-300 ease-in-out"
            )}>
              <motion.header 
                className={cn(
                  "flex shrink-0 items-center gap-6 border-b sticky top-0 z-30 transition-all duration-300",
                  "desktop-header px-6 py-4", // Enhanced desktop header
                  navHeight,
                  isScrolled 
                    ? "bg-background/98 backdrop-blur-xl shadow-sm" 
                    : "bg-background/95 backdrop-blur-sm"
                )}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                layout
              >
                <ResponsiveContainer 
                  className="flex items-center gap-4 w-full"
                  padding="none"
                  maxWidth="full"
                >
                  <motion.div 
                    className="flex items-center gap-4"
                    layout
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <SidebarTrigger className={cn(
                      "h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                      "hover:scale-110 active:scale-95"
                    )} />
                    <motion.img 
                      src="/lovable-uploads/logoo.png" 
                      alt="OneDrip" 
                      className="h-10 w-10" 
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    />
                    <motion.h1 
                      className="text-2xl font-bold text-foreground"
                      layout
                    >
                      OneDrip
                    </motion.h1>
                  </motion.div>
                  <div className="flex-1" />
                  <motion.div 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <NotificationIndicator 
                      variant="popover"
                      size="default"
                      className="mr-2"
                    />
                    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/10 rounded-full backdrop-blur-sm">
                      <div className="relative">
                        <div className="w-2 h-2 bg-gradient-to-r from-primary to-emerald-500 rounded-full" />
                        <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-primary to-emerald-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <span className="text-xs font-medium text-foreground/80 tracking-wide">
                        Desktop Mode - Layout Horizontal
                      </span>
                      <div className="w-1 h-4 bg-gradient-to-b from-primary/40 to-emerald-500/40 rounded-full" />
                    </div>
                  </motion.div>
                </ResponsiveContainer>
              </motion.header>
              
              <main className={cn(
                "flex-1 overflow-y-auto relative",
                "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
                "desktop-main-content", // Desktop-specific main content class
                "transition-all duration-300 ease-in-out"
              )}>
                <ResponsiveContainer 
                  padding="lg"
                  maxWidth="full"
                  className={cn(
                    "min-h-full",
                    "desktop-content-wrapper", // Wrapper for desktop content
                    "px-8 py-6", // Enhanced padding for desktop
                    "transition-all duration-300 ease-in-out"
                  )}
                >
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeTab}
                      className={cn(
                        "w-full h-full",
                        "desktop-page-content", // Desktop page content class
                        "space-y-6" // Better spacing for desktop
                      )}
                      initial={{ opacity: 0, x: 20, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.98 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: "easeInOut",
                        scale: { type: "spring", stiffness: 300, damping: 30 }
                      }}
                      layout
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </ResponsiveContainer>
              </main>
            </SidebarInset>
          </motion.div>
        </ResponsiveContainer>
      </SidebarProvider>
    );
  }

  if (isTablet) {
    return (
      <ResponsiveContainer 
        className="min-h-screen bg-background" 
        padding="none"
        maxWidth="full"
        optimized={true}
        breakpointBehavior={{
          tablet: isLandscape ? 'landscape-tablet-optimized' : 'portrait-tablet-optimized'
        }}
      >
        <TabletHeaderNav 
          activeTab={activeTab} 
          onTabChange={onTabChange}
        />
        
        <main className={cn(
          "flex-1 overflow-y-auto w-full relative",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          orientation === 'landscape' ? "pb-2" : "pb-4"
        )}>
          <ResponsiveContainer 
            padding="adaptive"
            maxWidth={containerMaxWidth === 'none' ? 'full' : '2xl'}
            className="min-h-full"
            breakpointBehavior={{
              tablet: isLandscape ? 'grid-adaptive landscape-tablet-grid' : 'portrait-tablet-grid'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                className="w-full h-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </ResponsiveContainer>
        </main>
      </ResponsiveContainer>
    );
  }

  // Enhanced Mobile layout
  return (
    <ResponsiveContainer 
      className="min-h-screen bg-background" 
      padding="none" 
      safeArea={true}
      optimized={true}
    >
      <MobileMenuProvider>
        <MobileLayoutContent 
          activeTab={activeTab}
          onTabChange={onTabChange}
        >
          <ResponsiveContainer 
            padding="adaptive" 
            safeArea={true}
            className="min-h-full"
          >
            {children}
          </ResponsiveContainer>
        </MobileLayoutContent>
      </MobileMenuProvider>
    </ResponsiveContainer>
  );
};
