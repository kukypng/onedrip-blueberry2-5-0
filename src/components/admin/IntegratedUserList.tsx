import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  CreditCard,
  UserX,
  RefreshCw,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useEnhancedUsers } from '../../hooks/useEnhancedUsers';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { EnhancedUserProfile } from './EnhancedUserProfile';
import type {
  IntegratedUserListProps,
  EnhancedUser,
  UserFilters,
  UserSortField,
  SortDirection,
  UserListSorting,
  PaginationParams
} from '../../types/userLicense';

// User selection hook
function useUserSelection() {
  const [selectedUsers, setSelectedUsers] = useState<EnhancedUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const selectUser = (user: EnhancedUser) => {
    const isSelected = selectedUserIds.includes(user.id);
    if (isSelected) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
      setSelectedUserIds(prev => prev.filter(id => id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
      setSelectedUserIds(prev => [...prev, user.id]);
    }
  };

  const selectAllUsers = (users: EnhancedUser[]) => {
    setSelectedUsers(users);
    setSelectedUserIds(users.map(u => u.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
    setSelectedUserIds([]);
  };

  const isSelected = (userId: string) => selectedUserIds.includes(userId);

  const selectedCount = selectedUsers.length;

  return {
    selectedUsers,
    selectedUserIds,
    selectUser,
    selectAllUsers,
    clearSelection,
    isSelected,
    selectedCount
  };
}

function UserTableRow({ user, isSelected, onSelect, onViewProfile, onManageLicense }: {
  user: EnhancedUser;
  isSelected: boolean;
  onSelect: (user: EnhancedUser) => void;
  onViewProfile?: (user: EnhancedUser) => void;
  onManageLicense?: (user: EnhancedUser) => void;
}) {
  const getLicenseStatusBadge = () => {
    if (user.active_licenses > 0) {
      return <Badge className="bg-green-500">Ativa</Badge>;
    } else if (user.expired_licenses > 0) {
      return <Badge variant="destructive">Expirada</Badge>;
    } else {
      return <Badge variant="outline">Sem Licença</Badge>;
    }
  };

  const isExpired = user.expired_licenses > 0;
  const isExpiringSoon = user.license?.expires_at ? 
    new Date(user.license.expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 : false;

  return (
    <TableRow className={isSelected ? 'bg-muted/50' : ''}>
      <TableCell>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => onSelect(user)}
        />
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{user.name || user.email}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getLicenseStatusBadge()}
          {isExpiringSoon && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          {isExpired && (
            <Clock className="h-4 w-4 text-red-500" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p>Total: {user.license_count || 0}</p>
          <p className="text-muted-foreground">Ativas: {user.active_licenses || 0}</p>
        </div>
      </TableCell>
      <TableCell>
        {user.last_sign_in_at ? 
          new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 
          'Nunca'
        }
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onViewProfile?.(user)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageLicense?.(user)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Gerenciar Licença
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function IntegratedUserList({ 
  onUserSelect, 
  onBulkAction,
  onViewProfile,
  onManageLicense 
}: IntegratedUserListProps) {
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters and sorting
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    license_status: null,
    license_type: '',
    date_range: undefined
  });
  
  const [sorting, setSorting] = useState<UserListSorting>({
    sort_by: 'created_at',
    sort_order: 'desc',
    field: 'created_at',
    direction: 'desc'
  });
  
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    offset: 0
  });

  // Data fetching
  const { users, loading, error, total, hasMore, refetch } = useEnhancedUsers({
    filters,
    sorting,
    pagination
  });

  // User selection
  const {
    selectedUsers,
    selectedUserIds,
    selectUser,
    selectAllUsers,
    clearSelection,
    isSelected,
    selectedCount
  } = useUserSelection();

  // Derived state
  const hasSelection = selectedCount > 0;
  const allCurrentPageSelected = users.length > 0 && users.every(user => isSelected(user.id));

  // Event handlers
  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setPagination(prev => ({ ...prev, page: 1, offset: 0 }));
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1, offset: 0 }));
  };

  const handleSort = (field: UserSortField) => {
    const newDirection: SortDirection = 
      sorting.field === field && sorting.direction === 'asc' ? 'desc' : 'asc';
    setSorting({
      sort_by: field,
      sort_order: newDirection,
      field,
      direction: newDirection
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ 
      ...prev, 
      page: newPage,
      offset: (newPage - 1) * prev.limit
    }));
  };

  const handleSelectAll = () => {
    if (allCurrentPageSelected) {
      clearSelection();
    } else {
      selectAllUsers(users);
    }
  };

  const handleBulkOperation = (operation: string) => {
    onBulkAction?.(operation, selectedUserIds);
    setShowBulkOperations(false);
    clearSelection();
  };

  const handleExportData = () => {
    console.log('Exporting user data...');
  };

  const totalPages = Math.ceil(total / pagination.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Usuários</h2>
          <p className="text-muted-foreground">
            {total > 0 ? `${total} usuários encontrados` : 'Carregando usuários...'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status da Licença</label>
                <Select 
                  value={filters.license_status || ''} 
                  onValueChange={(value) => handleFilterChange('license_status', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Licença</label>
                <Select 
                  value={filters.license_type || ''} 
                  onValueChange={(value) => handleFilterChange('license_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="basic">Básica</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários por nome ou email..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {hasSelection && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} selecionado(s)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkOperations(true)}
            >
              Operações em Lote
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Limpar Seleção
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={allCurrentPageSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('email')}
                      className="flex items-center space-x-1 p-0 h-auto font-medium"
                    >
                      <span>Usuário</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status da Licença</TableHead>
                  <TableHead>Licenças</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('last_sign_in_at')}
                      className="flex items-center space-x-1 p-0 h-auto font-medium"
                    >
                      <span>Último Login</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    isSelected={isSelected(user.id)}
                    onSelect={selectUser}
                    onViewProfile={onViewProfile}
                    onManageLicense={onManageLicense}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} até{' '}
            {Math.min(pagination.page * pagination.limit, total)} de {total} usuários
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Operations Dialog */}
      <Dialog open={showBulkOperations} onOpenChange={setShowBulkOperations}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Operações em Lote</DialogTitle>
            <DialogDescription>
              Execute operações em {selectedCount} usuário(s) selecionado(s)
            </DialogDescription>
          </DialogHeader>
          <BulkOperationsPanel
            selectedUsers={selectedUserIds}
            onOperationComplete={() => {
              setShowBulkOperations(false);
              clearSelection();
              refetch();
            }}
            onClose={() => setShowBulkOperations(false)}
          />
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <Dialog open={!!showUserProfile} onOpenChange={() => setShowUserProfile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Perfil do Usuário</DialogTitle>
          </DialogHeader>
          {showUserProfile && (
            <EnhancedUserProfile
              userId={showUserProfile}
              onClose={() => setShowUserProfile(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}