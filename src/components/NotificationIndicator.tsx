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
import { Bell, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationIndicatorProps {
  variant?: 'dropdown' | 'popover';
  className?: string;
  showBadge?: boolean;
  size?: 'sm' | 'default' | 'lg';
  iconOnly?: boolean;
}

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  variant = 'popover',
  className,
  showBadge = true,
  size = 'default',
  iconOnly = true
}) => {
  const { unreadCount, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

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
        'relative',
        iconOnly && buttonSizes[size],
        hasUnread && 'animate-pulse',
        className
      )}
      disabled={isLoading}
    >
      {hasUnread ? (
        <BellRing className={cn(iconSizes[size], 'text-white')} />
      ) : (
        <Bell className={iconSizes[size]} />
      )}
      
      {!iconOnly && (
        <span className="ml-2">
          Notificações
        </span>
      )}
      
      {showBadge && hasUnread && (
        <Badge 
          variant="destructive" 
          className={cn(
            'absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold',
            size === 'sm' && 'h-4 w-4 text-[10px]',
            size === 'lg' && 'h-6 w-6 text-sm'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  if (variant === 'dropdown') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <NotificationButton />
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-96 p-0"
          sideOffset={5}
        >
          <UserNotifications 
            showFilters={false}
            maxHeight="500px"
            className="border-0 shadow-none"
          />
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
        className="w-96 p-0"
        sideOffset={5}
      >
        <UserNotifications 
          showFilters={true}
          maxHeight="500px"
          className="border-0 shadow-none"
        />
      </PopoverContent>
    </Popover>
  );
};

// Componente simplificado para uso em mobile
export const NotificationIndicatorMobile: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  const { unreadCount, isLoading } = useNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <Button
      variant={hasUnread ? 'default' : 'ghost'}
      size="icon"
      className={cn(
        'relative h-9 w-9',
        hasUnread && 'animate-pulse',
        className
      )}
      onClick={onClick}
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
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
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