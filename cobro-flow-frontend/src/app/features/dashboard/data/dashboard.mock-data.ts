import {
  KpiData,
  ChartDataPoint,
  ChannelEffectiveness,
  AttentionItem,
  ActivityItem,
  NavItem,
  UserProfile,
  PlanInfo
} from '../models/dashboard.models';

export const MOCK_KPIS: KpiData[] = [
  {
    id: 'total-por-cobrar',
    label: 'Total por Cobrar',
    value: '$1,247,890',
    valueColor: '#1F2937',
    secondaryText: '347 cuentas activas',
    trendValue: '+12.5%',
    trendIcon: 'trending-up',
    trendColor: '#10B981',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'dollar-sign',
    iconBgColor: '#EFF6FF',
    iconColor: '#1E40AF'
  },
  {
    id: 'monto-vencido',
    label: 'Monto Vencido',
    value: '$234,560',
    valueColor: '#EF4444',
    secondaryText: '28% del total',
    secondaryColor: '#F87171',
    trendValue: '-5.2%',
    trendIcon: 'trending-down',
    trendColor: '#10B981',
    change: '-5.2%',
    changeType: 'positive',
    icon: 'triangle-alert',
    iconBgColor: '#FEE2E2',
    iconColor: '#EF4444'
  },
  {
    id: 'pagado-este-mes',
    label: 'Pagado este Mes',
    value: '$589,230',
    valueColor: '#10B981',
    secondaryText: '89 transacciones',
    trendValue: '+18.3%',
    trendIcon: 'trending-up',
    trendColor: '#10B981',
    change: '+18.3%',
    changeType: 'positive',
    icon: 'circle-check',
    iconBgColor: '#D1FAE5',
    iconColor: '#10B981'
  },
  {
    id: 'tasa-recuperacion',
    label: 'Tasa de Recuperación',
    value: '73.4%',
    valueColor: '#F59E0B',
    secondaryText: 'vs 68.1% mes anterior',
    trendValue: '+5.3%',
    trendIcon: 'trending-up',
    trendColor: '#10B981',
    change: '+5.3%',
    changeType: 'positive',
    icon: 'target',
    iconBgColor: '#FEF3C7',
    iconColor: '#F59E0B'
  }
];

export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { month: 'Ago', vigente: 180, porVencer: 120, vencido: 80, pagado: 60 },
  { month: 'Sep', vigente: 200, porVencer: 140, vencido: 90, pagado: 70 },
  { month: 'Oct', vigente: 165, porVencer: 130, vencido: 85, pagado: 75 },
  { month: 'Nov', vigente: 215, porVencer: 150, vencido: 95, pagado: 80 },
  { month: 'Dic', vigente: 195, porVencer: 160, vencido: 100, pagado: 85 },
  { month: 'Ene', vigente: 230, porVencer: 140, vencido: 90, pagado: 90 }
];

export const MOCK_CHANNEL_EFFECTIVENESS: ChannelEffectiveness[] = [
  { channel: 'WhatsApp', value: 1281, percentage: 45, color: '#22C55E' },
  { channel: 'Email', value: 854, percentage: 30, color: '#3B82F6' },
  { channel: 'SMS', value: 427, percentage: 15, color: '#F59E0B' },
  { channel: 'Llamadas', value: 285, percentage: 10, color: '#8B5CF6' }
];

export const MOCK_ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: '1',
    type: 'overdue',
    count: 15,
    label: 'cuentas vencidas +30 días',
    linkText: 'Ver →'
  },
  {
    id: '2',
    type: 'promise',
    count: 23,
    label: 'promesas de pago hoy',
    linkText: 'Ver →'
  },
  {
    id: '3',
    type: 'communication',
    count: 5,
    label: 'conversaciones sin responder',
    linkText: 'Ver →'
  }
];

export const MOCK_ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: '1',
    clientName: 'María González',
    clientInitials: 'MG',
    avatarColor: '#F59E0B',
    description: 'realizó un pago',
    invoice: 'Factura #1234 - $5,800.00',
    status: 'paid',
    statusLabel: 'Pagado',
    amount: 5800,
    timeAgo: 'Hace 2h'
  },
  {
    id: '2',
    clientName: 'Carlos Rodríguez',
    clientInitials: 'CR',
    avatarColor: '#3B82F6',
    description: 'respondió al mensaje',
    invoice: '"Confirmo pago para el viernes"',
    status: 'promise',
    statusLabel: 'Email',
    timeAgo: 'Hace 4h'
  },
  {
    id: '3',
    clientName: 'Ana Silva',
    clientInitials: 'AS',
    avatarColor: '#EF4444',
    description: 'cuenta vencida por 45 días',
    invoice: 'Factura #5678 - $12,400.00',
    status: 'overdue',
    statusLabel: 'Vencido',
    amount: 12400,
    timeAgo: 'Hace 1d'
  }
];

export const MOCK_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    route: '/dashboard',
    isActive: true
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: 'users',
    route: '/dashboard/clientes',
    badge: 247
  },
  {
    id: 'cuentas',
    label: 'Cuentas por Cobrar',
    icon: 'file-text',
    route: '/dashboard/cuentas'
  },
  {
    id: 'comunicaciones',
    label: 'Comunicaciones',
    icon: 'message-square',
    route: '/dashboard/comunicaciones'
  },
  {
    id: 'campanas',
    label: 'Campañas',
    icon: 'send',
    route: '/dashboard/campanas',
    badge: 3
  },
  {
    id: 'agente-ia',
    label: 'Agente IA',
    icon: 'bot',
    route: '/dashboard/agente-ia'
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: 'bar-chart-2',
    route: '/dashboard/reportes'
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: 'settings',
    route: '/dashboard/configuracion'
  }
];

export const MOCK_USER_PROFILE: UserProfile = {
  name: 'Juan Pérez',
  email: 'juan@empresa.com',
  initials: 'JP',
  avatarColor: '#10B981'
};

export const MOCK_PLAN_INFO: PlanInfo = {
  name: 'Plan Pro',
  percentage: 65,
  upgradeLabel: 'Upgrade'
};

export const CHART_LEGEND = [
  { label: 'Vigente', color: '#10B981' },
  { label: 'Por vencer', color: '#F59E0B' },
  { label: 'Vencido', color: '#EF4444' },
  { label: 'Pagado', color: '#1E40AF' }
];

export const DATE_FILTER_OPTIONS = [
  { id: 'today', label: 'Hoy' },
  { id: '7days', label: '7 días' },
  { id: '30days', label: '30 días' },
  { id: '90days', label: '90 días' }
];

export const CHART_VIEW_OPTIONS = [
  { id: 'by-status', label: 'Por Estado' },
  { id: 'by-channel', label: 'Por Canal' }
];
