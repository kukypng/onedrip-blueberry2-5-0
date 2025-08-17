import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  CheckCircle,
  Palette,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomStatuses, CustomStatus } from '@/hooks/useCustomStatuses';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomStatusFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
  is_default: boolean;
}

const initialFormData: CustomStatusFormData = {
  name: '',
  description: '',
  color: '#3B82F6',
  icon: 'circle',
  is_active: true,
  is_default: false
};

const availableIcons = [
  { value: 'circle', label: 'Círculo' },
  { value: 'clock', label: 'Relógio' },
  { value: 'play-circle', label: 'Play' },
  { value: 'pause-circle', label: 'Pause' },
  { value: 'check-circle', label: 'Check' },
  { value: 'x-circle', label: 'X' },
  { value: 'alert-circle', label: 'Alerta' },
  { value: 'info', label: 'Info' },
  { value: 'settings', label: 'Configurações' },
  { value: 'package', label: 'Pacote' },
  { value: 'package-check', label: 'Pacote Check' },
  { value: 'archive', label: 'Arquivo' },
  { value: 'star', label: 'Estrela' },
  { value: 'flag', label: 'Bandeira' }
];

const predefinedColors = [
  '#EF4444', // red-500
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6B7280', // gray-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
  '#06B6D4', // cyan-500
  '#8B5A2B', // brown-500
  '#1F2937'  // gray-800
];

export function CustomStatusManager() {
  const navigate = useNavigate();
  const {
    customStatuses,
    loading,
    createCustomStatus,
    updateCustomStatus,
    deleteCustomStatus,
    reorderCustomStatuses,
    refreshCustomStatuses
  } = useCustomStatuses();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CustomStatus | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<CustomStatus | null>(null);
  const [formData, setFormData] = useState<CustomStatusFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<CustomStatusFormData>>({});

  useEffect(() => {
    refreshCustomStatuses();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<CustomStatusFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.color) {
      errors.color = 'Cor é obrigatória';
    }

    if (!formData.icon) {
      errors.icon = 'Ícone é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingStatus) {
        await updateCustomStatus(editingStatus.id, formData);
        toast.success('Status atualizado com sucesso!');
      } else {
        await createCustomStatus(formData);
        toast.success('Status criado com sucesso!');
      }
      
      handleCloseDialog();
    } catch (error) {
      toast.error('Erro ao salvar status');
    }
  };

  const handleEdit = (status: CustomStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      description: status.description || '',
      color: status.color,
      icon: status.icon,
      is_active: status.is_active,
      is_default: status.is_default
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingStatus) return;

    try {
      await deleteCustomStatus(deletingStatus.id);
      toast.success('Status excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingStatus(null);
    } catch (error) {
      toast.error('Erro ao excluir status');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStatus(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleReorder = async (statusId: string, direction: 'up' | 'down') => {
    const currentIndex = customStatuses.findIndex(s => s.id === statusId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= customStatuses.length) return;

    const reorderedStatuses = [...customStatuses];
    const [movedStatus] = reorderedStatuses.splice(currentIndex, 1);
    reorderedStatuses.splice(newIndex, 0, movedStatus);

    const statusIds = reorderedStatuses.map(s => s.id);
    await reorderCustomStatuses(statusIds);
  };

  const getIconComponent = (iconName: string) => {
    try {
      const Icon = require('lucide-react')[iconName.replace('-', '')];
      return Icon ? <Icon className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />;
    } catch {
      return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/service-orders/settings')}
                className="mr-2 hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="p-3 bg-primary/10 rounded-xl">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Status Personalizados
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie status customizados para ordens de serviço
                </p>
              </div>
            </div>
            
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Status
            </Button>
          </div>
          
          <Separator className="my-6" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Status</p>
                  <p className="text-2xl font-bold text-foreground">
                    {customStatuses.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Eye className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Status Ativos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {customStatuses.filter(s => s.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Palette className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Status Padrão</p>
                  <p className="text-2xl font-bold text-foreground">
                    {customStatuses.filter(s => s.is_default).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Status</CardTitle>
            <CardDescription>
              Gerencie a ordem e configurações dos status personalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : customStatuses.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum status personalizado cadastrado</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Criar primeiro status
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {customStatuses.map((status, index) => (
                  <div
                    key={status.id}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-lg',
                      'hover:bg-gray-50 transition-colors',
                      !status.is_active && 'opacity-60 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(status.id, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(status.id, 'down')}
                          disabled={index === customStatuses.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: status.color }}
                      >
                        {getIconComponent(status.icon)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {status.name}
                          </h3>
                          
                          <div className="flex space-x-1">
                            {status.is_default && (
                              <Badge variant="default">Padrão</Badge>
                            )}
                            {!status.is_active && (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </div>
                        </div>
                        
                        {status.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {status.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="text-xs text-gray-500">
                            Ordem: {status.order}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(status)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingStatus(status);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={status.is_default}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Editar Status' : 'Novo Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus 
                ? 'Atualize as informações do status'
                : 'Crie um novo status personalizado'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Em Análise"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {formErrors.name}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva quando usar este status..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Cor *</Label>
                <div className="space-y-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className={cn('h-10', formErrors.color ? 'border-red-500' : '')}
                  />
                  <div className="flex flex-wrap gap-1">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400"
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
                {formErrors.color && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.color}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="icon">Ícone *</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger className={formErrors.icon ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione um ícone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center space-x-2">
                          {getIconComponent(icon.value)}
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.icon && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.icon}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Status Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_default">Status Padrão</Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </div>
            
            {/* Preview */}
            <div className="border rounded-lg p-3">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex items-center space-x-2 mt-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {getIconComponent(formData.icon)}
                </div>
                <span className="font-medium">{formData.name || 'Nome do Status'}</span>
                {formData.is_default && <Badge variant="default">Padrão</Badge>}
                {!formData.is_active && <Badge variant="secondary">Inativo</Badge>}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {editingStatus ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o status "{deletingStatus?.name}"?
              Esta ação não pode ser desfeita e pode afetar ordens de serviço existentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingStatus(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}