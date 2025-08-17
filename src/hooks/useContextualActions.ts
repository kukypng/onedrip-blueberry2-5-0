import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCustomStatuses, CustomStatus } from './useCustomStatuses';

export interface ContextualAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  nextStatus: string;
  description?: string;
}

export interface ServiceOrder {
  id: string;
  status: string;
  [key: string]: any;
}

export function useContextualActions() {
  const [loading, setLoading] = useState(false);
  const { customStatuses, getNextStatus, getStatusByName } = useCustomStatuses();

  const getAvailableActions = (currentStatus: string): ContextualAction[] => {
    const actions: ContextualAction[] = [];

    // Mapear status para ações contextuais
    switch (currentStatus.toLowerCase()) {
      case 'aberto':
      case 'opened':
        actions.push({
          id: 'start_service',
          label: 'Iniciar Serviço',
          icon: 'play-circle',
          color: 'bg-blue-500 hover:bg-blue-600',
          nextStatus: 'Em Andamento',
          description: 'Marcar como em andamento'
        });
        break;

      case 'em andamento':
      case 'in_progress':
        actions.push(
          {
            id: 'pause_service',
            label: 'Pausar',
            icon: 'pause-circle',
            color: 'bg-yellow-500 hover:bg-yellow-600',
            nextStatus: 'Pausado',
            description: 'Pausar temporariamente'
          },
          {
            id: 'complete_service',
            label: 'Concluir Serviço',
            icon: 'check-circle',
            color: 'bg-green-500 hover:bg-green-600',
            nextStatus: 'Concluído',
            description: 'Marcar como concluído'
          }
        );
        break;

      case 'pausado':
      case 'paused':
        actions.push({
          id: 'resume_service',
          label: 'Retomar',
          icon: 'play-circle',
          color: 'bg-blue-500 hover:bg-blue-600',
          nextStatus: 'Em Andamento',
          description: 'Retomar o serviço'
        });
        break;

      case 'concluído':
      case 'completed':
        actions.push(
          {
            id: 'deliver_service',
            label: 'Entregar',
            icon: 'package-check',
            color: 'bg-purple-500 hover:bg-purple-600',
            nextStatus: 'Entregue',
            description: 'Marcar como entregue'
          },
          {
            id: 'reopen_service',
            label: 'Reabrir',
            icon: 'rotate-ccw',
            color: 'bg-orange-500 hover:bg-orange-600',
            nextStatus: 'Em Andamento',
            description: 'Reabrir para ajustes'
          }
        );
        break;

      case 'entregue':
      case 'delivered':
        actions.push({
          id: 'archive_service',
          label: 'Arquivar',
          icon: 'archive',
          color: 'bg-gray-500 hover:bg-gray-600',
          nextStatus: 'Arquivado',
          description: 'Arquivar ordem de serviço'
        });
        break;

      default:
        // Para status personalizados, verificar se há próximo status definido
        const currentStatusObj = getStatusByName(currentStatus);
        if (currentStatusObj) {
          const nextStatus = getNextStatus(currentStatusObj.id);
          if (nextStatus) {
            actions.push({
              id: `next_${nextStatus.id}`,
              label: `Avançar para ${nextStatus.name}`,
              icon: nextStatus.icon,
              color: `bg-blue-500 hover:bg-blue-600`,
              nextStatus: nextStatus.name,
              description: nextStatus.description || `Avançar para ${nextStatus.name}`
            });
          }
        }
        break;
    }

    return actions;
  };

  const executeAction = async (serviceOrderId: string, action: ContextualAction): Promise<boolean> => {
    try {
      setLoading(true);

      // Usar a função RPC para atualizar o status
      const { data, error } = await supabase
        .rpc('update_service_order_status_contextual', {
          order_id: serviceOrderId,
          new_status: action.nextStatus
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao executar ação');
      }

      toast.success(`${action.label} executado com sucesso!`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao executar ação';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const statusObj = getStatusByName(status);
    if (statusObj) {
      return statusObj.color;
    }

    // Cores padrão para status conhecidos
    switch (status.toLowerCase()) {
      case 'aberto':
      case 'opened':
        return '#EF4444'; // red-500
      case 'em andamento':
      case 'in_progress':
        return '#F59E0B'; // amber-500
      case 'pausado':
      case 'paused':
        return '#6B7280'; // gray-500
      case 'concluído':
      case 'completed':
        return '#10B981'; // emerald-500
      case 'entregue':
      case 'delivered':
        return '#3B82F6'; // blue-500
      case 'arquivado':
      case 'archived':
        return '#6B7280'; // gray-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  const getStatusIcon = (status: string): string => {
    const statusObj = getStatusByName(status);
    if (statusObj) {
      return statusObj.icon;
    }

    // Ícones padrão para status conhecidos
    switch (status.toLowerCase()) {
      case 'aberto':
      case 'opened':
        return 'clock';
      case 'em andamento':
      case 'in_progress':
        return 'play-circle';
      case 'pausado':
      case 'paused':
        return 'pause-circle';
      case 'concluído':
      case 'completed':
        return 'check-circle';
      case 'entregue':
      case 'delivered':
        return 'package-check';
      case 'arquivado':
      case 'archived':
        return 'archive';
      default:
        return 'circle';
    }
  };

  const getStatusText = (status: string): string => {
    const statusObj = getStatusByName(status);
    if (statusObj) {
      return statusObj.name;
    }

    // Textos padrão para status conhecidos
    switch (status.toLowerCase()) {
      case 'opened':
        return 'Aberto';
      case 'in_progress':
        return 'Em Andamento';
      case 'paused':
        return 'Pausado';
      case 'completed':
        return 'Concluído';
      case 'delivered':
        return 'Entregue';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const canExecuteAction = (serviceOrder: ServiceOrder, action: ContextualAction): boolean => {
    // Verificações básicas de permissão
    // Aqui você pode adicionar lógica mais complexa baseada em:
    // - Permissões do usuário
    // - Estado da ordem de serviço
    // - Regras de negócio específicas
    
    return true; // Por enquanto, permitir todas as ações
  };

  return {
    loading,
    customStatuses,
    getAvailableActions,
    executeAction,
    getStatusColor,
    getStatusIcon,
    getStatusText,
    canExecuteAction
  };
}