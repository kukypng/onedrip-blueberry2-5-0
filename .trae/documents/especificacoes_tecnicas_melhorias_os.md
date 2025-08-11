# Especificações Técnicas - Melhorias Nova Ordem de Serviço

## 1. Arquitetura de Componentes

### 1.1 Estrutura do Wizard Multi-Step

```typescript
// Tipos principais
interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  validation: (data: FormData) => ValidationResult;
  isOptional?: boolean;
}

interface ServiceOrderFormData {
  // Step 1: Cliente
  client: {
    id?: string;
    isNew: boolean;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  
  // Step 2: Dispositivo
  device: {
    type: string;
    brand?: string;
    model: string;
    imei?: string;
    serial?: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    accessories: string[];
  };
  
  // Step 3: Problema
  problem: {
    category: string;
    description: string;
    symptoms: string[];
    customerReported: string;
    urgency: 'low' | 'medium' | 'high' | 'urgent';
    photos?: File[];
  };
  
  // Step 4: Orçamento
  budget: {
    laborCost: number;
    partsCost: number;
    additionalCosts: Array<{name: string; cost: number}>;
    discount: number;
    totalPrice: number;
    paymentMethod?: string;
    isPaid: boolean;
  };
  
  // Step 5: Condições
  conditions: {
    estimatedDays: number;
    deliveryDate?: string;
    warrantyMonths: number;
    specialInstructions?: string;
    requiresApproval: boolean;
  };
}
```

### 1.2 Hook Principal do Wizard

```typescript
export const useServiceOrderWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ServiceOrderFormData>(initialFormData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Auto-save functionality
  const { mutate: autoSave } = useAutoSave();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData && currentStep > 0) {
        autoSave(formData);
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearTimeout(timer);
  }, [formData, currentStep]);
  
  const updateFormData = useCallback((stepData: Partial<ServiceOrderFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  }, []);
  
  const validateCurrentStep = useCallback(() => {
    const step = wizardSteps[currentStep];
    return step.validation(formData);
  }, [currentStep, formData]);
  
  const goToNextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (validation.isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length - 1));
    }
    return validation;
  }, [currentStep, validateCurrentStep]);
  
  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);
  
  const goToStep = useCallback((stepIndex: number) => {
    if (completedSteps.has(stepIndex - 1) || stepIndex === 0) {
      setCurrentStep(stepIndex);
    }
  }, [completedSteps]);
  
  return {
    currentStep,
    formData,
    completedSteps,
    isAutoSaving,
    updateFormData,
    validateCurrentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canGoToStep: (stepIndex: number) => completedSteps.has(stepIndex - 1) || stepIndex === 0
  };
};
```

## 2. Componentes Específicos

### 2.1 Seleção/Criação de Cliente Inline

