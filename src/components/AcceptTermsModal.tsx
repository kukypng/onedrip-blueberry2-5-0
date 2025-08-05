import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Cookie, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AcceptTermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const AcceptTermsModal: React.FC<AcceptTermsModalProps> = ({
  isOpen,
  onAccept,
  onDecline
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [acceptedTerms, setAcceptedTerms] = useState({
    privacy: false,
    terms: false,
    cookies: false
  });

  const [showDetails, setShowDetails] = useState(false);

  const allTermsAccepted = acceptedTerms.privacy && acceptedTerms.terms && acceptedTerms.cookies;

  const handleSelectAll = () => {
    const newState = !allTermsAccepted;
    setAcceptedTerms({
      privacy: newState,
      terms: newState,
      cookies: newState
    });
  };

  const handleAcceptanceChange = (type: keyof typeof acceptedTerms, checked: boolean) => {
    setAcceptedTerms(prev => ({
      ...prev,
      [type]: checked
    }));
  };

  const handleAcceptAll = () => {
    if (!allTermsAccepted) {
      toast({
        title: "Aceite necessário",
        description: "Você deve aceitar todos os termos para continuar usando o sistema.",
        variant: "destructive"
      });
      return;
    }

    // Salvar aceitação no localStorage com timestamp
    const acceptanceData = {
      ...acceptedTerms,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('termsAcceptance', JSON.stringify(acceptanceData));
    
    toast({
      title: "Termos aceitos",
      description: "Obrigado por aceitar nossos termos e políticas.",
    });
    
    onAccept();
  };

  const handleDecline = () => {
    toast({
      title: "Termos não aceitos",
      description: "Você será redirecionado para a página inicial.",
      variant: "destructive"
    });
    onDecline();
  };

  const openExternalPage = (path: string) => {
    window.open(path, '_blank', 'noopener,noreferrer');
  };

  const termsData = [
    {
      id: 'privacy',
      title: 'Política de Privacidade',
      description: 'Como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD.',
      icon: Shield,
      path: '/privacy',
      key: 'privacy' as keyof typeof acceptedTerms,
      highlights: [
        'Proteção de dados pessoais',
        'Conformidade com LGPD',
        'Direitos do titular dos dados',
        'Segurança da informação'
      ]
    },
    {
      id: 'terms',
      title: 'Termos de Uso',
      description: 'Regras e condições para uso do sistema OneDrip.',
      icon: FileText,
      path: '/terms',
      key: 'terms' as keyof typeof acceptedTerms,
      highlights: [
        'Licença de uso do sistema',
        'Responsabilidades do usuário',
        'Propriedade intelectual',
        'Limitações de responsabilidade'
      ]
    },
    {
      id: 'cookies',
      title: 'Política de Cookies',
      description: 'Como usamos cookies para melhorar sua experiência no sistema.',
      icon: Cookie,
      path: '/cookies',
      key: 'cookies' as keyof typeof acceptedTerms,
      highlights: [
        'Tipos de cookies utilizados',
        'Controle de preferências',
        'Cookies de terceiros',
        'Configurações do navegador'
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center">
            Bem-vindo ao OneDrip System
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            Para continuar, você precisa aceitar nossos termos e políticas
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6">
          <CardContent className="space-y-6 p-0">
            {/* Aviso importante */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Aceitação Obrigatória
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Para usar o OneDrip System, você deve aceitar todos os termos e políticas abaixo. 
                    Isso garante que você está ciente de como tratamos seus dados e quais são suas 
                    responsabilidades ao usar nosso sistema.
                  </p>
                </div>
              </div>
            </div>

            {/* Opção de selecionar tudo */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-primary mb-1">
                    Aceitar Todos os Termos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Marque esta opção para aceitar automaticamente todos os termos e políticas
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="select-all"
                    checked={allTermsAccepted}
                    onCheckedChange={handleSelectAll}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Selecionar tudo
                  </label>
                </div>
              </div>
            </div>

            {/* Lista de termos */}
            <div className="space-y-4">
              {termsData.map((term) => {
                const IconComponent = term.icon;
                const isAccepted = acceptedTerms[term.key];
                
                return (
                  <Card key={term.id} className={`border-2 transition-colors ${
                    isAccepted ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-muted'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`p-3 rounded-lg ${
                            isAccepted ? 'bg-green-100 dark:bg-green-900' : 'bg-primary/10'
                          }`}>
                            <IconComponent className={`h-6 w-6 ${
                              isAccepted ? 'text-green-600 dark:text-green-400' : 'text-primary'
                            }`} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg">{term.title}</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openExternalPage(term.path)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ler completo
                            </Button>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">
                            {term.description}
                          </p>
                          
                          {showDetails && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2 text-sm">Principais pontos:</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {term.highlights.map((highlight, index) => (
                                  <li key={index}>{highlight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={term.id}
                              checked={isAccepted}
                              onCheckedChange={(checked) => 
                                handleAcceptanceChange(term.key, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={term.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Li e aceito a {term.title}
                            </label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Toggle para mostrar detalhes */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-muted-foreground"
              >
                {showDetails ? 'Ocultar detalhes' : 'Mostrar principais pontos'}
              </Button>
            </div>

            {/* Resumo da aceitação */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Resumo da sua aceitação:</h3>
              <div className="space-y-2">
                {termsData.map((term) => (
                  <div key={term.id} className="flex items-center justify-between">
                    <span className="text-sm">{term.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      acceptedTerms[term.key]
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {acceptedTerms[term.key] ? 'Aceito' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Ao aceitar estes termos, você confirma que tem pelo menos 18 anos de idade 
                ou possui autorização de um responsável legal.
              </p>
              <p className="mt-2">
                Você pode revisar estes documentos a qualquer momento através do menu de configurações.
              </p>
            </div>
          </CardContent>
        </ScrollArea>

        {/* Footer com botões */}
        <div className="p-6 pt-0 border-t">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1 sm:flex-none"
            >
              Não aceito
            </Button>
            <Button
              onClick={handleAcceptAll}
              disabled={!allTermsAccepted}
              className="flex-1 sm:flex-none"
            >
              {allTermsAccepted ? 'Aceitar e continuar' : `Aceite todos os termos (${
                Object.values(acceptedTerms).filter(Boolean).length
              }/3)`}
            </Button>
          </div>
          
          {!allTermsAccepted && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Você deve aceitar todos os termos para continuar
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook para verificar se os termos foram aceitos
export const useTermsAcceptance = () => {
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAcceptance = () => {
      try {
        const stored = localStorage.getItem('termsAcceptance');
        if (!stored) {
          setNeedsAcceptance(true);
          setIsLoading(false);
          return;
        }

        const acceptance = JSON.parse(stored);
        const isValid = acceptance.privacy && acceptance.terms && acceptance.cookies;
        
        // Verificar se a aceitação não é muito antiga (opcional)
        const acceptanceDate = new Date(acceptance.timestamp);
        const daysSinceAcceptance = (Date.now() - acceptanceDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Se passou mais de 365 dias, pedir nova aceitação
        if (daysSinceAcceptance > 365) {
          setNeedsAcceptance(true);
        } else {
          setNeedsAcceptance(!isValid);
        }
      } catch (error) {
        console.error('Erro ao verificar aceitação de termos:', error);
        setNeedsAcceptance(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAcceptance();
  }, []);

  const markAsAccepted = () => {
    setNeedsAcceptance(false);
  };

  const clearAcceptance = () => {
    localStorage.removeItem('termsAcceptance');
    setNeedsAcceptance(true);
  };

  return {
    needsAcceptance,
    isLoading,
    markAsAccepted,
    clearAcceptance
  };
};