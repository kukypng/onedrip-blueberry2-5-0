import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Send, Calendar, Shield, Eye, TrendingUp, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { SecurityValidation } from '@/utils/securityValidation';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
interface AdminUserActionsProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  isActive?: boolean;
  expirationDate?: string;
  budgetCount?: number;
  onSuccess?: () => void;
}
export const AdminUserActions = ({
  userId,
  userEmail,
  userName,
  userRole = 'user',
  isActive = true,
  expirationDate,
  budgetCount = 0,
  onSuccess
}: AdminUserActionsProps) => {
  const [showEmailRecovery, setShowEmailRecovery] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [userMetrics, setUserMetrics] = useState<any>(null);
  const {
    showSuccess,
    showError
  } = useToast();
  const sendRecoveryEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      await SecurityValidation.logAdminAccess('recovery_email_sent', 'user', userId);
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Email de recuperação enviado',
        description: 'O usuário receberá um email para redefinir a senha.'
      });
      setShowEmailRecovery(false);
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao enviar email',
        description: error.message || 'Não foi possível enviar o email de recuperação.'
      });
    }
  });
  const loadUserMetricsMutation = useMutation({
    mutationFn: async () => {
      const {
        data,
        error
      } = await supabase.rpc('admin_get_user_metrics', {
        p_user_id: userId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      setUserMetrics(data?.[0] || null);
      setShowMetrics(true);
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao carregar métricas',
        description: error.message || 'Não foi possível carregar as métricas do usuário.'
      });
    }
  });
  const renewLicenseMutation = useMutation({
    mutationFn: async (additionalDays: number) => {
      const {
        data,
        error
      } = await supabase.rpc('admin_renew_user_license', {
        p_user_id: userId,
        p_additional_days: additionalDays
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Licença renovada',
        description: 'A licença do usuário foi renovada com sucesso.'
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao renovar licença',
        description: error.message || 'Não foi possível renovar a licença.'
      });
    }
  });
  const handleRecoveryEmail = () => {
    sendRecoveryEmailMutation.mutate(userEmail);
  };
  const handleLoadMetrics = () => {
    loadUserMetricsMutation.mutate();
  };
  const handleRenewLicense = (days: number) => {
    renewLicenseMutation.mutate(days);
  };
  const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;
  const daysUntilExpiry = expirationDate ? Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  return <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Settings className="h-5 w-5" />
            Gerenciamento de Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações do usuário */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{userEmail}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Função:</span>
              <Badge variant={userRole === 'admin' ? 'destructive' : 'secondary'} className="ml-2">
                {userRole === 'admin' ? 'Administrador' : 'Usuário'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={isActive && !isExpired ? 'default' : 'secondary'} className="ml-2">
                {isActive && !isExpired ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Orçamentos:</span>
              <p className="font-medium">{budgetCount}</p>
            </div>
          </div>

          {/* Status da licença */}
          {expirationDate && <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">Licença expira em:</span>
                  <p className="font-medium">
                    {isExpired ? 'Expirada' : `${daysUntilExpiry} dias`}
                  </p>
                </div>
                <Badge variant={isExpired ? 'destructive' : daysUntilExpiry < 7 ? 'destructive' : 'default'}>
                  {isExpired ? 'Expirada' : daysUntilExpiry < 7 ? 'Expirando' : 'Válida'}
                </Badge>
              </div>
            </div>}
          
          {/* Ações administrativas */}
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEmailRecovery(true)} disabled={sendRecoveryEmailMutation.isPending} className="justify-start">
              <Send className="mr-2 h-4 w-4" />
              {sendRecoveryEmailMutation.isPending ? 'Enviando...' : 'Enviar Recuperação de Senha'}
            </Button>

            <Button variant="outline" size="sm" onClick={handleLoadMetrics} disabled={loadUserMetricsMutation.isPending} className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              {loadUserMetricsMutation.isPending ? 'Carregando...' : 'Ver Métricas Detalhadas'}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              
              
              
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas detalhadas */}
      {showMetrics && userMetrics && <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <TrendingUp className="h-5 w-5" />
              Métricas do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total de orçamentos:</span>
                <p className="font-medium">{userMetrics.total_budgets}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Orçamentos concluídos:</span>
                <p className="font-medium">{userMetrics.completed_budgets}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Taxa de conclusão:</span>
                <p className="font-medium">{userMetrics.completion_rate?.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Score de produtividade:</span>
                <p className="font-medium">{userMetrics.productivity_score}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Receita total:</span>
                <p className="font-medium">R$ {userMetrics.total_revenue?.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor médio por orçamento:</span>
                <p className="font-medium">R$ {userMetrics.avg_budget_value?.toFixed(2)}</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => setShowMetrics(false)} className="w-full">
              Ocultar Métricas
            </Button>
          </CardContent>
        </Card>}

      {/* Dialog para confirmar envio de email de recuperação */}
      <ConfirmationDialog open={showEmailRecovery} onOpenChange={setShowEmailRecovery} onConfirm={handleRecoveryEmail} title="Enviar Email de Recuperação" description={`Enviar email de recuperação de senha para ${userEmail}? O usuário receberá um link seguro para redefinir sua senha.`} confirmButtonText="Enviar Email" />
    </div>;
};