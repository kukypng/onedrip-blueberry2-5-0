/**
 * Página de Listagem de Ordens de Serviço (VIP)
 * Sistema Oliver Blueberry - Mobile First Design
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Search, Plus, Filter, MoreVertical, Eye, Edit, Trash2, Clock, AlertCircle, CheckCircle, XCircle, Wrench, Phone, Calendar, DollarSign, FileText, X } from 'lucide-react';
import { useSecureServiceOrders, useServiceOrderStats, useDeletedServiceOrdersCount } from '@/hooks/useSecureServiceOrders';
import { toast } from 'sonner';
import type { Enums } from '@/integrations/supabase/types';
type ServiceOrderStatus = Enums<'service_order_status'>;
type ServiceOrderPriority = Enums<'service_order_priority'>;
interface ServiceOrderFilters {
  search: string;
  status: ServiceOrderStatus | 'all';
  priority: ServiceOrderPriority | 'all';
  dateFrom: string;
  dateTo: string;
}
export const ServiceOrdersPage = () => {
  const {
    user,
    profile
  } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ServiceOrderFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Check if user has beta access
  const hasVipAccess = profile?.service_orders_vip_enabled || false;

  // Prepare filters for the hook
  const hookFilters = {
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    priority: filters.priority !== 'all' ? filters.priority : undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    limit: 50,
    offset: 0
  };

  // Hooks
  const {
    serviceOrders,
    isLoading,
    error,
    updateStatus,
    deleteServiceOrder,
    isUpdatingStatus,
    isDeleting,
    refetch
  } = useSecureServiceOrders(user?.id, hookFilters);
  const {
    data: stats
  } = useServiceOrderStats(user?.id);
  const {
    count: deletedCount
  } = useDeletedServiceOrdersCount(user?.id);

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const getStatusIcon = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Wrench className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  const getStatusColor = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-500/20';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/20';
    }
  };
  const getStatusText = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  };
  const getPriorityColor = (priority: ServiceOrderPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-500/20 text-gray-700';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700';
      case 'high':
        return 'bg-orange-500/20 text-orange-700';
      case 'urgent':
        return 'bg-red-500/20 text-red-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };
  const getPriorityText = (priority: ServiceOrderPriority) => {
    switch (priority) {
      case 'low':
        return 'Baixa';
      case 'medium':
        return 'Média';
      case 'high':
        return 'Alta';
      case 'urgent':
        return 'Urgente';
      default:
        return 'Normal';
    }
  };
  const handleStatusUpdate = (serviceOrderId: string, newStatus: ServiceOrderStatus) => {
    updateStatus({
      id: serviceOrderId,
      status: newStatus
    });
  };
  const handleDelete = (serviceOrderId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      deleteServiceOrder(serviceOrderId);
    }
  };
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };
  const activeFiltersCount = [filters.search, filters.status !== 'all' ? filters.status : null, filters.priority !== 'all' ? filters.priority : null, filters.dateFrom, filters.dateTo].filter(Boolean).length;

  // Check authentication
  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você precisa estar logado para ver as ordens de serviço.</p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>;
  }

  // Check beta access
  if (!hasVipAccess) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Ordens de Serviço (VIP)</h1>
          <p className="text-muted-foreground mb-6">
            Esta funcionalidade está em fase beta. Entre em contato com o suporte para solicitar acesso.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Voltar ao Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.open('https://wa.me/5511999999999', '_blank')} className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Solicitar Acesso
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Ordens de Serviço</h1>
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">VIP</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Gerencie suas ordens de serviço
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                  {serviceOrders.length}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/service-orders-trash')} className="gap-2 relative">
              <Trash2 className="h-4 w-4" />
              Lixeira
              {deletedCount > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {deletedCount}
                </Badge>}
            </Button>
            <Button size="sm" onClick={() => navigate('/service-orders/new')} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4" />
              Nova
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-4 pb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input placeholder="Buscar por cliente, dispositivo, problema..." value={filters.search} onChange={e => setFilters(prev => ({
            ...prev,
            search: e.target.value
          }))} className="pl-12 h-12 bg-card border-border/50 rounded-xl text-base placeholder:text-muted-foreground/70" />
          </div>

          {/* Filter Button and Active Filters */}
          <div className="flex items-center gap-2">
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    {activeFiltersCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>}
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filters.status} onValueChange={value => setFilters(prev => ({
                    ...prev,
                    status: value as ServiceOrderStatus | 'all'
                  }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="opened">Aberta</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select value={filters.priority} onValueChange={value => setFilters(prev => ({
                    ...prev,
                    priority: value as ServiceOrderPriority | 'all'
                  }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Prioridades</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Inicial</label>
                      <Input type="date" value={filters.dateFrom} onChange={e => setFilters(prev => ({
                      ...prev,
                      dateFrom: e.target.value
                    }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Final</label>
                      <Input type="date" value={filters.dateTo} onChange={e => setFilters(prev => ({
                      ...prev,
                      dateTo: e.target.value
                    }))} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && <div className="flex items-center gap-1 flex-wrap">
                {filters.search && <Badge variant="secondary" className="gap-1">
                    "{filters.search}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(prev => ({
                ...prev,
                search: ''
              }))} />
                  </Badge>}
                {filters.status !== 'all' && <Badge variant="secondary" className="gap-1">
                    {getStatusText(filters.status)}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(prev => ({
                ...prev,
                status: 'all'
              }))} />
                  </Badge>}
                {filters.priority !== 'all' && <Badge variant="secondary" className="gap-1">
                    {getPriorityText(filters.priority)}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(prev => ({
                ...prev,
                priority: 'all'
              }))} />
                  </Badge>}
              </div>}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <div className="px-4 py-2">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground">Receita</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}

      {/* Content */}
      <div className="px-4 pb-24">
        {isLoading ? <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Card key={i} className="animate-pulse border-border/50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="h-5 bg-muted rounded w-32"></div>
                        <div className="h-4 bg-muted rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-40"></div>
                    <div className="h-12 bg-muted rounded-lg"></div>
                  </div>
                </CardContent>
              </Card>)}
          </div> : error ? <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium mb-2">Erro ao carregar ordens</h3>
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro ao carregar as ordens de serviço.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Tentar Novamente
            </Button>
          </div> : serviceOrders.length === 0 ? <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {activeFiltersCount > 0 ? 'Nenhum resultado encontrado' : 'Nenhuma ordem de serviço ainda'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeFiltersCount > 0 ? 'Tente ajustar seus filtros ou limpar a busca.' : 'Crie sua primeira ordem de serviço para começar.'}
            </p>
            {activeFiltersCount === 0 && <Button onClick={() => navigate('/service-orders/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Criar Ordem de Serviço
              </Button>}
          </div> : <div className="space-y-4">
            {serviceOrders.map(order => <Card key={order.id} className="border-border/50 transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
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
                  {order.total_price && <div className="mb-6">
                      <p className="text-2xl font-bold">
                        {formatCurrency(Number(order.total_price))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valor total
                      </p>
                    </div>}

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    {order.status === 'opened' && <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleStatusUpdate(order.id, 'in_progress')} disabled={isUpdatingStatus}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Iniciar Serviço
                      </Button>}
                    
                    {order.status === 'in_progress' && <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(order.id, 'completed')} disabled={isUpdatingStatus}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir Serviço
                      </Button>}

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
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};