```typescript
interface InlineClientFormProps {
  onClientSelect: (client: Client) => void;
  onClientCreate: (clientData: CreateClientData) => void;
  existingClients: Client[];
  isLoading?: boolean;
}

export const InlineClientForm: React.FC<InlineClientFormProps> = ({
  onClientSelect,
  onClientCreate,
  existingClients,
  isLoading
}) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientData, setNewClientData] = useState<CreateClientData>({
    name: '',
    phone: '',
    email: ''
  });
  
  const filteredClients = useMemo(() => {
    if (!searchTerm) return existingClients;
    return existingClients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    );
  }, [existingClients, searchTerm]);
  
  const handleCreateClient = async () => {
    const validation = validateClientData(newClientData);
    if (validation.isValid) {
      await onClientCreate(newClientData);
      setMode('select');
      setNewClientData({ name: '', phone: '', email: '' });
    }
  };
  
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cliente
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode(mode === 'select' ? 'create' : 'select')}
          >
            {mode === 'select' ? 'Novo Cliente' : 'Selecionar Existente'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'select' ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar cliente por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onClientSelect(client)}
                >
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {client.phone} {client.email && `• ${client.email}`}
                  </div>
                </div>
              ))}
              
              {filteredClients.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nome *</Label>
                <Input
                  id="clientName"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="clientPhone">Telefone *</Label>
                <Input
                  id="clientPhone"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </div>
            
            <Button onClick={handleCreateClient} className="w-full">
              Criar Cliente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 2.2 Detecção Inteligente de Dispositivo

```typescript
export const useDeviceDetection = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  
  const detectByIMEI = useCallback(async (imei: string) => {
    if (!imei || imei.length < 15) return null;
    
    setIsDetecting(true);
    try {
      // Validar formato IMEI
      if (!validateIMEI(imei)) {
        throw new Error('IMEI inválido');
      }
      
      // Buscar na base local primeiro
      const localResult = await searchLocalDeviceDB(imei);
      if (localResult) {
        return localResult;
      }
      
      // Buscar em API externa
      const externalResult = await fetchDeviceInfo(imei);
      if (externalResult) {
        // Salvar na base local para futuras consultas
        await saveToLocalDeviceDB(imei, externalResult);
        return externalResult;
      }
      
      return null;
    } catch (error) {
      console.error('Erro na detecção de dispositivo:', error);
      toast.error('Não foi possível detectar o dispositivo automaticamente');
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);
  
  const detectByModel = useCallback(async (brand: string, model: string) => {
    setIsDetecting(true);
    try {
      const result = await searchDeviceByModel(brand, model);
      return result;
    } catch (error) {
      console.error('Erro na busca por modelo:', error);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);
  
  return {
    detectByIMEI,
    detectByModel,
    isDetecting
  };
};

// Componente de entrada de dispositivo com detecção
export const DeviceInfoStep: React.FC<StepProps> = ({ formData, onUpdate }) => {
  const { detectByIMEI, isDetecting } = useDeviceDetection();
  const [deviceSuggestions, setDeviceSuggestions] = useState<DeviceInfo[]>([]);
  
  const handleIMEIChange = async (imei: string) => {
    onUpdate({ device: { ...formData.device, imei } });
    
    if (imei.length === 15) {
      const deviceInfo = await detectByIMEI(imei);
      if (deviceInfo) {
        onUpdate({
          device: {
            ...formData.device,
            brand: deviceInfo.brand,
            model: deviceInfo.model,
            type: deviceInfo.type
          }
        });
        
        toast.success(`Dispositivo detectado: ${deviceInfo.brand} ${deviceInfo.model}`);
      }
    }
  };
  
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Informações do Dispositivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="imei">IMEI/Número de Série</Label>
          <div className="relative">
            <Input
              id="imei"
              value={formData.device.imei || ''}
              onChange={(e) => handleIMEIChange(e.target.value)}
              placeholder="Digite o IMEI para detecção automática"
              maxLength={15}
            />
            {isDetecting && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            O IMEI será usado para detectar automaticamente marca e modelo
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deviceType">Tipo de Dispositivo *</Label>
            <Select
              value={formData.device.type}
              onValueChange={(value) => onUpdate({ device: { ...formData.device, type: value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smartphone">Smartphone</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="notebook">Notebook</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="smartwatch">Smartwatch</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deviceBrand">Marca</Label>
            <Input
              id="deviceBrand"
              value={formData.device.brand || ''}
              onChange={(e) => onUpdate({ device: { ...formData.device, brand: e.target.value } })}
              placeholder="Ex: Apple, Samsung, Xiaomi"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="deviceModel">Modelo *</Label>
          <Input
            id="deviceModel"
            value={formData.device.model}
            onChange={(e) => onUpdate({ device: { ...formData.device, model: e.target.value } })}
            placeholder="Ex: iPhone 14 Pro, Galaxy S23 Ultra"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="deviceCondition">Estado do Dispositivo</Label>
          <Select
            value={formData.device.condition}
            onValueChange={(value) => onUpdate({ device: { ...formData.device, condition: value as any } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excelente</SelectItem>
              <SelectItem value="good">Bom</SelectItem>
              <SelectItem value="fair">Regular</SelectItem>
              <SelectItem value="poor">Ruim</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Acessórios Inclusos</Label>
          <div className="grid grid-cols-2 gap-2">
            {['Carregador', 'Fone de Ouvido', 'Capa', 'Película', 'Caixa', 'Manual'].map(accessory => (
              <label key={accessory} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.device.accessories?.includes(accessory) || false}
                  onChange={(e) => {
                    const accessories = formData.device.accessories || [];
                    const newAccessories = e.target.checked
                      ? [...accessories, accessory]
                      : accessories.filter(a => a !== accessory);
                    onUpdate({ device: { ...formData.device, accessories: newAccessories } });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{accessory}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 3. Sistema de Templates

### 3.1 Estrutura de Templates

```typescript
interface ServiceTemplate {
  id: string;
  name: string;
  deviceTypes: string[];
  problemCategories: string[];
  estimatedHours: number;
  baseLaborCost: number;
  commonParts: Array<{
    name: string;
    partNumber?: string;
    estimatedCost: number;
    isOptional: boolean;
  }>;
  description: string;
  instructions: string[];
  warrantyMonths: number;
  tags: string[];
}

export const useServiceTemplates = () => {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['service-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ServiceTemplate[];
    }
  });
  
  const findTemplates = useCallback((deviceType: string, problemCategory?: string) => {
    if (!templates) return [];
    
    return templates.filter(template => {
      const matchesDevice = template.deviceTypes.includes(deviceType) || template.deviceTypes.includes('all');
      const matchesProblem = !problemCategory || template.problemCategories.includes(problemCategory);
      return matchesDevice && matchesProblem;
    });
  }, [templates]);
  
  const applyTemplate = useCallback((template: ServiceTemplate, currentFormData: ServiceOrderFormData) => {
    return {
      ...currentFormData,
      problem: {
        ...currentFormData.problem,
        category: template.problemCategories[0],
        description: template.description
      },
      budget: {
        ...currentFormData.budget,
        laborCost: template.baseLaborCost,
        partsCost: template.commonParts.reduce((sum, part) => sum + part.estimatedCost, 0),
        totalPrice: template.baseLaborCost + template.commonParts.reduce((sum, part) => sum + part.estimatedCost, 0)
      },
      conditions: {
        ...currentFormData.conditions,
        estimatedDays: Math.ceil(template.estimatedHours / 8),
        warrantyMonths: template.warrantyMonths
      }
    };
  }, []);
  
  return {
    templates,
    isLoading,
    findTemplates,
    applyTemplate
  };
};
```

## 4. Validações Avançadas

### 4.1 Validação de IMEI

```typescript
export const validateIMEI = (imei: string): boolean => {
  // Remove espaços e caracteres não numéricos
  const cleanIMEI = imei.replace(/\D/g, '');
  
  // Verificar comprimento
  if (cleanIMEI.length !== 15) return false;
  
  // Algoritmo de Luhn para validação
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleanIMEI[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleanIMEI[14]);
};

export const checkIMEIBlacklist = async (imei: string): Promise<{isBlacklisted: boolean; reason?: string}> => {
  try {
    // Verificar na base local primeiro
    const { data: localCheck } = await supabase
      .from('blacklisted_devices')
      .select('reason')
      .eq('imei', imei)
      .single();
    
    if (localCheck) {
      return { isBlacklisted: true, reason: localCheck.reason };
    }
    
    // Verificar em API externa (se disponível)
    // const externalCheck = await checkExternalBlacklist(imei);
    
    return { isBlacklisted: false };
  } catch (error) {
    console.error('Erro ao verificar blacklist:', error);
    return { isBlacklisted: false };
  }
};
```

### 4.2 Validação de Orçamento

```typescript
export const useBudgetValidation = () => {
  const validateBudget = useCallback(async (budgetData: ServiceOrderFormData['budget'], deviceType: string) => {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Buscar preços de referência
    const { data: priceReference } = await supabase
      .from('price_references')
      .select('*')
      .eq('device_type', deviceType)
      .single();
    
    if (priceReference) {
      // Verificar se o preço está muito abaixo da média
      if (budgetData.totalPrice < priceReference.min_price * 0.7) {
        warnings.push(`Preço muito abaixo da média para ${deviceType} (mín: R$ ${priceReference.min_price})`);
      }
      
      // Verificar se o preço está muito acima da média
      if (budgetData.totalPrice > priceReference.max_price * 1.3) {
        warnings.push(`Preço muito acima da média para ${deviceType} (máx: R$ ${priceReference.max_price})`);
      }
    }
    
    // Verificar margem de lucro mínima
    const totalCost = budgetData.laborCost + budgetData.partsCost;
    const profit = budgetData.totalPrice - totalCost;
    const profitMargin = (profit / budgetData.totalPrice) * 100;
    
    if (profitMargin < 20) {
      warnings.push(`Margem de lucro baixa: ${profitMargin.toFixed(1)}% (recomendado: mín. 20%)`);
    }
    
    // Verificar desconto máximo
    if (budgetData.discount > budgetData.totalPrice * 0.3) {
      errors.push('Desconto não pode ser superior a 30% do valor total');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);
  
  return { validateBudget };
};
```

## 5. Sistema de Auto-Save

```typescript
export const useAutoSave = () => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { mutate: saveToLocal } = useMutation({
    mutationFn: async (data: ServiceOrderFormData) => {
      const key = `service-order-draft-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
      return key;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('Erro no auto-save:', error);
      setIsSaving(false);
    }
  });
  
  const { mutate: saveToServer } = useMutation({
    mutationFn: async (data: ServiceOrderFormData) => {
      const { error } = await supabase
        .from('service_order_drafts')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          draft_data: data,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
    }
  });
  
  const autoSave = useCallback((data: ServiceOrderFormData) => {
    setIsSaving(true);
    
    // Salvar localmente primeiro (mais rápido)
    saveToLocal(data);
    
    // Depois salvar no servidor (com debounce)
    const timer = setTimeout(() => {
      saveToServer(data);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [saveToLocal, saveToServer]);
  
  const loadDraft = useCallback(async (): Promise<ServiceOrderFormData | null> => {
    try {
      // Tentar carregar do servidor primeiro
      const { data: serverDraft } = await supabase
        .from('service_order_drafts')
        .select('draft_data, updated_at')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (serverDraft) {
        return serverDraft.draft_data as ServiceOrderFormData;
      }
      
      // Fallback para localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('service-order-draft-'));
      if (keys.length > 0) {
        const latestKey = keys.sort().pop();
        const draft = JSON.parse(localStorage.getItem(latestKey!) || '{}');
        return draft.data as ServiceOrderFormData;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
      return null;
    }
  }, []);
  
  return {
    autoSave,
    loadDraft,
    lastSaved,
    isSaving
  };
};
```

## 6. Integração com WhatsApp

```typescript
export const useWhatsAppIntegration = () => {
  const sendOrderConfirmation = useCallback(async (serviceOrder: ServiceOrder, client: Client) => {
    const message = `
🔧 *Ordem de Serviço Criada*

📋 *Número:* ${serviceOrder.id.slice(-8).toUpperCase()}
👤 *Cliente:* ${client.name}
📱 *Dispositivo:* ${serviceOrder.device_model}
🔍 *Problema:* ${serviceOrder.reported_issue}
💰 *Valor:* R$ ${serviceOrder.total_price?.toFixed(2)}
⏰ *Prazo Estimado:* ${serviceOrder.estimated_completion_date}

✅ Sua ordem foi registrada com sucesso!
Você receberá atualizações sobre o andamento do reparo.
    `.trim();
    
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.phone,
          message,
          type: 'service_order_confirmation'
        })
      });
      
      if (!response.ok) throw new Error('Falha no envio');
      
      // Registrar o envio
      await supabase.from('whatsapp_messages').insert({
        service_order_id: serviceOrder.id,
        client_id: client.id,
        message_type: 'confirmation',
        message_content: message,
        sent_at: new Date().toISOString()
      });
      
      toast.success('Confirmação enviada via WhatsApp');
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast.error('Não foi possível enviar confirmação via WhatsApp');
    }
  }, []);
  
  const sendStatusUpdate = useCallback(async (serviceOrder: ServiceOrder, newStatus: string, client: Client) => {
    const statusMessages = {
      'in_progress': '🔧 Seu dispositivo está sendo reparado',
      'waiting_parts': '⏳ Aguardando chegada de peças',
      'ready': '✅ Seu dispositivo está pronto para retirada!',
      'delivered': '📦 Dispositivo entregue com sucesso'
    };
    
    const message = `
📋 *Atualização da OS ${serviceOrder.id.slice(-8).toUpperCase()}*

${statusMessages[newStatus as keyof typeof statusMessages] || `Status atualizado para: ${newStatus}`}

📱 *Dispositivo:* ${serviceOrder.device_model}

${newStatus === 'ready' ? '🏪 Você pode retirar seu dispositivo em nosso estabelecimento.' : ''}
    `.trim();
    
    // Similar implementation to sendOrderConfirmation
  }, []);
  
  return {
    sendOrderConfirmation,
    sendStatusUpdate
  };
};
```

## 7. Métricas e Analytics

```typescript
export const useServiceOrderAnalytics = () => {
  const trackFormStep = useCallback((step: number, stepName: string, timeSpent: number) => {
    // Enviar para analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_step_completed', {
        step_number: step,
        step_name: stepName,
        time_spent_seconds: timeSpent
      });
    }
  }, []);
  
  const trackFormAbandonment = useCallback((step: number, reason?: string) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_abandoned', {
        step_number: step,
        abandonment_reason: reason || 'unknown'
      });
    }
  }, []);
  
  const trackFormCompletion = useCallback((totalTime: number, stepsCompleted: number) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'service_order_created', {
        total_time_seconds: totalTime,
        steps_completed: stepsCompleted,
        completion_rate: (stepsCompleted / 5) * 100
      });
    }
  }, []);
  
  return {
    trackFormStep,
    trackFormAbandonment,
    trackFormCompletion
  };
};
```

Esta especificação técnica fornece a base completa para implementar todas as melhorias propostas no documento principal, com código TypeScript/React detalhado e padrões de arquitetura modernos.