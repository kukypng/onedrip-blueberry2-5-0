import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { UserNotifications } from '@/components/UserNotifications';
import { NotificationPanel } from '@/components/NotificationPanel';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bell, BellRing, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationIndicatorProps {
  variant?: 'dropdown' | 'popover' | 'modal';
  className?: string;
  showBadge?: boolean;
  size?: 'sm' | 'default' | 'lg';
  iconOnly?: boolean;
  useAdvancedPanel?: boolean;
}

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  variant = 'popover',
  className,
  showBadge = true,
  size = 'default',
  iconOnly = true,
  useAdvancedPanel = false
}) => {
  const { unreadCount, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const hasUnread = unreadCount > 0;

  const buttonSizes = {
    sm: 'h-8 w-8',
    default: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const NotificationButton = () => (
    <Button
      variant={hasUnread ? 'default' : 'ghost'}
      size={iconOnly ? 'icon' : size}
      className={cn(
        'relative transition-all duration-300 ease-out group',
        iconOnly && buttonSizes[size],
        hasUnread && [
          'shadow-lg hover:shadow-xl',
          'ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
          'animate-pulse hover:animate-none',
          'bg-gradient-to-r from-primary to-primary/90',
          'hover:from-primary/90 hover:to-primary',
          'before:absolute before:inset-0 before:rounded-md',
          'before:bg-gradient-to-r before:from-primary/20 before:to-transparent',
          'before:animate-pulse before:opacity-50'
        ],
        !hasUnread && [
          'hover:bg-muted/50',
          'hover:scale-105',
          'hover:shadow-md'
        ],
        className
      )}
      disabled={isLoading}
      onClick={() => navigate('/msg')}
    >
      {/* Glow effect for unread notifications */}
      {hasUnread && (
        <div className="absolute inset-0 rounded-md bg-primary/20 animate-ping opacity-75 pointer-events-none" />
      )}
      
      {hasUnread ? (
        <BellRing className={cn(
          iconSizes[size], 
          'text-white relative z-10',
          'drop-shadow-sm',
          'animate-none group-hover:animate-bounce'
        )} />
      ) : (
        <Bell className={cn(
          iconSizes[size],
          'transition-transform duration-200',
          'group-hover:scale-110'
        )} />
      )}
      
      {!iconOnly && (
        <span className="ml-2 relative z-10 font-medium">
          Notificações
        </span>
      )}
      
      {showBadge && hasUnread && (
        <Badge 
          variant="destructive" 
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center p-0 text-xs font-bold z-20',
            'bg-red-500 text-white border-2 border-background',
            'shadow-lg animate-bounce hover:animate-pulse',
            'transition-all duration-200',
            size === 'sm' && 'h-4 w-4 text-[10px] min-w-4',
            size === 'default' && 'h-5 w-5 min-w-5',
            size === 'lg' && 'h-6 w-6 text-sm min-w-6'
          )}
        >
          <span className="animate-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </Badge>
      )}
      
      {/* Subtle sparkle effect */}
      {hasUnread && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-60 pointer-events-none" />
      )}
    </Button>
  );

  if (variant === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <NotificationButton />
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <NotificationPanel 
            onClose={() => setIsOpen(false)}
            className="border-0 h-full"
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <NotificationButton />
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className={cn(
            "p-0",
            useAdvancedPanel ? "w-[500px]" : "w-96"
          )}
          sideOffset={5}
        >
          {useAdvancedPanel ? (
            <div className="h-[600px]">
              <NotificationPanel className="border-0 shadow-none h-full" />
            </div>
          ) : (
            <UserNotifications 
              showFilters={false}
              maxHeight="500px"
              className="border-0 shadow-none"
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <NotificationButton />
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className={cn(
          "p-0",
          useAdvancedPanel ? "w-[500px]" : "w-96"
        )}
        sideOffset={5}
      >
        {useAdvancedPanel ? (
          <div className="h-[600px]">
            <NotificationPanel className="border-0 shadow-none h-full" />
          </div>
        ) : (
          <UserNotifications 
            showFilters={true}
            maxHeight="500px"
            className="border-0 shadow-none"
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

// Componente avançado com painel completo
export const NotificationIndicatorAdvanced: React.FC<{
  variant?: 'modal' | 'dropdown' | 'popover';
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}> = ({ variant = 'modal', className, size = 'default' }) => {
  return (
    <NotificationIndicator
      variant={variant}
      className={className}
      size={size}
      useAdvancedPanel={true}
    />
  );
};

// Componente simplificado para uso em mobile
export const NotificationIndicatorMobile: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  const { unreadCount, isLoading } = useNotifications();
  const navigate = useNavigate();
  const hasUnread = unreadCount > 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/msg');
    }
  };

  return (
    <Button
      variant={hasUnread ? 'default' : 'ghost'}
      size="icon"
      className={cn(
        'relative h-9 w-9 transition-all duration-200',
        hasUnread && 'shadow-lg hover:shadow-xl animate-pulse',
        hasUnread && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background',
        className
      )}
      onClick={handleClick}
      disabled={isLoading}
    >
      {hasUnread ? (
        <BellRing className="h-5 w-5 text-white" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      
      {hasUnread && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold animate-bounce"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

// Hook para facilitar o uso do indicador
export const useNotificationIndicator = () => {
  const { unreadCount, refreshNotifications } = useNotifications();
  
  return {
    hasUnread: unreadCount > 0,
    unreadCount,
    refreshNotifications
  };
};