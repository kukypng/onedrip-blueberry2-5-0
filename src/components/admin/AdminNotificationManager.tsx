import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Plus, Eye, EyeOff, Send, Users, MessageSquare, AlertCircle, Info, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationForm {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetType: 'all' | 'specific' | 'push_enabled';
  targetUserId: string;
  expiresAt: string;
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
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-blue-500';
  }
};

export const AdminNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [newNotification, setNewNotification] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetUserId: '',
    expiresAt: ''
  });

  const isAuthenticated = !!user?.id;

  // Buscar usuários para seleção usando RPC admin
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_all_users');
      if (error) throw error;
      return data?.map((user: any) => ({
        id: user.id,
        name: user.name || 'Sem nome'
      })) || [];
    },
    enabled: isAuthenticated
  });

  // Buscar notificações usando RPC admin
  const { data: notifications = [], isLoading: notificationsLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_notifications', {
        p_limit: 100,
        p_offset: 0
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated
  });

  // Buscar registros de envio usando RPC admin
  const { data: userNotifications = [] } = useQuery({
    queryKey: ['admin-user-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_user_notifications', {
        p_limit: 100,
        p_offset: 0
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated
  });

  const createNotification = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.rpc('admin_create_notification', {
        p_title: data.title,
        p_message: data.message,
        p_type: data.type,
        p_target_type: data.targetType,
        p_target_user_id: data.targetType === 'specific' ? data.targetUserId : null,
        p_expires_at: data.expiresAt || null
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      refetch();
      showSuccess({
        title: 'Sucesso',
        description: 'Notificação criada com sucesso!'
      });
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetUserId: '',
        expiresAt: ''
      });
    },
    onError: (error) => {
      showError({
        title: 'Erro',
        description: 'Erro ao criar notificação: ' + error.message
      });
    }
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('delete_user_notification', {
        p_notification_id: notificationId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      showSuccess({
        title: 'Sucesso',
        description: 'Notificação deletada com sucesso!'
      });
    },
    onError: (error) => {
      showError({
        title: 'Erro',
        description: 'Erro ao deletar notificação: ' + error.message
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNotification.title || !newNotification.message) {
      showError({
        title: 'Erro',
        description: 'Título e mensagem são obrigatórios'
      });
      return;
    }

    if (newNotification.targetType === 'specific' && !newNotification.targetUserId) {
      showError({
        title: 'Erro',
        description: 'Selecione um usuário para notificação específica'
      });
      return;
    }

    createNotification.mutate(newNotification);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Gerenciar Notificações</h2>
      </div>

      {/* Formulário para criar nova notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da notificação"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={newNotification.message}
                onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Conteúdo da notificação"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetType">Destinatário</Label>
                <Select
                  value={newNotification.targetType}
                  onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, targetType: value, targetUserId: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="specific">Usuário específico</SelectItem>
                    <SelectItem value="push_enabled">Usuários com push ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newNotification.targetType === 'specific' && (
                <div className="space-y-2">
                  <Label htmlFor="targetUser">Usuário</Label>
                  <Select
                    value={newNotification.targetUserId}
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, targetUserId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Data de Expiração (opcional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={newNotification.expiresAt}
                onChange={(e) => setNewNotification(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>

            <Button 
              type="submit" 
              disabled={createNotification.isPending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {createNotification.isPending ? 'Enviando...' : 'Criar Notificação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de notificações existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notificações Existentes ({notifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {notificationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: any) => {
                  const TypeIcon = getTypeIcon(notification.type);
                  const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
                  
                  return (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <TypeIcon className={`h-5 w-5 ${getTypeColor(notification.type)} flex-shrink-0 mt-0.5`} />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={notification.type === 'info' ? 'outline' : 'secondary'}>
                                {notification.type}
                              </Badge>
                              
                              <Badge variant={notification.target_type === 'all' ? 'default' : 'outline'}>
                                {notification.target_type === 'all' ? 'Todos' : 
                                 notification.target_type === 'specific' ? 'Específico' : 'Push'}
                              </Badge>
                              
                              {notification.is_active ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-red-500" />
                              )}
                              
                              {isExpired && (
                                <Badge variant="destructive">Expirada</Badge>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification.mutate(notification.id)}
                                disabled={deleteNotification.isPending}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>
                              Criada em {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR
                              })}
                            </span>
                            
                            {notification.expires_at && (
                              <span>
                                Expira em {format(new Date(notification.expires_at), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Histórico de envios */}
      {userNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Histórico de Envios ({userNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {userNotifications.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{item.notification_title}</p>
                      <p className="text-sm text-muted-foreground">
                        Para: {item.user_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.delivery_status === 'sent' ? 'default' : 'secondary'}>
                        {item.delivery_status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.sent_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};