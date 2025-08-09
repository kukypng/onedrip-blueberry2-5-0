import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  Filter,
  BellRing
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_type: 'all' | 'specific' | 'push_enabled';
  target_user_id?: string;
  target_user_email?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  sent_count?: number;
}

interface User {
  id: string;
  email: string;
  user_profiles?: {
    full_name?: string;
  };
}

const notificationTypes = [
  { value: 'info', label: 'Informação', icon: Info, color: 'bg-blue-500' },
  { value: 'success', label: 'Sucesso', icon: CheckCircle, color: 'bg-green-500' },
  { value: 'warning', label: 'Aviso', icon: AlertTriangle, color: 'bg-yellow-500' },
  { value: 'error', label: 'Erro', icon: AlertCircle, color: 'bg-red-500' }
];

export const AdminNotificationManager = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showSentNotifications, setShowSentNotifications] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    target_type: 'all' as const,
    target_user_id: '',
    expires_at: ''
  });

  // Buscar usuários para seleção
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          users!inner(email)
        `)
        .order('full_name');
      
      if (error) throw error;
      
      return data.map(profile => ({
        id: profile.id,
        email: profile.users.email,
        full_name: profile.full_name
      }));
    }
  });

  // Buscar notificações existentes
  const { data: allNotifications = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          target_user:user_profiles!notifications_target_user_id_fkey(
            full_name,
            users!inner(email)
          ),
          user_notifications(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(notification => ({
        ...notification,
        target_user_email: notification.target_user?.users?.email,
        sent_count: notification.user_notifications?.[0]?.count || 0
      }));
    }
  });

  // Filtrar notificações baseado no toggle
  const notifications = allNotifications.filter(notification => {
    if (showSentNotifications) {
      return true; // Mostrar todas
    } else {
      return notification.sent_count === 0; // Mostrar apenas não enviadas
    }
  });

  // Mutation para criar notificação
  const createNotificationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase.rpc('create_notification', {
        p_title: data.title,
        p_message: data.message,
        p_type: data.type,
        p_target_type: data.target_type,
        p_target_user_id: data.target_type === 'specific' ? data.target_user_id : null,
        p_expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      showSuccess({
        title: "Notificação criada",
        description: "A notificação foi enviada com sucesso."
      });
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_type: 'all',
        target_user_id: '',
        expires_at: ''
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (error: any) => {
      showError({
        title: "Erro ao criar notificação",
        description: error.message || "Ocorreu um erro inesperado."
      });
    }
  });

  // Mutation para desativar notificação
  const deactivateNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_active: false })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: "Notificação desativada",
        description: "A notificação foi desativada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (error: any) => {
      showError({
        title: "Erro ao desativar notificação",
        description: error.message || "Ocorreu um erro inesperado."
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      showError({
        title: "Campos obrigatórios",
        description: "Título e mensagem são obrigatórios."
      });
      return;
    }
    
    if (formData.target_type === 'specific' && !formData.target_user_id) {
      showError({
        title: "Usuário obrigatório",
        description: "Selecione um usuário para notificação específica."
      });
      return;
    }
    
    createNotificationMutation.mutate(formData);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    if (!typeConfig) return Info;
    return typeConfig.icon;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig?.color || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Gerenciar Notificações
          </h2>
          <p className="text-muted-foreground">
            Envie notificações personalizadas para usuários específicos ou todos os usuários
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Notificação
          </Button>
        </div>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Notificação</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para enviar uma notificação personalizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Digite o título da notificação"
                    maxLength={255}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite a mensagem da notificação"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_type">Destinatário *</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: any) => setFormData(prev => ({ 
                      ...prev, 
                      target_type: value,
                      target_user_id: value === 'all' ? '' : prev.target_user_id
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos os usuários
                        </div>
                      </SelectItem>
                      <SelectItem value="push_enabled">
                        <div className="flex items-center gap-2">
                          <BellRing className="h-4 w-4" />
                          Usuários com notificações ativadas
                        </div>
                      </SelectItem>
                      <SelectItem value="specific">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Usuário específico
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_type === 'specific' && (
                  <div className="space-y-2">
                    <Label htmlFor="target_user">Usuário *</Label>
                    <Select
                      value={formData.target_user_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, target_user_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Data de Expiração (Opcional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <Separator />

              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createNotificationMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createNotificationMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar Notificação
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                {showSentNotifications ? 'Histórico de todas as notificações criadas' : 'Notificações não enviadas (rascunhos)'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label htmlFor="show-sent" className="text-sm font-medium">
                Mostrar enviadas
              </Label>
              <Switch
                id="show-sent"
                checked={showSentNotifications}
                onCheckedChange={setShowSentNotifications}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando notificações...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma notificação encontrada</p>
              <p className="text-sm">Crie sua primeira notificação usando o botão acima</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const TypeIcon = getTypeIcon(notification.type);
                const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
                
                return (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-all ${
                      !notification.is_active || isExpired ? 'opacity-60 bg-muted/50' : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${getTypeColor(notification.type)} text-white`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <Badge variant={notification.is_active ? 'default' : 'secondary'}>
                              {notification.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                            {isExpired && (
                              <Badge variant="destructive">Expirada</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(notification.created_at)}
                            </span>
                            
                            <span className="flex items-center gap-1">
                              {notification.target_type === 'all' ? (
                                <>
                                  <Users className="h-3 w-3" />
                                  Todos os usuários
                                </>
                              ) : notification.target_type === 'push_enabled' ? (
                                <>
                                  <BellRing className="h-3 w-3" />
                                  Usuários com push ativado
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3" />
                                  {notification.target_user_email}
                                </>
                              )}
                            </span>
                            
                            {notification.sent_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                Enviada para {notification.sent_count} usuário(s)
                              </span>
                            )}
                            
                            {notification.expires_at && (
                              <span className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Expira: {formatDate(notification.expires_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {notification.is_active && !isExpired && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateNotificationMutation.mutate(notification.id)}
                            disabled={deactivateNotificationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};