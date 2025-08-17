import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Phone, 
  Save, 
  TestTube, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Smartphone,
  Globe,
  Settings,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWhatsAppSettings, WhatsAppSettings as WhatsAppSettingsType } from '@/hooks/useWhatsAppSettings';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WhatsAppFormData {
  phone_number: string;
  message_template: string;
  is_enabled: boolean;
  auto_open: boolean;
  country_code: string;
}

const initialFormData: WhatsAppFormData = {
  phone_number: '',
  message_template: 'Olá! Aqui está o link da sua ordem de serviço: {link}',
  is_enabled: true,
  auto_open: false,
  country_code: '+55'
};

const countryCodes = [
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colômbia', flag: '🇨🇴' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+598', country: 'Uruguai', flag: '🇺🇾' },
  { code: '+595', country: 'Paraguai', flag: '🇵🇾' },
  { code: '+591', country: 'Bolívia', flag: '🇧🇴' },
  { code: '+593', country: 'Equador', flag: '🇪🇨' }
];

const messageVariables = [
  { variable: '{link}', description: 'Link da ordem de serviço' },
  { variable: '{order_id}', description: 'ID da ordem de serviço' },
  { variable: '{customer_name}', description: 'Nome do cliente' },
  { variable: '{service_type}', description: 'Tipo de serviço' },
  { variable: '{status}', description: 'Status atual' },
  { variable: '{company_name}', description: 'Nome da empresa' },
  { variable: '{date}', description: 'Data atual' }
];

export function WhatsAppSettings() {
  const navigate = useNavigate();
  const {
    settings,
    loading,
    createSettings,
    updateSettings,
    formatPhoneNumber,
    validatePhoneNumber,
    generateShareLink,
    openWhatsApp,
    refreshSettings
  } = useWhatsAppSettings();

  const [formData, setFormData] = useState<WhatsAppFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<WhatsAppFormData>>({});
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        phone_number: settings.phone_number || '',
        message_template: settings.message_template || initialFormData.message_template,
        is_enabled: settings.is_enabled ?? true,
        auto_open: settings.auto_open ?? false,
        country_code: settings.country_code || '+55'
      });
    }
  }, [settings]);

  const validateForm = (): boolean => {
    const errors: Partial<WhatsAppFormData> = {};

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Número de telefone é obrigatório';
    } else if (!validatePhoneNumber(formData.phone_number)) {
      errors.phone_number = 'Número de telefone inválido';
    }

    if (!formData.message_template.trim()) {
      errors.message_template = 'Template de mensagem é obrigatório';
    } else if (!formData.message_template.includes('{link}')) {
      errors.message_template = 'Template deve conter a variável {link}';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const formattedPhone = formatPhoneNumber(formData.phone_number);
      const dataToSave = {
        ...formData,
        phone_number: formattedPhone
      };

      if (settings) {
        await updateSettings(dataToSave);
        toast.success('Configurações atualizadas com sucesso!');
      } else {
        await createSettings(dataToSave);
        toast.success('Configurações criadas com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite um número para teste');
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(testPhone);
      const message = testMessage || 'Teste de configuração do WhatsApp';
      
      await openWhatsApp(formattedPhone, message);
      toast.success('WhatsApp aberto com sucesso!');
      setIsTestDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao abrir WhatsApp');
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message_template') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.message_template;
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      setFormData({ ...formData, message_template: newText });
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const previewMessage = () => {
    return formData.message_template
      .replace('{link}', 'https://exemplo.com/share/service-order/abc123')
      .replace('{order_id}', 'OS-001')
      .replace('{customer_name}', 'João Silva')
      .replace('{service_type}', 'Manutenção')
      .replace('{status}', 'Em Andamento')
      .replace('{company_name}', 'Minha Empresa')
      .replace('{date}', new Date().toLocaleDateString('pt-BR'));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
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
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Configurações WhatsApp
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure o compartilhamento via WhatsApp
              </p>
            </div>
          </div>
          
          <Separator className="my-6" />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status WhatsApp</p>
                <p className="text-lg font-semibold text-foreground">
                  {formData.is_enabled ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Número Configurado</p>
                <p className="text-lg font-semibold text-foreground">
                  {formData.phone_number || 'Não configurado'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Configurações Gerais</span>
              </CardTitle>
              <CardDescription>
                Configure as informações básicas do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_enabled">Habilitar WhatsApp</Label>
                  <p className="text-sm text-gray-600">
                    Ativar compartilhamento via WhatsApp
                  </p>
                </div>
                <Switch
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
              </div>
              
              <Separator />
              
              {/* Phone Configuration */}
              <div className="space-y-4">
                <Label>Número do WhatsApp</Label>
                
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={formData.country_code}
                    onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center space-x-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="col-span-2">
                    <Input
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="11999999999"
                      className={formErrors.phone_number ? 'border-red-500' : ''}
                    />
                  </div>
                </div>
                
                {formErrors.phone_number && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.phone_number}
                  </p>
                )}
                
                <p className="text-xs text-gray-500">
                  Digite apenas números, sem espaços ou caracteres especiais
                </p>
              </div>
              
              <Separator />
              
              {/* Auto Open */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_open">Abrir Automaticamente</Label>
                  <p className="text-sm text-gray-600">
                    Abrir WhatsApp automaticamente ao compartilhar
                  </p>
                </div>
                <Switch
                  id="auto_open"
                  checked={formData.auto_open}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_open: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Message Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Template de Mensagem</span>
              </CardTitle>
              <CardDescription>
                Personalize a mensagem enviada via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message_template">Mensagem</Label>
                <Textarea
                  id="message_template"
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  className={formErrors.message_template ? 'border-red-500' : ''}
                />
                {formErrors.message_template && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.message_template}
                  </p>
                )}
              </div>
              
              {/* Variables */}
              <div>
                <Label className="text-sm font-medium">Variáveis Disponíveis</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {messageVariables.map((variable) => (
                    <Button
                      key={variable.variable}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.variable)}
                      className="justify-start text-xs h-8"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {variable.variable}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Clique nas variáveis para inserir na mensagem
                </p>
              </div>
              
              {/* Preview */}
              <div className="border rounded-lg p-3 bg-gray-50">
                <Label className="text-sm font-medium">Preview da Mensagem</Label>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                  {previewMessage()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => {
              setTestPhone(formData.phone_number);
              setTestMessage(previewMessage());
              setIsTestDialogOpen(true);
            }}
            disabled={!formData.phone_number || !formData.is_enabled}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Testar WhatsApp
          </Button>
          
          <Button onClick={handleSubmit} disabled={isSaving || loading}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>

      {/* Test Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Testar WhatsApp</DialogTitle>
            <DialogDescription>
              Envie uma mensagem de teste para verificar as configurações
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="test_phone">Número para Teste</Label>
              <Input
                id="test_phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="11999999999"
              />
            </div>
            
            <div>
              <Label htmlFor="test_message">Mensagem de Teste</Label>
              <Textarea
                id="test_message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTestWhatsApp}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}