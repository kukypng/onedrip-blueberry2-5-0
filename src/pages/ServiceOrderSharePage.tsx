import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Package,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { useServiceOrderShare, ServiceOrderShareData, CompanyInfo } from '../hooks/useServiceOrderShare';
import { toast } from 'sonner';

interface StatusStep {
  status: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

const ServiceOrderSharePage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { getServiceOrderByToken, getCompanyInfoByToken, isLoading } = useServiceOrderShare();
  
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderShareData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 Iniciando carregamento de dados...');
      console.log('📝 Token recebido:', shareToken);
      
      if (!shareToken) {
        console.log('⚠️ Nenhum token fornecido, saindo...');
        setError('Token de compartilhamento inválido');
        return;
      }

      console.log('⏳ Estado de loading definido como true');

      try {
        console.log('🔄 Iniciando chamadas paralelas para buscar dados...');
        const [orderData, companyData] = await Promise.all([
          getServiceOrderByToken(shareToken),
          getCompanyInfoByToken(shareToken)
        ]);

        console.log('📦 Dados recebidos:', { orderData, companyData });
        
        if (!orderData) {
          setError('Ordem de serviço não encontrada ou token expirado');
          return;
        }

        setServiceOrder(orderData);
        setCompanyInfo(companyData);
        console.log('✅ Estados atualizados com sucesso');
      } catch (err) {
        console.error('💥 Erro ao carregar dados:', err);
        setError('Erro ao carregar informações');
      }
    };

    loadData();
  }, [shareToken, getServiceOrderByToken, getCompanyInfoByToken]);

  const getStatusSteps = (currentStatus: string): StatusStep[] => {
    const statuses = [
      { key: 'opened', label: 'Recebido', icon: <Package className="h-4 w-4" /> },
      { key: 'in_progress', label: 'Em Andamento', icon: <Wrench className="h-4 w-4" /> },
      { key: 'completed', label: 'Concluído', icon: <CheckCircle className="h-4 w-4" /> },
      { key: 'delivered', label: 'Entregue', icon: <CheckCircle className="h-4 w-4" /> }
    ];

    const currentIndex = statuses.findIndex(s => s.key === currentStatus);
    
    return statuses.map((status, index) => ({
      status: status.key,
      label: status.label,
      icon: status.icon,
      completed: index < currentIndex,
      current: index === currentIndex
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'opened':
        return 'bg-blue-500/20 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-200';
      case 'delivered':
        return 'bg-green-600/20 text-green-800 border-green-300';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'opened':
        return 'Recebido';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      case 'delivered':
        return 'Entregue';
      default:
        return 'Status Desconhecido';
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

  const handleWhatsAppContact = () => {
    if (companyInfo?.whatsapp_phone) {
      const message = `Olá! Estou acompanhando minha ordem de serviço ${serviceOrder?.formatted_id} e gostaria de mais informações.`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${companyInfo.whatsapp_phone.replace(/\D/g, '')}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Número do WhatsApp não disponível');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium mb-2">Erro</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!serviceOrder) {
    return null;
  }

  const statusSteps = getStatusSteps(serviceOrder.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')} 
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Acompanhar Reparo</h1>
              <p className="text-sm text-muted-foreground">
                {serviceOrder.formatted_id}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Company Info */}
        {companyInfo && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {companyInfo.logo_url ? (
                  <img 
                    src={companyInfo.logo_url} 
                    alt={companyInfo.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{companyInfo.name}</h2>
                  {companyInfo.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {companyInfo.address}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Order Info */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Informações do Reparo</h3>
                <Badge className={getStatusColor(serviceOrder.status)}>
                  {getStatusText(serviceOrder.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dispositivo:</p>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {serviceOrder.device_type} {serviceOrder.device_model}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Problema Relatado:</p>
                  <p className="text-sm">{serviceOrder.reported_issue}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data de Entrada:</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(serviceOrder.created_at)}</p>
                  </div>
                </div>

                {serviceOrder.updated_at !== serviceOrder.created_at && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Última Atualização:</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{formatDate(serviceOrder.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Timeline */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Progresso do Reparo</h3>
            <div className="space-y-4">
              {statusSteps.map((step, index) => (
                <div key={step.status} className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2
                    ${step.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : step.current 
                        ? 'bg-primary border-primary text-white'
                        : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    }
                  `}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.completed || step.current 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {step.current && (
                    <Badge variant="outline" className="text-xs">
                      Atual
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Button */}
        {companyInfo?.whatsapp_phone && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-bold">Precisa de Ajuda?</h3>
                <p className="text-sm text-muted-foreground">
                  Entre em contato conosco pelo WhatsApp para mais informações
                </p>
                <Button 
                  onClick={handleWhatsAppContact}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Entrar em Contato
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ServiceOrderSharePage;