import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Key,
  Calendar,
  User,
  RefreshCw,
  Copy,
  Shuffle,
  Save,
  Clock,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';

interface License {
  id: string;
  code: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  activated_at: string | null;
  last_validation: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface LicenseEditModalProps {
  license: License | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseEditModal = ({ license, isOpen, onClose }: LicenseEditModalProps) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [extensionDays, setExtensionDays] = useState('30');
  const [activeTab, setActiveTab] = useState('edit');
  
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for transfer functionality
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_all_users');
      if (error) throw error;
      return data as User[];
    },
    enabled: isOpen
  });

  // Initialize form data when license changes
  useEffect(() => {
    if (license) {
      setLicenseCode(license.code);
      setExpirationDate(license.expires_at ? 
        new Date(license.expires_at).toISOString().slice(0, 16) : '');
      setIsActive(license.is_active);
      setSelectedUserId(license.user_id || '');
      setNotes('');
    }
  }, [license]);

  // Generate new license code
  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setLicenseCode(result);
  };

  // Copy license code to clipboard
  const copyLicenseCode = () => {
    navigator.clipboard.writeText(licenseCode);
    showSuccess({
      title: 'Copiado!',
      description: 'Código da licença copiado para a área de transferência.'
    });
  };

  // Update license mutation
  const updateLicenseMutation = useMutation({
    mutationFn: async (data: {
      licenseId: string;
      code: string;
      expiresAt: string | null;
      isActive: boolean;
      userId: string | null;
      notes: string;
    }) => {
      const { error } = await supabase.rpc('admin_update_license', {
        p_license_id: data.licenseId,
        p_code: data.code,
        p_expires_at: data.expiresAt,
        p_is_active: data.isActive,
        p_user_id: data.userId,
        p_notes: data.notes
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Licença Atualizada!',
        description: 'As alterações foram salvas com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
      onClose();
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Atualizar',
        description: error.message
      });
    }
  });

  // Extend license mutation
  const extendLicenseMutation = useMutation({
    mutationFn: async (data: { licenseId: string; days: number; notes: string }) => {
      const { error } = await supabase.rpc('admin_extend_license', {
        p_license_id: data.licenseId,
        p_additional_days: data.days,
        p_notes: data.notes
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Licença Estendida!',
        description: `Licença estendida por ${extensionDays} dias.`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
      onClose();
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Estender',
        description: error.message
      });
    }
  });

  // Transfer license mutation
  const transferLicenseMutation = useMutation({
    mutationFn: async (data: { licenseId: string; newUserId: string; notes: string }) => {
      const { error } = await supabase.rpc('admin_transfer_license', {
        p_license_id: data.licenseId,
        p_new_user_id: data.newUserId,
        p_notes: data.notes
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Licença Transferida!',
        description: 'A licença foi transferida com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
      onClose();
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Transferir',
        description: error.message
      });
    }
  });

  const handleSave = () => {
    if (!license) return;
    
    updateLicenseMutation.mutate({
      licenseId: license.id,
      code: licenseCode,
      expiresAt: expirationDate ? new Date(expirationDate).toISOString() : null,
      isActive,
      userId: selectedUserId || null,
      notes
    });
  };

  const handleExtend = () => {
    if (!license) return;
    
    const days = parseInt(extensionDays);
    if (isNaN(days) || days <= 0) {
      showError({
        title: 'Dias Inválidos',
        description: 'Por favor, insira um número válido de dias.'
      });
      return;
    }
    
    extendLicenseMutation.mutate({
      licenseId: license.id,
      days,
      notes
    });
  };

  const handleTransfer = () => {
    if (!license || !selectedUserId) return;
    
    transferLicenseMutation.mutate({
      licenseId: license.id,
      newUserId: selectedUserId,
      notes
    });
  };

  const getStatusBadge = () => {
    if (!license) return null;
    
    if (!isActive) {
      return <Badge variant="destructive">Inativa</Badge>;
    }
    
    if (!license.expires_at) {
      return <Badge variant="default">Ativa (Sem Expiração)</Badge>;
    }
    
    const now = new Date();
    const expirationDate = new Date(license.expires_at);
    
    if (expirationDate < now) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Expira em {daysLeft} dias</Badge>;
    }
    
    return <Badge variant="default">Ativa</Badge>;
  };

  if (!license) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Editar Licença
          </DialogTitle>
          <DialogDescription>
            Gerencie os detalhes da licença, estenda a validade ou transfira para outro usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* License Info Header */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <code className="text-sm bg-background px-2 py-1 rounded border">
                  {license.code}
                </code>
                {getStatusBadge()}
              </div>
              <div className="text-sm text-muted-foreground">
                Criada em {format(new Date(license.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
            </div>
            
            {license.user_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{license.user_name} ({license.user_email})</span>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="edit">Editar Detalhes</TabsTrigger>
              <TabsTrigger value="extend">Estender Validade</TabsTrigger>
              <TabsTrigger value="transfer">Transferir Licença</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license-code">Código da Licença</Label>
                  <div className="flex gap-2">
                    <Input
                      id="license-code"
                      value={licenseCode}
                      onChange={(e) => setLicenseCode(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateLicenseCode}
                      className="shrink-0"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyLicenseCode}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration">Data de Expiração</Label>
                  <Input
                    id="expiration"
                    type="datetime-local"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is-active">Licença Ativa</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-select">Usuário Atribuído</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum usuário</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas da Alteração</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva as alterações realizadas..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="extend" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Estender Validade da Licença
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Adicione dias à validade atual da licença. A extensão será aplicada a partir da data de expiração atual.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extension-days">Dias para Adicionar</Label>
                  <Select value={extensionDays} onValueChange={setExtensionDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="365">365 dias (1 ano)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nova Data de Expiração</Label>
                  <div className="p-2 bg-muted rounded border text-sm">
                    {license.expires_at ? (
                      (() => {
                        const currentExpiration = new Date(license.expires_at);
                        const newExpiration = new Date(currentExpiration.getTime() + parseInt(extensionDays) * 24 * 60 * 60 * 1000);
                        return format(newExpiration, 'dd/MM/yyyy HH:mm', { locale: ptBR });
                      })()
                    ) : (
                      'Sem expiração atual'
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extension-notes">Motivo da Extensão</Label>
                <Textarea
                  id="extension-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva o motivo da extensão..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-900 dark:text-orange-100">
                    Transferir Licença
                  </span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Esta ação irá transferir a licença para outro usuário. O usuário atual perderá o acesso.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-user">Novo Usuário</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o novo usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(user => user.id !== license.user_id).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-notes">Motivo da Transferência</Label>
                  <Textarea
                    id="transfer-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descreva o motivo da transferência..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          
          {activeTab === 'edit' && (
            <Button 
              onClick={handleSave}
              disabled={updateLicenseMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateLicenseMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
          
          {activeTab === 'extend' && (
            <Button 
              onClick={handleExtend}
              disabled={extendLicenseMutation.isPending}
            >
              <Clock className="mr-2 h-4 w-4" />
              {extendLicenseMutation.isPending ? 'Estendendo...' : `Estender ${extensionDays} dias`}
            </Button>
          )}
          
          {activeTab === 'transfer' && (
            <Button 
              onClick={handleTransfer}
              disabled={transferLicenseMutation.isPending || !selectedUserId}
              variant="destructive"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {transferLicenseMutation.isPending ? 'Transferindo...' : 'Transferir Licença'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};