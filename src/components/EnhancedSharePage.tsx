import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  ArrowLeft,
  Share2,
  Download,
  Eye,
  Building2
} from 'lucide-react';
import { useServiceOrderShare } from '@/hooks/useServiceOrderShare';
import { useCompanyBranding } from '@/hooks/useCompanyBranding';
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings';
import { useCustomStatuses } from '@/hooks/useCustomStatuses';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  service_type: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  completed_date?: string;
  technician_name?: string;
  estimated_cost?: number;
  final_cost?: number;
  notes?: string;
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
};

const defaultStatusConfig = {
  pending: { label: 'Pendente', color: '#6B7280', icon: 'Clock' },
  in_progress: { label: 'Em Andamento', color: '#3B82F6', icon: 'Settings' },
  completed: { label: 'Concluído', color: '#10B981', icon: 'CheckCircle' },
  cancelled: { label: 'Cancelado', color: '#EF4444', icon: 'X' }
};

export function EnhancedSharePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getServiceOrderByToken, loading: shareLoading } = useServiceOrderShare();
  const { companyInfo, shareSettings, loading: brandingLoading, refreshData } = useCompanyBranding();
  const { settings: whatsappSettings, generateShareLink, openWhatsApp } = useWhatsAppSettings();
  const { getStatusByName, getStatusColor, getStatusIcon } = useCustomStatuses();
  
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Removed useEffect that was causing infinite loop
  // refreshData is not needed here as company branding data
  // is loaded automatically by the useCompanyBranding hook

  useEffect(() => {
    if (token) {
      loadServiceOrder();
    }
  }, [token]);

  const loadServiceOrder = async () => {
    if (!token) {
      console.log('🚫 [DEBUG] Token não fornecido');
      return;
    }
    
    console.log('🚀 [DEBUG] Iniciando carregamento da ordem de serviço');
    console.log('🔑 [DEBUG] Token recebido:', token);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📞 [DEBUG] Chamando getServiceOrderByToken...');
      const order = await getServiceOrderByToken(token);
      console.log('📋 [DEBUG] Resultado da busca:', order);
      
      if (order) {
        console.log('✅ [DEBUG] Ordem encontrada, atualizando estado');
        setServiceOrder(order);
      } else {
        console.log('❌ [DEBUG] Ordem não encontrada');
        setError('Ordem de serviço não encontrada ou token inválido');
      }
    } catch (err) {
      console.error('💥 [DEBUG] Erro ao carregar ordem de serviço:', err);
      setError('Erro ao carregar ordem de serviço');
    } finally {
      console.log('🏁 [DEBUG] Finalizando carregamento');
      setLoading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!serviceOrder || !whatsappSettings?.phone_number) {
      toast.error('Configurações do WhatsApp não encontradas');
      return;
    }

    try {
      const shareUrl = window.location.href;
      const link = await generateShareLink(serviceOrder.id, shareUrl);
      
      if (whatsappSettings.auto_open) {
        openWhatsApp(whatsappSettings.phone_number, link);
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(link);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch (error) {
      toast.error('Erro ao gerar link de compartilhamento');
    }
  };

  const getStatusDisplay = (status: string) => {
    const customStatus = getStatusByName(status);
    if (customStatus) {
      return {
        label: customStatus.name,
        color: customStatus.color,
        icon: customStatus.icon
      };
    }
    
    return defaultStatusConfig[status as keyof typeof defaultStatusConfig] || {
      label: status,
      color: '#6B7280',
      icon: 'AlertCircle'
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy \\à\\s HH:mm', { locale: ptBR });
  };

  const themeColor = shareSettings?.theme_color || '#3B82F6';
  const showCompanyHeader = shareSettings?.show_logo || shareSettings?.show_company_name;

  if (loading || shareLoading || brandingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ordem de serviço...</p>
        </div>
      </div>
    );
  }

  if (error || !serviceOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p className="text-gray-600 mb-4">
              {error || 'Ordem de serviço não encontrada'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(serviceOrder.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Header */}
      {showCompanyHeader && companyInfo && (
        <div className="bg-white border-b" style={{ borderColor: themeColor + '20' }}>
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center space-x-4">
              {shareSettings?.show_logo && companyInfo.logo_url && (
                <img
                  src={companyInfo.logo_url}
                  alt={companyInfo.name}
                  className="w-12 h-12 object-contain"
                />
              )}
              
              <div className="flex-1">
                {shareSettings?.show_company_name && companyInfo.name && (
                  <h1 className="text-xl font-bold" style={{ color: themeColor }}>
                    {companyInfo.name}
                  </h1>
                )}
                
                {shareSettings?.custom_message && (
                  <p className="text-gray-600 text-sm mt-1">
                    {shareSettings.custom_message}
                  </p>
                )}
              </div>
              

            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: themeColor + '20' }}
            >
              <Eye className="w-6 h-6" style={{ color: themeColor }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {serviceOrder.order_number}
              </h1>
              <p className="text-gray-600">
                Ordem de Serviço Compartilhada
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {shareSettings?.show_whatsapp_button && whatsappSettings?.enabled && (
              <Button
                onClick={handleWhatsAppShare}
                style={{ backgroundColor: themeColor }}
                className="text-white hover:opacity-90"
              >
                <Phone className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Status da Ordem</span>
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: statusDisplay.color }}
                  >
                    {statusDisplay.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Criado em</p>
                    <p className="font-semibold">{formatDateTime(serviceOrder.created_at)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Última atualização</p>
                    <p className="font-semibold">{formatDateTime(serviceOrder.updated_at)}</p>
                  </div>
                  
                  {serviceOrder.scheduled_date && (
                    <div>
                      <p className="text-sm text-gray-600">Data agendada</p>
                      <p className="font-semibold">{formatDate(serviceOrder.scheduled_date)}</p>
                    </div>
                  )}
                  
                  {serviceOrder.completed_date && (
                    <div>
                      <p className="text-sm text-gray-600">Data de conclusão</p>
                      <p className="font-semibold">{formatDate(serviceOrder.completed_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Serviço</p>
                  <p className="font-semibold">{serviceOrder.service_type}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Descrição</p>
                  <p className="text-gray-900">{serviceOrder.description}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Prioridade</p>
                  <Badge className={priorityConfig[serviceOrder.priority].color}>
                    {priorityConfig[serviceOrder.priority].label}
                  </Badge>
                </div>
                
                {serviceOrder.technician_name && (
                  <div>
                    <p className="text-sm text-gray-600">Técnico Responsável</p>
                    <p className="font-semibold">{serviceOrder.technician_name}</p>
                  </div>
                )}
                
                {serviceOrder.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Observações</p>
                    <p className="text-gray-900">{serviceOrder.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Information */}
            {(serviceOrder.estimated_cost || serviceOrder.final_cost) && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Custo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {serviceOrder.estimated_cost && (
                      <div>
                        <p className="text-sm text-gray-600">Custo Estimado</p>
                        <p className="font-semibold text-lg">
                          {formatCurrency(serviceOrder.estimated_cost)}
                        </p>
                      </div>
                    )}
                    
                    {serviceOrder.final_cost && (
                      <div>
                        <p className="text-sm text-gray-600">Custo Final</p>
                        <p className="font-semibold text-lg" style={{ color: themeColor }}>
                          {formatCurrency(serviceOrder.final_cost)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Cliente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-semibold">{serviceOrder.customer_name}</p>
                </div>
                
                {serviceOrder.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{serviceOrder.customer_phone}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${serviceOrder.customer_phone}`, '_self')}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {serviceOrder.customer_address && (
                  <div>
                    <p className="text-sm text-gray-600">Endereço</p>
                    <div className="flex items-start justify-between">
                      <p className="font-semibold flex-1 mr-2">{serviceOrder.customer_address}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(serviceOrder.customer_address!)}`, '_blank')}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {serviceOrder.customer_phone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${serviceOrder.customer_phone}`, '_self')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar para Cliente
                  </Button>
                )}
                
                {serviceOrder.customer_address && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(serviceOrder.customer_address!)}`, '_blank')}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Ver no Mapa
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const shareData = {
                      title: `Ordem de Serviço ${serviceOrder.order_number}`,
                      text: `${serviceOrder.service_type} - ${serviceOrder.customer_name}`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copiado!');
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            Ordem de serviço gerada em {formatDateTime(serviceOrder.created_at)}
          </p>
          {companyInfo?.name && (
            <p className="mt-1">
              © {new Date().getFullYear()} {companyInfo.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}