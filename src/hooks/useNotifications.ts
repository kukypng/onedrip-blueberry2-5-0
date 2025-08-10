import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface Notification {
  id: string;
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
}

interface NotificationFilters {
  type?: 'info' | 'warning' | 'success' | 'error' | 'all';
  read_status?: 'read' | 'unread' | 'all';
}

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<NotificationFilters>({
    type: 'all',
    read_status: 'all'
  });

  // Buscar notificações do usuário
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-notifications', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_limit: 50,
        p_offset: 0
      });
      
      if (error) {
        console.error('Erro ao buscar notificações:', error);
        throw error;
      }

      let filteredData = data || [];

      // Aplicar filtros
      if (filters.type && filters.type !== 'all') {
        filteredData = filteredData.filter((n: Notification) => n.type === filters.type);
      }

      if (filters.read_status && filters.read_status !== 'all') {
        if (filters.read_status === 'read') {
          filteredData = filteredData.filter((n: Notification) => n.is_read);
        } else {
          filteredData = filteredData.filter((n: Notification) => !n.is_read);
        }
      }

      return filteredData;
    },
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 60000, // Atualizar a cada 60 segundos
    staleTime: 30000 // Considerar dados obsoletos após 30 segundos
  });

  // Contar notificações não lidas
  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;

  // Marcar notificação como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
    onError: (error) => {
      console.error('Erro ao marcar notificação como lida:', error);
      showError({
        title: 'Erro',
        description: 'Não foi possível marcar a notificação como lida.'
      });
    }
  });

  // Marcar todas as notificações como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter((n: Notification) => !n.is_read);
      
      const promises = unreadNotifications.map((notification: Notification) =>
        supabase.rpc('mark_notification_as_read', {
          p_notification_id: notification.id
        })
      );

      const results = await Promise.allSettled(promises);
      
      // Verificar se houve erros
      const errors = results.filter(result => result.status === 'rejected');
      if (errors.length > 0) {
        throw new Error(`Falha ao marcar ${errors.length} notificações como lidas`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      showSuccess({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas.'
      });
    },
    onError: (error) => {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      showError({
        title: 'Erro',
        description: 'Não foi possível marcar todas as notificações como lidas.'
      });
    }
  });

  // Deletar notificação individual
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase.rpc('delete_user_notification', {
        p_notification_id: notificationId
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      showSuccess({
        title: 'Sucesso',
        description: 'Notificação excluída com sucesso.'
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir notificação:', error);
      showError({
        title: 'Erro',
        description: 'Não foi possível excluir a notificação.'
      });
    }
  });

  // Deletar todas as notificações
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const promises = notifications.map((notification: Notification) =>
        supabase.rpc('delete_user_notification', {
          p_notification_id: notification.id
        })
      );

      const results = await Promise.allSettled(promises);
      
      // Verificar se houve erros
      const errors = results.filter(result => result.status === 'rejected');
      if (errors.length > 0) {
        throw new Error(`Falha ao excluir ${errors.length} notificações`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      showSuccess({
        title: 'Sucesso',
        description: 'Todas as notificações foram excluídas.'
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir todas as notificações:', error);
      showError({
        title: 'Erro',
        description: 'Não foi possível excluir todas as notificações.'
      });
    }
  });

  // Função para marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  // Função para marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Função para deletar notificação
  const deleteNotification = useCallback((notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  }, [deleteNotificationMutation]);

  // Função para deletar todas as notificações
  const deleteAllNotifications = useCallback(() => {
    deleteAllNotificationsMutation.mutate();
  }, [deleteAllNotificationsMutation]);

  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Função para refrescar notificações
  const refreshNotifications = useCallback(() => {
    refetch();
  }, [refetch]);

  // Remover polling adicional para evitar re-renders excessivos
  // O refetchInterval de 30 segundos já é suficiente para atualizações

  return {
    // Dados
    notifications,
    unreadCount,
    isLoading,
    error,
    filters,
    
    // Ações
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    updateFilters,
    refreshNotifications,
    
    // Estados de loading
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
    isDeletingAllNotifications: deleteAllNotificationsMutation.isPending
  };
};