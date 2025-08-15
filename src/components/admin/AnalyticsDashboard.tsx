import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import type {
  AnalyticsDashboardProps,
  DateRange
} from '../../types/userLicense';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function MetricCard({ title, value, change, changeLabel, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className="flex items-center mt-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : isNegative ? (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                ) : null}
                <span className={`text-sm ${
                  isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-gray-500 ml-1">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <div className="text-white">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LicenseTypeDistribution({ data }: { data: any[] }) {
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChartIcon className="h-5 w-5" />
          <span>Distribuição por Tipo de Licença</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function LicenseStatusChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Status das Licenças</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('last_30_days');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockLicenseTypes = [
    { name: 'Básica', count: 150 },
    { name: 'Premium', count: 89 },
    { name: 'Enterprise', count: 23 },
    { name: 'Trial', count: 45 }
  ];

  const mockLicenseStatus = [
    { status: 'Ativa', count: 234 },
    { status: 'Expirada', count: 45 },
    { status: 'Suspensa', count: 12 },
    { status: 'Cancelada', count: 8 }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportData = () => {
    console.log('Exporting analytics data...');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analytics de Licenças</h2>
          <p className="text-muted-foreground">
            Análise detalhada do uso e performance das licenças
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Licenças"
          value={307}
          change={8.2}
          changeLabel="vs mês anterior"
          icon={<CreditCard className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Usuários Ativos"
          value={182}
          change={12.5}
          changeLabel="vs mês anterior"
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Receita Total"
          value="R$ 45.320"
          change={5.8}
          changeLabel="vs mês anterior"
          icon={<DollarSign className="h-6 w-6" />}
          color="purple"
        />
        <MetricCard
          title="Taxa de Renovação"
          value="87.3%"
          change={-2.1}
          changeLabel="vs mês anterior"
          icon={<TrendingUp className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LicenseTypeDistribution data={mockLicenseTypes} />
        <LicenseStatusChart data={mockLicenseStatus} />
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alertas de Expiração</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma licença próxima do vencimento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}