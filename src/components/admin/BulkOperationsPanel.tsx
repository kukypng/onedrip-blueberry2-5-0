import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  CreditCard,
  FileText,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import type {
  BulkOperationsPanelProps,
  BulkOperation,
  BulkOperationType
} from '../../types/userLicense';

interface BulkOperationFormData {
  type: BulkOperationType;
  user_ids: string[];
  license_data?: {
    type: string;
    expires_at: string;
    max_devices: number;
    features: string[];
  };
  notes?: string;
}

function BulkOperationForm({ selectedUsers, onSubmit, onCancel }: {
  selectedUsers: string[];
  onSubmit: (data: BulkOperationFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<BulkOperationFormData>({
    type: 'bulk_create',
    user_ids: selectedUsers,
    license_data: {
      type: 'basic',
      expires_at: '',
      max_devices: 1,
      features: []
    },
    notes: ''
  });

  const availableFeatures = [
    'api_access',
    'advanced_analytics',
    'priority_support',
    'custom_branding',
    'bulk_operations',
    'export_data',
    'integrations'
  ];

  const requiresLicenseData = ['bulk_create', 'bulk_renew'].includes(formData.type);

  const handleFeatureToggle = (feature: string) => {
    if (!formData.license_data) return;
    
    setFormData(prev => ({
      ...prev,
      license_data: {
        ...prev.license_data!,
        features: prev.license_data!.features.includes(feature)
          ? prev.license_data!.features.filter(f => f !== feature)
          : [...prev.license_data!.features, feature]
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      license_data: requiresLicenseData ? formData.license_data : undefined
    });
  };

  const getOperationDescription = () => {
    switch (formData.type) {
      case 'bulk_create':
        return 'Criar novas licenças para os usuários selecionados';
      case 'bulk_renew':
        return 'Renovar licenças existentes dos usuários selecionados';
      case 'bulk_suspend':
        return 'Suspender licenças ativas dos usuários selecionados';
      case 'bulk_delete':
        return 'Excluir licenças dos usuários selecionados';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">
            {selectedUsers.length} usuário(s) selecionado(s)
          </span>
        </div>
        <p className="text-sm text-blue-700">
          Esta operação será aplicada a todos os usuários selecionados.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Tipo de Operação</label>
        <Select 
          value={formData.type} 
          onValueChange={(value: BulkOperationType) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bulk_create">Criar Licenças</SelectItem>
            <SelectItem value="bulk_renew">Renovar Licenças</SelectItem>
            <SelectItem value="bulk_suspend">Suspender Licenças</SelectItem>
            <SelectItem value="bulk_delete">Excluir Licenças</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-600 mt-1">{getOperationDescription()}</p>
      </div>

      {requiresLicenseData && formData.license_data && (
        <div className="space-y-4 border rounded-lg p-4">
          <h4 className="font-medium flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Configurações da Licença</span>
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Licença</label>
              <Select 
                value={formData.license_data.type} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  license_data: { ...prev.license_data!, type: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básica</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data de Expiração</label>
              <Input
                type="date"
                value={formData.license_data.expires_at}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  license_data: { ...prev.license_data!, expires_at: e.target.value }
                }))}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Máximo de Dispositivos</label>
            <Input
              type="number"
              min="1"
              value={formData.license_data.max_devices}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                license_data: { ...prev.license_data!, max_devices: parseInt(e.target.value) }
              }))}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Recursos</label>
            <div className="grid grid-cols-2 gap-2">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.license_data!.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded"
                  />
                  <span className="text-sm">{feature.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações sobre esta operação em lote..."
          rows={3}
        />
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Atenção</p>
            <p className="text-sm text-yellow-700">
              Esta operação será executada em {selectedUsers.length} usuário(s). 
              Verifique cuidadosamente as configurações antes de prosseguir.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          <Play className="h-4 w-4 mr-2" />
          Executar Operação
        </Button>
      </div>
    </form>
  );
}

export function BulkOperationsPanel({ selectedUsers, onOperationComplete, onClose }: BulkOperationsPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [operations] = useState<BulkOperation[]>([]);

  const handleOperationSubmit = async (data: BulkOperationFormData) => {
    try {
      console.log('Creating bulk operation:', data);
      // Simulate operation creation
      setShowCreateForm(false);
      if (onOperationComplete) {
        const mockOperation: BulkOperation = {
          id: `op_${Date.now()}`,
          operation_type: data.type,
          user_ids: data.user_ids,
          license_data: data.license_data || {},
          performed_by: 'current_user',
          status: 'pending',
          results: {
            success_count: 0,
            error_count: 0,
            errors: []
          },
          created_at: new Date().toISOString(),
          completed_at: null
        };
        onOperationComplete(mockOperation);
      }
    } catch (error) {
      console.error('Error creating bulk operation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Operações em Lote</h2>
          <p className="text-muted-foreground">
            Gerencie operações em lote para múltiplos usuários
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Nova Operação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Operação em Lote</DialogTitle>
                <DialogDescription>
                  Configure uma nova operação para ser executada em múltiplos usuários
                </DialogDescription>
              </DialogHeader>
              <BulkOperationForm
                selectedUsers={selectedUsers}
                onSubmit={handleOperationSubmit}
                onCancel={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </div>

      {operations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma operação em lote</h3>
            <p className="text-muted-foreground text-center">
              Crie uma nova operação em lote para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Operações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operação</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{operation.operation_type}</p>
                          <p className="text-sm text-gray-500">ID: {operation.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{operation.user_ids.length} usuários</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{operation.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(operation.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}