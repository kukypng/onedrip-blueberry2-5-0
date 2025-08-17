import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Settings, 
  AlertCircle, 
  Wrench,
  Phone,
  FileText,
  Share2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { ContextualProgressButtons } from '../components/ContextualProgressButtons';
import { useServiceOrderShare } from '../hooks/useServiceOrderShare';

type ServiceOrderStatus = 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
type ServiceOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

interface ServiceOrder {
  id: string;
  client_id?: string;
  device_type: string;
  device_model: string;
  reported_issue: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  total_price?: number;
  created_at: string;
  updated_at: string;
}

const ServiceOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const { generateShareToken, shareViaWhatsApp, isGenerating } = useServiceOrderShare();

  // Fetch service orders
  const { data: serviceOrders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ServiceOrder[];
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem de serviço excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir ordem de serviço: ' + error.message);
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ServiceOrderStatus }) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  // Filter service orders
  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.device_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.reported_issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [serviceOrders, searchTerm, statusFilter, priorityFilter]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    return count;
  }, [searchTerm, statusFilter, priorityFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: ServiceOrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  // Helper functions
  const getStatusColor = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'pending': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'in_progress': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'waiting_parts': return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'completed': return 'border-green-200 bg-green-50 text-green-800';
      case 'cancelled': return 'border-red-200 bg-red-50 text-red-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getStatusText = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'waiting_parts': return 'Aguardando Peças';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'in_progress': return <Play className="h-3 w-3" />;
      case 'waiting_parts': return <Pause className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: ServiceOrderPriority) => {
    switch (priority) {
      case 'low': return 'border-gray-200 bg-gray-50 text-gray-600';
      case 'medium': return 'border-blue-200 bg-blue-50 text-blue-600';
      case 'high': return 'border-orange-200 bg-orange-50 text-orange-600';
      case 'urgent': return 'border-red-200 bg-red-50 text-red-600';
      default: return 'border-gray-200 bg-gray-50 text-gray-600';
    }
  };

  const getPriorityText = (priority: ServiceOrderPriority) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando ordens de serviço...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as ordens de serviço da sua oficina
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/service-orders/settings')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
          <Button 
            onClick={() => navigate('/service-orders/new')} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por dispositivo, problema ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Limpar ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando ordens de serviço...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium mb-2">Erro ao carregar ordens</h3>
            <p className="text-muted-foreground mb-6">
              {error?.message || 'Ocorreu um erro ao carregar as ordens de serviço.'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        ) : serviceOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {activeFiltersCount > 0 ? 'Nenhum resultado encontrado' : 'Nenhuma ordem de serviço ainda'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeFiltersCount > 0 ? 'Tente ajustar seus filtros ou limpar a busca.' : 'Crie sua primeira ordem de serviço para começar.'}
            </p>
            {activeFiltersCount === 0 && (
              <Button onClick={() => navigate('/service-orders/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Criar Ordem de Serviço
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServiceOrders.map(order => (
              <Card key={order.id} className="border-border/50 transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">
                          OS #{order.id.slice(-8)}
                        </h3>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(order.priority as any)}`}>
                          {getPriorityText(order.priority as any)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/service-orders/${order.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/service-orders/${order.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Client Info */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Cliente:</p>
                    <p className="font-medium text-primary">
                      {order.client_id ? `ID: ${order.client_id}` : 'Cliente não informado'}
                    </p>
                  </div>

                  {/* Device Info */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Dispositivo:</p>
                    <p className="font-medium">
                      {order.device_model}
                    </p>
                  </div>

                  {/* Problem Description */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Problema:</p>
                    <p className="text-sm">
                      {order.reported_issue && order.reported_issue.length > 100 ? `${order.reported_issue.substring(0, 100)}...` : order.reported_issue || 'Descrição não informada'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge variant="outline" className={`${getStatusColor(order.status as any)} px-3 py-1 rounded-full flex items-center gap-1 w-fit`}>
                      {getStatusIcon(order.status as any)}
                      {getStatusText(order.status as any)}
                    </Badge>
                  </div>

                  {/* Price */}
                  {order.total_price && (
                    <div className="mb-6">
                      <p className="text-2xl font-bold">
                        {formatCurrency(Number(order.total_price))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valor total
                      </p>
                    </div>
                  )}

                  {/* Contextual Progress Buttons */}
                  <div className="mb-4">
                    <ContextualProgressButtons 
                      serviceOrder={order}
                      onStatusUpdate={(newStatus) => handleStatusUpdate(order.id, newStatus as any)}
                      variant="compact"
                    />
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex justify-center gap-8 pt-4 border-t border-border/50">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/service-orders/${order.id}`)} className="flex flex-col items-center gap-1 p-2 h-auto text-primary hover:text-primary/80">
                      <Eye className="h-5 w-5" />
                      <span className="text-xs">Ver</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/service-orders/${order.id}/edit`)} className="flex flex-col items-center gap-1 p-2 h-auto text-muted-foreground hover:text-foreground">
                      <Edit className="h-5 w-5" />
                      <span className="text-xs">Editar</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" disabled className="flex flex-col items-center gap-1 p-2 h-auto text-muted-foreground">
                      <Phone className="h-5 w-5" />
                      <span className="text-xs">Ligar</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={() => {/* TODO: Generate PDF */}} className="flex flex-col items-center gap-1 p-2 h-auto text-muted-foreground hover:text-foreground">
                      <FileText className="h-5 w-5" />
                      <span className="text-xs">PDF</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={async () => {
                        const shareData = await generateShareToken(order.id);
                        if (shareData) {
                          const deviceInfo = `${order.device_type} ${order.device_model}`.trim();
                          shareViaWhatsApp(shareData.share_url, deviceInfo);
                        }
                      }}
                      disabled={isGenerating}
                      className="flex flex-col items-center gap-1 p-2 h-auto text-green-600 hover:text-green-700"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="text-xs">Compartilhar</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={async () => {
                        const shareData = await generateShareToken(order.id);
                        if (shareData) {
                          const token = shareData.share_url.split('/').pop();
                          navigate(`/share/service-order/${token}`);
                        }
                      }}
                      disabled={isGenerating}
                      className="flex flex-col items-center gap-1 p-2 h-auto text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-5 w-5" />
                      <span className="text-xs">Visualizar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrdersPage;