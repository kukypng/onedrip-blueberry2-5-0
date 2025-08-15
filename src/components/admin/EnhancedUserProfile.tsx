import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
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
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
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
  User,
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Activity,
  Mail,
  Phone,
  MapPin,
  Building,
} from 'lucide-react';
import type {
  UserProfileProps,
  EnhancedUser,
  License,
  LicenseCreateRequest
} from '../../types/userLicense';

interface LicenseFormData {
  type: string;
  expires_at: string;
  max_devices: number;
  features: string[];
  notes?: string;
}

interface UserEditFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
}

function LicenseCard({ license, onEdit, onDelete, onRenew, onSuspend, onActivate }: {
  license: License;
  onEdit: () => void;
  onDelete: () => void;
  onRenew: () => void;
  onSuspend: () => void;
  onActivate: () => void;
}) {
  const getStatusIcon = () => {
    switch (license.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (license.status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirada</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspensa</Badge>;
      default:
        return <Badge variant="outline">{license.status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{license.type}</CardTitle>
            {getStatusBadge()}
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Licença</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta licença? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Expira em</p>
            <p className="font-medium">{formatDate(license.expires_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dispositivos</p>
            <p className="font-medium">{license.devices_used || 0}/{license.max_devices || 1}</p>
          </div>
        </div>
        
        {license.features && license.features.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Recursos</p>
            <div className="flex flex-wrap gap-1">
              {license.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {license.status === 'active' && (
            <Button variant="outline" size="sm" onClick={onSuspend}>
              Suspender
            </Button>
          )}
          {license.status === 'suspended' && (
            <Button variant="outline" size="sm" onClick={onActivate}>
              Ativar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRenew}>
            Renovar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function EnhancedUserProfile({ userId, onClose }: UserProfileProps) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [userFormData, setUserFormData] = useState<UserEditFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    notes: ''
  });

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - replace with actual API call
      const mockUser: EnhancedUser = {
        id: userId,
        email: 'usuario@email.com',
        name: 'João Silva',
        phone: '+55 11 99999-9999',
        company: 'Empresa ABC',
        role: 'admin',
        created_at: '2024-01-15T10:00:00Z',
        last_sign_in_at: '2024-08-14T15:30:00Z',
        email_confirmed_at: '2024-01-15T10:00:00Z',
        user_metadata: {},
        license_count: 1,
        active_licenses: 1,
        total_license_value: 100,
        last_license_activity: '2024-08-14T15:30:00Z',
        license: {
          id: 'lic_123',
          user_id: userId,
          type: 'premium',
          status: 'active',
          expires_at: '2024-12-31T23:59:59Z',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-08-14T15:30:00Z',
          metadata: {},
          max_devices: 5,
          devices_used: 2,
          features: ['api_access', 'advanced_analytics', 'priority_support']
        },
        total_licenses: 1,
        expired_licenses: 0,
        last_login: '2024-08-14T15:30:00Z'
      };
      
      setUser(mockUser);
      setUserFormData({
        name: mockUser.name || '',
        email: mockUser.email,
        phone: mockUser.phone || '',
        company: mockUser.company || '',
        role: mockUser.role || '',
        notes: ''
      });
    } catch (err) {
      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (user) {
        setUser({
          ...user,
          name: userFormData.name,
          email: userFormData.email,
          phone: userFormData.phone,
          company: userFormData.company,
          role: userFormData.role
        });
      }
      
      setEditingUser(false);
    } catch (err) {
      setError('Erro ao salvar dados do usuário');
    }
  };

  const handleLicenseAction = async (action: string) => {
    try {
      console.log(`Executing license action: ${action} for user ${userId}`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      setError(`Erro ao executar ação: ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Perfil do Usuário</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="licenses">Licenças</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(!editingUser)}
                >
                  {editingUser ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingUser ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={userFormData.name}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        value={userFormData.email}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Empresa</label>
                      <Input
                        value={userFormData.company}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditingUser(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveUser}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-medium">{user.name || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-medium">{user.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Empresa</p>
                      <p className="font-medium">{user.company || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Licenças do Usuário</h3>
            <Button onClick={() => setShowLicenseForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Licença
            </Button>
          </div>
          
          {user.license ? (
            <LicenseCard
              license={user.license}
              onEdit={() => setEditingLicense(user.license)}
              onDelete={() => handleLicenseAction('delete')}
              onRenew={() => handleLicenseAction('renew')}
              onSuspend={() => handleLicenseAction('suspend')}
              onActivate={() => handleLicenseAction('activate')}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma licença encontrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Este usuário não possui licenças ativas.
                </p>
                <Button onClick={() => setShowLicenseForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Licença
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Atividade Recente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}