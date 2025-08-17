import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Wrench, 
  CheckCircle, 
  MessageSquare, 
  Building2,
  ArrowRight,
  Palette,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  onClick: () => void;
  className?: string;
}

function SettingsCard({ 
  title, 
  description, 
  icon, 
  badge, 
  badgeVariant = 'default', 
  onClick, 
  className 
}: SettingsCardProps) {
  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        'border-2 hover:border-blue-200',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {badge && (
                <Badge variant={badgeVariant} className="mt-1">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function ServiceOrderSettings() {
  const navigate = useNavigate();

  const settingsOptions = [
    {
      title: 'Tipos de Serviço',
      description: 'Configure os tipos de serviço disponíveis, defina preços padrão e organize categorias para facilitar a criação de ordens de serviço.',
      icon: <Wrench className="w-6 h-6 text-blue-600" />,
      badge: 'Essencial',
      badgeVariant: 'default' as const,
      path: '/service-orders/settings/types'
    },
    {
      title: 'Status Personalizados',
      description: 'Crie e gerencie status personalizados para suas ordens de serviço. Defina cores, ícones e fluxo de trabalho personalizado.',
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      badge: 'Novo',
      badgeVariant: 'secondary' as const,
      path: '/service-orders/settings/statuses'
    },
    {
      title: 'Configurações WhatsApp',
      description: 'Configure números de telefone para compartilhamento via WhatsApp e personalize mensagens automáticas para clientes.',
      icon: <MessageSquare className="w-6 h-6 text-green-500" />,
      path: '/service-orders/settings/whatsapp'
    },
    {
      title: 'Marca da Empresa',
      description: 'Personalize a identidade visual da sua empresa nas ordens compartilhadas. Configure logo, nome e informações de contato.',
      icon: <Building2 className="w-6 h-6 text-purple-600" />,
      badge: 'Recomendado',
      badgeVariant: 'outline' as const,
      path: '/service-orders/settings/branding'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configurações de Ordens de Serviço
              </h1>
              <p className="text-gray-600 mt-1">
                Personalize e configure o módulo de ordens de serviço
              </p>
            </div>
          </div>
          
          <Separator className="my-6" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Wrench className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Tipos de Serviço</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Status Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">WhatsApp Ativo</p>
                  <p className="text-2xl font-bold text-green-600">Sim</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Options */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Opções de Configuração
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settingsOptions.map((option, index) => (
              <SettingsCard
                key={index}
                title={option.title}
                description={option.description}
                icon={option.icon}
                badge={option.badge}
                badgeVariant={option.badgeVariant}
                onClick={() => handleNavigation(option.path)}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Ações Rápidas</span>
              </CardTitle>
              <CardDescription>
                Acesso rápido às configurações mais utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigation('/service-orders/settings/types')}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Novo Tipo de Serviço
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigation('/service-orders/settings/statuses')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Novo Status
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigation('/service-orders/settings/whatsapp')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Configurar WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigation('/service-orders/settings/branding')}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Atualizar Logo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/service-orders')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Voltar para Ordens de Serviço
          </Button>
        </div>
      </div>
    </div>
  );
}