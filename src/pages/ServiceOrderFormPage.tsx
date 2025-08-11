/**
 * Página de Formulário de Ordem de Serviço (Beta)
 * Sistema Oliver Blueberry - Mobile First Design
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ValidatedInput, ValidatedTextarea, PhoneInput, IMEIInput, CurrencyInput } from '@/components/ui/validated-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AutoSaveIndicatorCompact } from '@/components/ui/auto-save-indicator';
import {
  ArrowLeft,
  Save,
  Wrench,
  User,
  Smartphone,
  DollarSign,
  AlertCircle,
  Phone,
  Calendar,
  FileText
} from 'lucide-react';
import { useSecureServiceOrders, useServiceOrderDetails } from '@/hooks/useSecureServiceOrders';
import { useFormAutoSave } from '@/hooks/useAutoSave';
import { useServiceOrderValidation } from '@/hooks/useFormValidation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Enums, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ServiceOrderStatus = Enums<'service_order_status'>;
type ServiceOrderPriority = Enums<'service_order_priority'>;

interface FormData {
  // Client Information (will be stored in clients table)
  clientId: string;
  
  // Device Information
  deviceType: string;
  deviceModel: string;
  imeiSerial: string;
  
  // Service Information
  reportedIssue: string;
  priority: ServiceOrderPriority;
  laborCost: string;
  partsCost: string;
  totalPrice: string;
  warrantyMonths: string;
  
  // Additional Information
  notes: string;
  isPaid: boolean;
  deliveryDate: string;
}

export const ServiceOrderFormPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // Check if user has beta access
  const hasBetaAccess = profile?.service_orders_beta_enabled || false;
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    deviceType: '',
    deviceModel: '',
    imeiSerial: '',
    reportedIssue: '',
    priority: 'medium',
    laborCost: '',
    partsCost: '',
    totalPrice: '',
    warrantyMonths: '',
    notes: '',
    isPaid: false,
    deliveryDate: ''
  });

  // Form validation
  const validation = useServiceOrderValidation(formData);

  // Auto-save functionality
  const autoSaveKey = isEditMode ? `service-order-edit-${id}` : 'service-order-new';
  const autoSave = useFormAutoSave(formData, autoSaveKey, {
    enabled: !isEditMode, // Only auto-save for new orders
    onRestore: (savedData) => {
      setFormData(savedData);
      validation.setFormValues(savedData);
      if (savedData.clientId) {
        setSelectedClientId(savedData.clientId);
      }
      toast.success('Dados restaurados do rascunho salvo');
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
    }
  });

  // Hooks
  const { createServiceOrder, updateServiceOrder, isCreating, isUpdating } = useSecureServiceOrders(user?.id);
  const { data: serviceOrderDetails, isLoading: isLoadingDetails } = useServiceOrderDetails(id);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load device types and clients in parallel
        const [typesResult, clientsResult] = await Promise.all([
          supabase.from('device_types').select('*').order('name'),
          supabase.from('clients')
            .select('id, name, phone, email')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
        ]);

        if (typesResult.error) {
          console.error('Error loading device types:', typesResult.error);
          toast.error('Erro ao carregar tipos de dispositivo');
        } else if (typesResult.data) {
          setDeviceTypes(typesResult.data);
        }

        if (clientsResult.error) {
          console.error('Error loading clients:', clientsResult.error);
          toast.error('Erro ao carregar clientes');
        } else if (clientsResult.data) {
          setExistingClients(clientsResult.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados do formulário');
      }
    };

    loadData();
  }, []);

  // Load service order data for editing
  useEffect(() => {
    if (isEditMode && serviceOrderDetails) {
      setFormData({
        clientId: serviceOrderDetails.client_id || '',
        deviceType: serviceOrderDetails.device_type || '',
        deviceModel: serviceOrderDetails.device_model || '',
        imeiSerial: serviceOrderDetails.imei_serial || '',
        reportedIssue: serviceOrderDetails.reported_issue || '',
        priority: (serviceOrderDetails.priority as ServiceOrderPriority) || 'medium',
        laborCost: serviceOrderDetails.labor_cost ? serviceOrderDetails.labor_cost.toString() : '',
        partsCost: serviceOrderDetails.parts_cost ? serviceOrderDetails.parts_cost.toString() : '',
        totalPrice: serviceOrderDetails.total_price ? serviceOrderDetails.total_price.toString() : '',
        warrantyMonths: serviceOrderDetails.warranty_months ? serviceOrderDetails.warranty_months.toString() : '',
        notes: serviceOrderDetails.notes || '',
        isPaid: serviceOrderDetails.is_paid || false,
        deliveryDate: serviceOrderDetails.delivery_date || ''
      });
    }
  }, [isEditMode, serviceOrderDetails]);

  // Helper functions
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    validation.updateField(field, value);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'new') {
      // Clear fields for new client
      updateFormData('clientId', '');
    } else if (clientId) {
      // Set selected client ID
      updateFormData('clientId', clientId);
    }
  };

  const validateForm = (): boolean => {
    // Validate required fields first
    if (!formData.clientId) {
      toast.error('Cliente é obrigatório. Selecione um cliente existente.');
      return false;
    }
    if (!formData.deviceType) {
      toast.error('Tipo de dispositivo é obrigatório');
      return false;
    }
    
    // Run form validation
    const isValid = validation.validateAll();
    
    if (!isValid) {
      const firstError = Object.entries(validation.validationState)
        .find(([_, state]) => !state.isValid)?.[1]?.error;
      
      if (firstError) {
        toast.error(firstError);
      } else {
        toast.error('Por favor, corrija os erros no formulário');
      }
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Usuário não encontrado. Faça login novamente.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const laborCostValue = parseFloat(formData.laborCost) || 0;
      const partsCostValue = parseFloat(formData.partsCost) || 0;
      const totalPriceValue = parseFloat(formData.totalPrice) || (laborCostValue + partsCostValue);
      const warrantyMonthsValue = parseInt(formData.warrantyMonths) || null;

      if (isEditMode && id) {
        // Update existing service order
        const updateData: TablesUpdate<'service_orders'> = {
          client_id: formData.clientId || null,
          device_type: formData.deviceType,
          device_model: formData.deviceModel.trim(),
          imei_serial: formData.imeiSerial.trim() || null,
          reported_issue: formData.reportedIssue.trim(),
          priority: formData.priority,
          labor_cost: laborCostValue,
          parts_cost: partsCostValue,
          total_price: totalPriceValue,
          warranty_months: warrantyMonthsValue,
          notes: formData.notes.trim() || null,
          is_paid: formData.isPaid,
          delivery_date: formData.deliveryDate || null,
          updated_at: new Date().toISOString()
        };

        updateServiceOrder({ id, data: updateData });
      } else {
        // Create new service order
        const createData: TablesInsert<'service_orders'> = {
          client_id: formData.clientId || null,
          device_type: formData.deviceType,
          device_model: formData.deviceModel.trim(),
          imei_serial: formData.imeiSerial.trim() || null,
          reported_issue: formData.reportedIssue.trim(),
          priority: formData.priority,
          status: 'opened',
          labor_cost: laborCostValue,
          parts_cost: partsCostValue,
          total_price: totalPriceValue,
          warranty_months: warrantyMonthsValue,
          notes: formData.notes.trim() || null,
          is_paid: formData.isPaid,
          delivery_date: formData.deliveryDate || null
        };

        createServiceOrder(createData);
      }

      // Clear auto-saved data on successful submission
        if (!isEditMode) {
          autoSave.clearSavedData();
        }
        
        // Navigate back to list after successful submission
        setTimeout(() => {
          navigate('/service-orders');
        }, 1000);

    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Tratamento específico de erros
      let errorMessage = 'Erro ao salvar ordem de serviço';
      
      if (error?.message) {
        if (error.message.includes('client_id')) {
          errorMessage = 'Cliente inválido. Selecione um cliente válido.';
        } else if (error.message.includes('device_type')) {
          errorMessage = 'Tipo de dispositivo inválido.';
        } else if (error.message.includes('owner_id')) {
          errorMessage = 'Erro de autenticação. Faça login novamente.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Você não tem permissão para realizar esta ação.';
        } else if (error.message.includes('violates foreign key')) {
          errorMessage = 'Dados relacionados inválidos. Verifique cliente e tipo de dispositivo.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você precisa estar logado para acessar esta página.</p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  // Check beta access
  if (!hasBetaAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Ordens de Serviço (Beta)</h1>
          <p className="text-muted-foreground mb-6">
            Esta funcionalidade está em fase beta. Entre em contato com o suporte para solicitar acesso.
          </p>
          <Button onClick={() => navigate('/service-orders')} className="w-full">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (isEditMode && isLoadingDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (autoSave.hasUnsavedChanges) {
                  const confirmLeave = window.confirm(
                    'Você tem alterações não salvas. Deseja realmente sair?'
                  );
                  if (!confirmLeave) return;
                  autoSave.clearSavedData();
                }
                navigate('/service-orders');
              }}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {isEditMode ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditMode ? 'Atualize as informações da ordem' : 'Preencha os dados para criar uma nova ordem'}
              </p>
            </div>
            {!isEditMode && (
              <AutoSaveIndicatorCompact
                isSaving={autoSave.isSaving}
                lastSaved={autoSave.lastSaved}
                hasUnsavedChanges={autoSave.hasUnsavedChanges}
                error={autoSave.error}
              />
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Client Selection */}
              <div className="space-y-2">
                <Label>Cliente *</Label>
                {existingClients.length > 0 ? (
                  <Select value={selectedClientId} onValueChange={handleSelectClient}>
                    <SelectTrigger className={!formData.clientId ? "border-red-300" : ""}>
                      <SelectValue placeholder="Selecionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Criar Novo Cliente</SelectItem>
                      {existingClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.phone && `- ${client.phone}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      Nenhum cliente encontrado. Você precisa criar um cliente primeiro.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/clients/new')}
                    >
                      Criar Primeiro Cliente
                    </Button>
                  </div>
                )}
                {!formData.clientId && existingClients.length > 0 && (
                  <p className="text-sm text-red-600">Cliente é obrigatório</p>
                )}
              </div>


            </CardContent>
          </Card>

          {/* Device Information */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Informações do Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceType">Tipo de Dispositivo *</Label>
                <Select value={formData.deviceType} onValueChange={(value) => updateFormData('deviceType', value)}>
                  <SelectTrigger className={!formData.deviceType ? "border-red-300" : ""}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        Carregando tipos de dispositivo...
                      </SelectItem>
                    ) : (
                      deviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!formData.deviceType && (
                  <p className="text-sm text-red-600">Tipo de dispositivo é obrigatório</p>
                )}
              </div>

              <ValidatedInput
                label="Modelo do Dispositivo"
                value={formData.deviceModel}
                onChange={(value) => updateFormData('deviceModel', value)}
                onBlur={() => validation.touchField('deviceModel')}
                placeholder="Ex: iPhone 14 Pro, Samsung Galaxy S23"
                required
                error={validation.getFieldError('deviceModel')}
                isValid={validation.isFieldValid('deviceModel')}
                touched={validation.isFieldTouched('deviceModel')}
                description="Informe o modelo exato do dispositivo"
              />

              <IMEIInput
                label="Número de Série/IMEI"
                value={formData.imeiSerial}
                onChange={(value) => updateFormData('imeiSerial', value)}
                onBlur={() => validation.touchField('imeiSerial')}
                error={validation.getFieldError('imeiSerial')}
                isValid={validation.isFieldValid('imeiSerial')}
                touched={validation.isFieldTouched('imeiSerial')}
                description="IMEI de 15 dígitos ou número de série"
              />
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Informações do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ValidatedTextarea
                label="Descrição do Problema"
                value={formData.reportedIssue}
                onChange={(value) => updateFormData('reportedIssue', value)}
                onBlur={() => validation.touchField('reportedIssue')}
                placeholder="Descreva detalhadamente o problema relatado pelo cliente"
                rows={4}
                required
                error={validation.getFieldError('reportedIssue')}
                isValid={validation.isFieldValid('reportedIssue')}
                touched={validation.isFieldTouched('reportedIssue')}
                description="Mínimo de 10 caracteres para uma descrição adequada"
                maxLength={1000}
              />

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value as ServiceOrderPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CurrencyInput
                  label="Custo Mão de Obra (R$)"
                  value={formData.laborCost}
                  onChange={(value) => updateFormData('laborCost', value)}
                  onBlur={() => validation.touchField('laborCost')}
                  error={validation.getFieldError('laborCost')}
                  isValid={validation.isFieldValid('laborCost')}
                  touched={validation.isFieldTouched('laborCost')}
                  description="Valor da mão de obra"
                />

                <CurrencyInput
                  label="Custo Peças (R$)"
                  value={formData.partsCost}
                  onChange={(value) => updateFormData('partsCost', value)}
                  onBlur={() => validation.touchField('partsCost')}
                  error={validation.getFieldError('partsCost')}
                  isValid={validation.isFieldValid('partsCost')}
                  touched={validation.isFieldTouched('partsCost')}
                  description="Valor das peças"
                />

                <CurrencyInput
                  label="Preço Total (R$)"
                  value={formData.totalPrice}
                  onChange={(value) => updateFormData('totalPrice', value)}
                  onBlur={() => validation.touchField('totalPrice')}
                  error={validation.getFieldError('totalPrice')}
                  isValid={validation.isFieldValid('totalPrice')}
                  touched={validation.isFieldTouched('totalPrice')}
                  description="Valor total do serviço"
                />
              </div>

              <ValidatedTextarea
                label="Observações Adicionais"
                value={formData.notes}
                onChange={(value) => updateFormData('notes', value)}
                placeholder="Informações adicionais sobre o serviço"
                rows={3}
                description="Informações extras que podem ser úteis"
                maxLength={500}
              />
            </CardContent>
          </Card>

          {/* Payment and Delivery */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pagamento e Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pagamento Realizado</Label>
                  <p className="text-sm text-muted-foreground">
                    Marque se o pagamento já foi efetuado
                  </p>
                </div>
                <Switch
                  checked={formData.isPaid}
                  onCheckedChange={(checked) => updateFormData('isPaid', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  label="Data de Entrega"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(value) => updateFormData('deliveryDate', value)}
                  description="Data prevista para entrega"
                />

                <ValidatedInput
                  label="Garantia (meses)"
                  type="number"
                  value={formData.warrantyMonths}
                  onChange={(value) => updateFormData('warrantyMonths', value)}
                  onBlur={() => validation.touchField('warrantyMonths')}
                  placeholder="Ex: 12"
                  min={0}
                  max={60}
                  error={validation.getFieldError('warrantyMonths')}
                  isValid={validation.isFieldValid('warrantyMonths')}
                  touched={validation.isFieldTouched('warrantyMonths')}
                  description="Período de garantia em meses (máx: 60)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 -mx-4">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isSubmitting || isCreating || isUpdating}
            >
              {isSubmitting || isCreating || isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {isEditMode ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Atualizar Ordem' : 'Criar Ordem de Serviço'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};