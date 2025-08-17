import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { useResponsive } from '@/hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Check, Trash2, RefreshCw, CheckCircle, AlertCircle, AlertTriangle, Info, Search, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  user_notification_id?: string;
  notification_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_type: 'all' | 'specific';
  target_user_id?: string;
  created_by: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
  read_at?: string;
  user_deleted_at?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    default:
      return Info;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case 'success':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
};

const NotificationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { isDesktop, isMobile } = useResponsive();
  const {
    notifications,
    unreadCount,
    isLoading,
    filters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateFilters,
    refreshNotifications,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeletingNotification
  } = useNotifications();

  // Flag para controlar se já marcou as mensagens como lidas
  const hasMarkedAsReadRef = useRef(false);

  // Auto-marcar mensagens como lidas ao acessar a página (apenas uma vez)
  useEffect(() => {
    if (!isLoading && notifications && notifications.length > 0 && !hasMarkedAsReadRef.current) {
      const unreadNotifications = notifications.filter((n: any) => !n.is_read && !n.user_deleted_at);
      if (unreadNotifications.length > 0) {
        hasMarkedAsReadRef.current = true;
        // Marcar todas as mensagens não lidas como lidas automaticamente (sem notificação)
        markAllAsRead(true);
      }
    }
  }, [isLoading, notifications]);

  // Atualizar filtros baseado na aba ativa
  useEffect(() => {
    updateFilters({
      deletedStatus: 'active'
    });
  }, [updateFilters]);

  // Handle scroll state for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleSoftDeleteNotification = (notificationId: string) => {
    console.log('🔍 Tentando deletar notificação:', { notificationId });
    deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRefresh = () => {
    refreshNotifications();
  };

  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = notificationsArray.filter((notification: any) => {
    // Filtro de busca
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro de tipo
    if (filters.type && filters.type !== 'all' && notification.type !== filters.type) {
      return false;
    }

    // Filtro de status de leitura
    if (filters.read_status && filters.read_status !== 'all') {
      if (filters.read_status === 'read' && !notification.is_read) {
        return false;
      }
      if (filters.read_status === 'unread' && notification.is_read) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className={cn("min-h-screen bg-background", isDesktop && "desktop-page-content")}>
      {/* Header Sticky */}
      <motion.div 
        className={cn(
          "sticky top-0 z-50 border-b border-border/50 transition-all duration-300",
          isScrolled ? "bg-background/98 backdrop-blur-xl shadow-soft" : "bg-background/95 backdrop-blur-sm",
          isDesktop && "desktop-section-header"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className={cn("text-xl font-bold", isDesktop && "desktop-section-title")}>Mensagens</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} mensagem${unreadCount > 1 ? 's' : ''} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas as mensagens foram lidas'}
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                  {filteredNotifications.length}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button size="sm" onClick={handleMarkAllAsRead} disabled={isMarkingAllAsRead} className="gap-2 btn-apple">
                <Check className="h-4 w-4" />
                {!isMobile && "Marcar Todas"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Abas e Filtros */}
      <div className="px-4 py-2">
        <div className="w-full mb-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Mensagens Ativas</h2>
          </div>
          
          <Card className={cn("glass-card border-border/30", isDesktop && "desktop-card")}>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Busca */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar mensagens..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      className="pl-12 h-12 bg-card border-border/50 rounded-xl text-base placeholder:text-muted-foreground/70" 
                    />
                  </div>
                  
                  {/* Filtros */}
                  <div className="flex gap-2">
                    <Select value={filters.type || 'all'} onValueChange={value => updateFilters({ type: value as any })}>
                      <SelectTrigger className="w-[140px] bg-card border-border/50 rounded-xl">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filters.read_status || 'all'} onValueChange={value => updateFilters({ read_status: value as any })}>
                      <SelectTrigger className="w-[140px] bg-card border-border/50 rounded-xl">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="unread">Não lidas</SelectItem>
                        <SelectItem value="read">Lidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className={cn("px-4 pb-24 safe-area-pb", isDesktop && "desktop-grid-container desktop-grid-auto-fit")}>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className={cn("animate-pulse glass-card border-border/30", isDesktop && "desktop-card")}>
                <CardContent className={cn("p-6", isDesktop && "desktop-content desktop-card-content")}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="h-5 bg-muted rounded w-32 skeleton"></div>
                        <div className="h-4 bg-muted rounded w-24 skeleton"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-20 skeleton"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-40 skeleton"></div>
                    <div className="h-12 bg-muted rounded-lg skeleton"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || filters.type !== 'all' || filters.read_status !== 'all' ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem ainda'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filters.type !== 'all' || filters.read_status !== 'all' ? 'Tente ajustar sua busca ou limpar os filtros.' : 'Você receberá suas mensagens aqui quando elas chegarem.'}
            </p>
            {(searchTerm || filters.type !== 'all' || filters.read_status !== 'all') && (
              <Button onClick={() => {
                setSearchTerm('');
                updateFilters({
                  type: 'all',
                  read_status: 'all'
                });
              }} className="btn-apple">
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <div className={cn("space-y-4", isDesktop && "desktop-grid-3-col gap-6 space-y-0")}>
            <AnimatePresence>
              {filteredNotifications.map((notification: any, index) => {
                const IconComponent = getTypeIcon(notification.type);
                const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
                return (
                  <motion.div 
                    key={notification.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }} 
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "glass-card border-border/30 transition-all duration-200 hover:shadow-medium interactive-scale",
                      !notification.is_read && "ring-2 ring-primary/20 bg-primary/5",
                      isExpired && "opacity-60",
                      isDesktop && "desktop-card"
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Ícone do tipo */}
                          <div className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-soft",
                            getTypeColor(notification.type)
                          )}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1 text-balance">
                                  {notification.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs rounded-full">
                                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                  </Badge>
                                  {!notification.is_read && (
                                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border border-primary/20 rounded-full">
                                      Nova
                                    </Badge>
                                  )}
                                  {isExpired && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground rounded-full">
                                      Expirada
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!notification.is_read && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleMarkAsRead(notification.id)} 
                                    disabled={isMarkingAsRead} 
                                    className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full" 
                                    title="Marcar como lida"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-muted-foreground mb-4 leading-relaxed text-pretty">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>
                                {format(new Date(notification.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {notification.expires_at && (
                                <span className={cn(
                                  "text-xs px-2 py-1 rounded-full",
                                  isExpired ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                                )}>
                                  {isExpired ? 'Expirou em' : 'Expira em'} {format(new Date(notification.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;