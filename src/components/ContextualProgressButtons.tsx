import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Settings, 
  Send, 
  Archive,
  RotateCcw,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  Heart,
  ThumbsUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Info
} from 'lucide-react';
import { useContextualActions, ContextualAction, ServiceOrder } from '@/hooks/useContextualActions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContextualProgressButtonsProps {
  serviceOrder: ServiceOrder;
  onStatusUpdate?: (newStatus: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function ContextualProgressButtons({
  serviceOrder,
  onStatusUpdate,
  className,
  size = 'md',
  variant = 'default'
}: ContextualProgressButtonsProps) {
  const {
    loading,
    getAvailableActions,
    executeAction,
    canExecuteAction
  } = useContextualActions();

  const availableActions = getAvailableActions(serviceOrder.status);

  const handleActionClick = async (action: ContextualAction) => {
    if (!canExecuteAction(serviceOrder, action)) {
      toast.error('Você não tem permissão para executar esta ação');
      return;
    }

    const success = await executeAction(serviceOrder.id, action);
    if (success && onStatusUpdate) {
      onStatusUpdate(action.nextStatus);
    }
  };

  if (availableActions.length === 0) {
    return null;
  }

  const buttonSizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  };

  const containerClasses = {
    default: 'flex flex-wrap gap-2',
    compact: 'flex gap-1'
  };

  return (
    <div className={cn(containerClasses[variant], className)}>
      {availableActions.map((action) => {
        // Mapeamento de ícones para componentes importados
        const iconMap: Record<string, React.ComponentType<any>> = {
          'play': Play,
          'pause': Pause,
          'checkcircle': CheckCircle,
          'xcircle': XCircle,
          'clock': Clock,
          'alertcircle': AlertCircle,
          'settings': Settings,
          'send': Send,
          'archive': Archive,
          'rotateccw': RotateCcw,
          'filetext': FileText,
          'user': User,
          'calendar': Calendar,
          'mappin': MapPin,
          'phone': Phone,
          'mail': Mail,
          'star': Star,
          'heart': Heart,
          'thumbsup': ThumbsUp,
          'eye': Eye,
          'edit': Edit,
          'trash2': Trash2,
          'plus': Plus,
          'minus': Minus,
          'arrowright': ArrowRight,
          'arrowleft': ArrowLeft,
          'arrowup': ArrowUp,
          'arrowdown': ArrowDown,
          'check': Check,
          'x': X,
           'info': Info,
           'warning': AlertCircle,
           'error': XCircle,
           'success': CheckCircle
        };
        
        const Icon = iconMap[action.icon.replace('-', '').toLowerCase()] || CheckCircle;
        
        return (
          <Button
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={loading}
            className={cn(
              buttonSizeClasses[size],
              action.color,
              'text-white font-medium transition-all duration-200',
              'hover:scale-105 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
            title={action.description}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                {variant === 'default' && action.label}
                {variant === 'compact' && (
                  <span className="sr-only">{action.label}</span>
                )}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Componente para exibir o status atual com indicador visual
interface StatusIndicatorProps {
  status: string;
  className?: string;
  showText?: boolean;
}

export function StatusIndicator({ status, className, showText = true }: StatusIndicatorProps) {
  const { getStatusColor, getStatusIcon, getStatusText } = useContextualActions();
  
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);
  const statusText = getStatusText(status);
  
  // Mapeamento de ícones para componentes importados
  const iconMap: Record<string, React.ComponentType<any>> = {
    'play': Play,
    'pause': Pause,
    'checkcircle': CheckCircle,
    'xcircle': XCircle,
    'clock': Clock,
    'alertcircle': AlertCircle,
    'settings': Settings,
    'send': Send,
    'archive': Archive,
    'rotateccw': RotateCcw,
    'filetext': FileText,
    'user': User,
    'calendar': Calendar,
    'mappin': MapPin,
    'phone': Phone,
    'mail': Mail,
    'star': Star,
    'heart': Heart,
    'thumbsup': ThumbsUp,
    'eye': Eye,
    'edit': Edit,
    'trash2': Trash2,
    'plus': Plus,
    'minus': Minus,
    'arrowright': ArrowRight,
    'arrowleft': ArrowLeft,
    'arrowup': ArrowUp,
    'arrowdown': ArrowDown,
    'check': Check,
    'x': X,
     'info': Info,
     'warning': AlertCircle,
     'error': XCircle,
     'success': CheckCircle
  };
  
  const Icon = iconMap[statusIcon.replace('-', '').toLowerCase()] || CheckCircle;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className="w-3 h-3 rounded-full flex items-center justify-center"
        style={{ backgroundColor: statusColor }}
      >
        {Icon && (
          <Icon 
            className="w-2 h-2 text-white" 
            style={{ fontSize: '8px' }}
          />
        )}
      </div>
      {showText && (
        <span 
          className="text-sm font-medium"
          style={{ color: statusColor }}
        >
          {statusText}
        </span>
      )}
    </div>
  );
}

// Componente para exibir progresso em formato de timeline
interface StatusTimelineProps {
  currentStatus: string;
  className?: string;
}

export function StatusTimeline({ currentStatus, className }: StatusTimelineProps) {
  const { customStatuses, getStatusByName } = useContextualActions();
  
  const currentStatusObj = getStatusByName(currentStatus);
  const currentOrder = currentStatusObj?.order || 0;
  
  // Filtrar apenas status ativos e ordenar
  const activeStatuses = customStatuses
    .filter(status => status.is_active)
    .sort((a, b) => a.order - b.order);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {activeStatuses.map((status, index) => {
        const isCompleted = status.order <= currentOrder;
        const isCurrent = status.id === currentStatusObj?.id;
        // Mapeamento de ícones para componentes importados
        const iconMap: Record<string, React.ComponentType<any>> = {
          'play': Play,
          'pause': Pause,
          'checkcircle': CheckCircle,
          'xcircle': XCircle,
          'clock': Clock,
          'alertcircle': AlertCircle,
          'settings': Settings,
          'send': Send,
          'archive': Archive,
          'rotateccw': RotateCcw,
          'filetext': FileText,
          'user': User,
          'calendar': Calendar,
          'mappin': MapPin,
          'phone': Phone,
          'mail': Mail,
          'star': Star,
          'heart': Heart,
          'thumbsup': ThumbsUp,
          'eye': Eye,
          'edit': Edit,
          'trash2': Trash2,
          'plus': Plus,
          'minus': Minus,
          'arrowright': ArrowRight,
          'arrowleft': ArrowLeft,
          'arrowup': ArrowUp,
          'arrowdown': ArrowDown,
          'check': Check,
          'x': X,
           'info': Info,
           'warning': AlertCircle,
           'error': XCircle,
           'success': CheckCircle
        };
        
        const Icon = iconMap[status.icon.replace('-', '').toLowerCase()] || CheckCircle;
        
        return (
          <React.Fragment key={status.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                  isCompleted || isCurrent
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-400',
                  isCurrent && 'ring-2 ring-offset-2 ring-blue-500'
                )}
                style={{
                  backgroundColor: isCompleted || isCurrent ? status.color : undefined
                }}
              >
                {Icon && <Icon className="w-4 h-4" />}
              </div>
              <span className="text-xs mt-1 text-center max-w-16 truncate">
                {status.name}
              </span>
            </div>
            
            {index < activeStatuses.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 transition-all duration-200',
                  status.order < currentOrder
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}