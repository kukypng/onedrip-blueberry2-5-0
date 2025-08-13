/**
 * DASHBOARD DE MONITORAMENTO DE SEGURANÇA
 * 
 * Componente administrativo para monitoramento em tempo real de eventos de segurança,
 * violações, atividades suspeitas e métricas de segurança do sistema.
 * 
 * @author Security Team
 * @version 2.0.0
 * @compliance OWASP Top 10, LGPD
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  FileX,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

// Componentes UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Hooks e utilitários
import { useSecurity } from '@/hooks/useSecurity';
import { SECURITY_CONFIG, SecurityEventType } from '@/config/securityConfig';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  suspiciousActivities: number;
  blockedIPs: number;
  activeUsers: number;
  failedLogins: number;
  fileViolations: number;
  rateLimitViolations: number;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  ip_address?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: string;
  user_email?: string;
}

interface SuspiciousIP {
  id: string;
  ip_address: string;
  reason: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  violation_count: number;
  is_blocked: boolean;
  first_detected: string;
  last_activity: string;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function SecurityMonitorDashboard() {
  const supabase = useSupabaseClient();
  const { state: securityState, actions: securityActions } = useSecurity();

  // Estados
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    suspiciousActivities: 0,
    blockedIPs: 0,
    activeUsers: 0,
    failedLogins: 0,
    fileViolations: 0,
    rateLimitViolations: 0,
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // =====================================================
  // FUNÇÕES DE CARREGAMENTO DE DADOS
  // =====================================================

  /**
   * Carrega métricas de segurança
   */
  const loadSecurityMetrics = useCallback(async () => {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Buscar eventos das últimas 24h
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('event_type, risk_level, timestamp')
        .gte('timestamp', last24h.toISOString());

      if (eventsError) throw eventsError;

      // Buscar IPs suspeitos
      const { data: ips, error: ipsError } = await supabase
        .from('suspicious_ips')
        .select('is_blocked')
        .eq('is_blocked', true);

      if (ipsError) throw ipsError;

      // Buscar usuários ativos
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('is_active', true)
        .gte('last_activity', last24h.toISOString());

      if (sessionsError) throw sessionsError;

      // Calcular métricas
      const totalEvents = events?.length || 0;
      const criticalEvents = events?.filter(e => e.risk_level === 'critical').length || 0;
      const suspiciousActivities = events?.filter(e => e.event_type === 'suspicious_activity').length || 0;
      const failedLogins = events?.filter(e => e.event_type === 'login_failed').length || 0;
      const fileViolations = events?.filter(e => e.event_type === 'file_validation_failed').length || 0;
      const rateLimitViolations = events?.filter(e => e.event_type === 'rate_limit_exceeded').length || 0;
      const blockedIPs = ips?.length || 0;
      const activeUsers = new Set(sessions?.map(s => s.user_id)).size || 0;

      setMetrics({
        totalEvents,
        criticalEvents,
        suspiciousActivities,
        blockedIPs,
        activeUsers,
        failedLogins,
        fileViolations,
        rateLimitViolations,
      });

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas de segurança');
    }
  }, [supabase]);

  /**
   * Carrega eventos recentes
   */
  const loadRecentEvents = useCallback(async () => {
    try {
      let query = supabase
        .from('security_audit_log')
        .select(`
          id,
          event_type,
          user_id,
          ip_address,
          risk_level,
          details,
          timestamp,
          users:user_id(email)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      // Aplicar filtros
      if (filterEventType !== 'all') {
        query = query.eq('event_type', filterEventType);
      }

      if (filterRiskLevel !== 'all') {
        query = query.eq('risk_level', filterRiskLevel);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por termo de busca
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(event => 
          event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.ip_address?.includes(searchTerm) ||
          (event.users as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setRecentEvents(filteredData.map(event => ({
        ...event,
        user_email: (event.users as any)?.email,
      })));

    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos de segurança');
    }
  }, [supabase, filterEventType, filterRiskLevel, searchTerm]);

  /**
   * Carrega IPs suspeitos
   */
  const loadSuspiciousIPs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suspicious_ips')
        .select('*')
        .order('last_activity', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSuspiciousIPs(data || []);

    } catch (error) {
      console.error('Erro ao carregar IPs suspeitos:', error);
      toast.error('Erro ao carregar IPs suspeitos');
    }
  }, [supabase]);

  /**
   * Carrega alertas de segurança
   */
  const loadSecurityAlerts = useCallback(async () => {
    try {
      // Simular alertas baseados em eventos críticos recentes
      const { data: criticalEvents, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('risk_level', 'critical')
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Última hora
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const alertsData: SecurityAlert[] = (criticalEvents || []).map(event => ({
        id: event.id,
        type: event.event_type,
        severity: event.risk_level,
        message: `Evento crítico detectado: ${event.event_type}`,
        timestamp: event.timestamp,
        acknowledged: false,
      }));

      setAlerts(alertsData);

    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast.error('Erro ao carregar alertas de segurança');
    }
  }, [supabase]);

  /**
   * Carrega todos os dados
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSecurityMetrics(),
        loadRecentEvents(),
        loadSuspiciousIPs(),
        loadSecurityAlerts(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadSecurityMetrics, loadRecentEvents, loadSuspiciousIPs, loadSecurityAlerts]);

  // =====================================================
  // AÇÕES
  // =====================================================

  /**
   * Bloqueia um IP
   */
  const blockIP = useCallback(async (ipAddress: string, reason: string) => {
    try {
      const { error } = await supabase
        .rpc('add_suspicious_ip', {
          p_ip_address: ipAddress,
          p_reason: reason,
          p_risk_level: 'high',
          p_block_duration: '24 hours',
        });

      if (error) throw error;

      toast.success(`IP ${ipAddress} bloqueado com sucesso`);
      await loadSuspiciousIPs();
      await securityActions.logSecurityEvent('ip_blocked', {
        ipAddress,
        reason,
        blockedBy: 'admin',
      });

    } catch (error) {
      console.error('Erro ao bloquear IP:', error);
      toast.error('Erro ao bloquear IP');
    }
  }, [supabase, loadSuspiciousIPs, securityActions]);

  /**
   * Desbloqueia um IP
   */
  const unblockIP = useCallback(async (ipId: string, ipAddress: string) => {
    try {
      const { error } = await supabase
        .from('suspicious_ips')
        .update({ is_blocked: false, blocked_until: null })
        .eq('id', ipId);

      if (error) throw error;

      toast.success(`IP ${ipAddress} desbloqueado com sucesso`);
      await loadSuspiciousIPs();
      await securityActions.logSecurityEvent('ip_unblocked', {
        ipAddress,
        unblockedBy: 'admin',
      });

    } catch (error) {
      console.error('Erro ao desbloquear IP:', error);
      toast.error('Erro ao desbloquear IP');
    }
  }, [supabase, loadSuspiciousIPs, securityActions]);

  /**
   * Exporta relatório de segurança
   */
  const exportSecurityReport = useCallback(async () => {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        metrics,
        recentEvents: recentEvents.slice(0, 50),
        suspiciousIPs,
        alerts,
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Relatório de segurança exportado');
      await securityActions.logSecurityEvent('security_report_exported', {
        reportType: 'full',
        exportedBy: 'admin',
      });

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  }, [metrics, recentEvents, suspiciousIPs, alerts, securityActions]);

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    loadRecentEvents();
  }, [filterEventType, filterRiskLevel, searchTerm]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(loadAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadAllData]);

  // =====================================================
  // COMPONENTES AUXILIARES
  // =====================================================

  const MetricCard = ({ title, value, icon: Icon, trend, color = 'default' }: {
    title: string;
    value: number;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    color?: 'default' | 'destructive' | 'warning' | 'success';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
            )}
            Últimas 24h
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EventRow = ({ event }: { event: SecurityEvent }) => {
    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'warning';
        default: return 'secondary';
      }
    };

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getRiskColor(event.risk_level)}>
              {event.risk_level}
            </Badge>
            <span className="font-medium">{event.event_type}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {event.user_email && (
              <span className="mr-4">Usuário: {event.user_email}</span>
            )}
            {event.ip_address && (
              <span className="mr-4">IP: {event.ip_address}</span>
            )}
            <span>{new Date(event.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const IPRow = ({ ip }: { ip: SuspiciousIP }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={ip.is_blocked ? 'destructive' : 'warning'}>
            {ip.is_blocked ? 'Bloqueado' : 'Suspeito'}
          </Badge>
          <span className="font-medium">{ip.ip_address}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="mr-4">Razão: {ip.reason}</span>
          <span className="mr-4">Violações: {ip.violation_count}</span>
          <span>Última atividade: {new Date(ip.last_activity).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {ip.is_blocked ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => unblockIP(ip.id, ip.ip_address)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Desbloquear
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => blockIP(ip.ip_address, 'Bloqueado manualmente pelo admin')}
          >
            <Ban className="h-4 w-4 mr-1" />
            Bloquear
          </Button>
        )}
      </div>
    </div>
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitor de Segurança</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real de eventos e métricas de segurança
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={exportSecurityReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      {securityState.riskLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerta Crítico de Segurança</AlertTitle>
          <AlertDescription>
            Nível de risco crítico detectado. Verifique imediatamente os eventos recentes.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Eventos Totais"
          value={metrics.totalEvents}
          icon={Activity}
          trend="up"
        />
        <MetricCard
          title="Eventos Críticos"
          value={metrics.criticalEvents}
          icon={AlertTriangle}
          color="destructive"
        />
        <MetricCard
          title="IPs Bloqueados"
          value={metrics.blockedIPs}
          icon={Ban}
          color="warning"
        />
        <MetricCard
          title="Usuários Ativos"
          value={metrics.activeUsers}
          icon={Users}
          color="success"
        />
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Falhas de Login"
          value={metrics.failedLogins}
          icon={XCircle}
          color="destructive"
        />
        <MetricCard
          title="Violações de Arquivo"
          value={metrics.fileViolations}
          icon={FileX}
          color="warning"
        />
        <MetricCard
          title="Rate Limit Excedido"
          value={metrics.rateLimitViolations}
          icon={Clock}
          color="warning"
        />
        <MetricCard
          title="Atividades Suspeitas"
          value={metrics.suspiciousActivities}
          icon={Shield}
          color="destructive"
        />
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos Recentes</TabsTrigger>
          <TabsTrigger value="ips">IPs Suspeitos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Eventos Recentes */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Eventos de Segurança</CardTitle>
                  <CardDescription>
                    Últimos eventos registrados no sistema
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filterEventType} onValueChange={setFilterEventType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="login_failed">Login Falhado</SelectItem>
                      <SelectItem value="suspicious_activity">Atividade Suspeita</SelectItem>
                      <SelectItem value="file_validation_failed">Arquivo Inválido</SelectItem>
                      <SelectItem value="rate_limit_exceeded">Rate Limit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Risco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {recentEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                  {recentEvents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum evento encontrado
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IPs Suspeitos */}
        <TabsContent value="ips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IPs Suspeitos e Bloqueados</CardTitle>
              <CardDescription>
                Endereços IP identificados como suspeitos ou bloqueados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {suspiciousIPs.map((ip) => (
                    <IPRow key={ip.id} ip={ip} />
                  ))}
                  {suspiciousIPs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum IP suspeito encontrado
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Segurança</CardTitle>
              <CardDescription>
                Alertas críticos que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{alert.type}</AlertTitle>
                    <AlertDescription>
                      {alert.message}
                      <div className="text-xs mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum alerta ativo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Monitoramento</CardTitle>
              <CardDescription>
                Configure as opções de monitoramento em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Atualização Automática</h4>
                  <p className="text-sm text-muted-foreground">
                    Atualizar dados automaticamente
                  </p>
                </div>
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'Ativado' : 'Desativado'}
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Intervalo de Atualização</h4>
                <Select
                  value={refreshInterval.toString()}
                  onValueChange={(value) => setRefreshInterval(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10000">10 segundos</SelectItem>
                    <SelectItem value="30000">30 segundos</SelectItem>
                    <SelectItem value="60000">1 minuto</SelectItem>
                    <SelectItem value="300000">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SecurityMonitorDashboard;