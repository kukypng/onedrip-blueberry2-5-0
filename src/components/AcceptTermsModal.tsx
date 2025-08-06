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
      <DialogContent className="max-w-md sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] p-0 gap-0 overflow-hidden mx-4 sm:mx-auto">
        {/* Header */}
        <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-2xl font-bold text-center text-gray-900 dark:text-white">
              🔒 Termos e Políticas
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Para continuar usando o sistema, aceite nossos termos
            </p>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh] sm:max-h-[65vh] px-4 sm:px-6">
          <CardContent className="space-y-4 sm:space-y-6 p-0">
            {/* Aceitar todos - Destaque principal */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 sm:p-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-semibold text-lg sm:text-xl text-green-800 dark:text-green-200 mb-2">
                    🚀 Aceitar Todos os Termos
                  </h3>
                  <p className="text-sm sm:text-base text-green-700 dark:text-green-300">
                    Aceite rapidamente todos os termos e políticas para começar a usar o sistema
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={allTermsAccepted}
                    onCheckedChange={handleSelectAll}
                    className="h-6 w-6 border-2"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-base sm:text-lg font-medium cursor-pointer text-green-800 dark:text-green-200"
                  >
                    Aceito todos os termos
                  </label>
                </div>
                
                {allTermsAccepted && (
                  <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                    ✅ Perfeito! Você pode continuar agora
                  </div>
                )}
              </div>
            </div>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou aceite individualmente</span>
              </div>
            </div>

            {/* Lista de termos compacta */}
            <div className="space-y-3">
              {termsData.map((term) => {
                const IconComponent = term.icon;
                const isAccepted = acceptedTerms[term.key];
                
                return (
                  <div key={term.id} className={`border rounded-lg p-3 sm:p-4 transition-all duration-200 ${
                    isAccepted ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg ${
                          isAccepted ? 'bg-green-100 dark:bg-green-800/30' : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <IconComponent className={`h-4 w-4 ${
                            isAccepted ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm sm:text-base text-foreground">{term.title}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                              {term.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openExternalPage(term.path)}
                            className="flex items-center gap-1 text-xs px-2 py-1 h-auto hover:bg-blue-50 text-blue-600"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="hidden sm:inline">Ler</span>
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            id={term.id}
                            checked={isAccepted}
                            onCheckedChange={(checked) => 
                              handleAcceptanceChange(term.key, checked as boolean)
                            }
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={term.id}
                            className="text-xs sm:text-sm font-medium cursor-pointer text-foreground"
                          >
                            Li e aceito
                          </label>
                          {isAccepted && (
                            <span className="text-green-600 text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Informação legal compacta */}
            <div className="text-center text-xs sm:text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
              <p>
                Ao aceitar, você confirma ter 18+ anos ou autorização legal.
              </p>
            </div>
          </CardContent>
        </ScrollArea>

        {/* Footer com botões otimizado para mobile */}
        <div className="p-4 sm:p-6 pt-0 border-t">
          {/* Botão principal destacado */}
          <div className="space-y-3">
            <Button
              onClick={handleAcceptAll}
              disabled={!allTermsAccepted}
              size="lg"
              className={`w-full h-12 text-base font-semibold transition-all ${
                allTermsAccepted 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                  : 'bg-muted dark:bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              }`}
            >
              {allTermsAccepted ? (
                <span className="flex items-center gap-2">
                  ✅ Aceitar e Continuar
                </span>
              ) : (
                `Aceitar Termos (${Object.values(acceptedTerms).filter(Boolean).length}/3)`
              )}
            </Button>
            
            {/* Botão secundário menor */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleDecline}
                size="sm"
                className="text-muted-foreground hover:text-red-600 text-sm transition-colors"
              >
                Não aceito - Sair
              </Button>
            </div>
          </div>
          
          {/* Feedback visual */}
          {!allTermsAccepted && (
            <div className="text-center mt-3">
              <p className="text-xs text-muted-foreground">
                📋 Aceite todos os termos acima para continuar
              </p>
              <div className="flex justify-center gap-1 mt-2">
                {termsData.map((term, index) => (
                  <div
                    key={term.id}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      acceptedTerms[term.key] 
                        ? 'bg-green-500' 
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
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