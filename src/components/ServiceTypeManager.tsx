import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Wrench,
  DollarSign,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServiceTypes, ServiceType } from '@/hooks/useServiceTypes';
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

interface ServiceTypeFormData {
  name: string;
  description: string;
  default_price: number;
  estimated_duration: number;
  is_active: boolean;
}

const initialFormData: ServiceTypeFormData = {
  name: '',
  description: '',
  default_price: 0,
  estimated_duration: 60,
  is_active: true
};

export function ServiceTypeManager() {
  const navigate = useNavigate();
  const {
    serviceTypes,
    loading,
    createServiceType,
    updateServiceType,
    deleteServiceType,
    reorderServiceTypes,
    refreshServiceTypes
  } = useServiceTypes();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [deletingType, setDeletingType] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState<ServiceTypeFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<ServiceTypeFormData>>({});

  useEffect(() => {
    refreshServiceTypes();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<ServiceTypeFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (formData.default_price < 0) {
      errors.default_price = 'Preço deve ser maior ou igual a zero';
    }

    if (formData.estimated_duration <= 0) {
      errors.estimated_duration = 'Duração deve ser maior que zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingType) {
        await updateServiceType(editingType.id, formData);
        toast.success('Tipo de serviço atualizado com sucesso!');
      } else {
        await createServiceType(formData);
        toast.success('Tipo de serviço criado com sucesso!');
      }
      
      handleCloseDialog();
    } catch (error) {
      toast.error('Erro ao salvar tipo de serviço');
    }
  };

  const handleEdit = (serviceType: ServiceType) => {
    setEditingType(serviceType);
    setFormData({
      name: serviceType.name,
      description: serviceType.description || '',
      default_price: serviceType.default_price || 0,
      estimated_duration: serviceType.estimated_duration || 60,
      is_active: serviceType.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingType) return;

    try {
      await deleteServiceType(deletingType.id);
      toast.success('Tipo de serviço excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingType(null);
    } catch (error) {
      toast.error('Erro ao excluir tipo de serviço');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
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
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Tipos de Serviço
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie os tipos de serviço disponíveis
                </p>
              </div>
            </div>
            
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tipo
            </Button>
          </div>
          
          <Separator className="my-6" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Wrench className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Tipos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {serviceTypes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Preço Médio</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPrice(
                      serviceTypes.reduce((acc, type) => acc + (type.default_price || 0), 0) / 
                      (serviceTypes.length || 1)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Duração Média</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatDuration(
                      serviceTypes.reduce((acc, type) => acc + (type.estimated_duration || 0), 0) / 
                      (serviceTypes.length || 1)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Types List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tipos de Serviço</CardTitle>
            <CardDescription>
              Arraste para reordenar os tipos de serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : serviceTypes.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum tipo de serviço cadastrado</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Criar primeiro tipo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceTypes.map((serviceType) => (
                  <div
                    key={serviceType.id}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-lg',
                      'hover:bg-gray-50 transition-colors',
                      !serviceType.is_active && 'opacity-60 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {serviceType.name}
                          </h3>
                          {!serviceType.is_active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        
                        {serviceType.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {serviceType.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2">
                          {serviceType.default_price && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatPrice(serviceType.default_price)}</span>
                            </div>
                          )}
                          
                          {serviceType.estimated_duration && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(serviceType.estimated_duration)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(serviceType)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingType(serviceType);
                          setIsDeleteDialogOpen(true);
                        }}
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
              {editingType ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
            </DialogTitle>
            <DialogDescription>
              {editingType 
                ? 'Atualize as informações do tipo de serviço'
                : 'Crie um novo tipo de serviço para suas ordens'
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
                placeholder="Ex: Reparo de Smartphone"
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
                placeholder="Descreva o tipo de serviço..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_price">Preço Padrão (R$)</Label>
                <Input
                  id="default_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.default_price}
                  onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                  className={formErrors.default_price ? 'border-red-500' : ''}
                />
                {formErrors.default_price && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.default_price}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="estimated_duration">Duração (min)</Label>
                <Input
                  id="estimated_duration"
                  type="number"
                  min="1"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 60 })}
                  className={formErrors.estimated_duration ? 'border-red-500' : ''}
                />
                {formErrors.estimated_duration && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.estimated_duration}
                  </p>
                )}
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
              {editingType ? 'Atualizar' : 'Criar'}
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
              Tem certeza que deseja excluir o tipo de serviço "{deletingType?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingType(null)}>
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