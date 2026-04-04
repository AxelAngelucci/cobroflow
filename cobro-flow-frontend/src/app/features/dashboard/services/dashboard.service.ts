import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
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
import {
  MOCK_NAV_ITEMS,
  MOCK_PLAN_INFO
} from '../data/dashboard.mock-data';
import {
  DashboardApiService,
  KpiApiResponse,
  ChartDataApiResponse,
  ChannelEffectivenessApiResponse,
  AttentionItemApiResponse,
  ActivityItemApiResponse
} from './dashboard-api.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly authService = inject(AuthService);
  private readonly dashboardApi = inject(DashboardApiService);

  // State signals
  private readonly _kpis = signal<KpiData[]>([]);
  private readonly _chartData = signal<ChartDataPoint[]>([]);
  private readonly _channelEffectiveness = signal<ChannelEffectiveness[]>([]);
  private readonly _attentionItems = signal<AttentionItem[]>([]);
  private readonly _activityItems = signal<ActivityItem[]>([]);
  private readonly _navItems = signal<NavItem[]>(MOCK_NAV_ITEMS);
  private readonly _planInfo = signal<PlanInfo>(MOCK_PLAN_INFO);
  private readonly _selectedDateFilter = signal<string>('30days');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly kpis = this._kpis.asReadonly();
  readonly chartData = this._chartData.asReadonly();
  readonly channelEffectiveness = this._channelEffectiveness.asReadonly();
  readonly attentionItems = this._attentionItems.asReadonly();
  readonly activityItems = this._activityItems.asReadonly();
  readonly navItems = this._navItems.asReadonly();
  readonly planInfo = this._planInfo.asReadonly();
  readonly selectedDateFilter = this._selectedDateFilter.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // User profile derived from AuthService
  readonly userProfile = computed<UserProfile>(() => {
    const user = this.authService.currentUser();
    if (user) {
      return {
        name: user.full_name,
        email: user.email,
        initials: this.getInitials(user.full_name),
        avatarColor: this.getAvatarColor(user.id)
      };
    }
    return {
      name: 'Usuario',
      email: 'usuario@cobroflow.com',
      initials: 'U',
      avatarColor: '#6B7280'
    };
  });

  // Current authenticated user from AuthService
  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;

  // Computed values
  readonly totalAmountDue = computed(() => {
    const kpi = this._kpis().find(k => k.id === 'total-por-cobrar');
    return kpi?.value ?? '$0';
  });

  readonly overdueAmount = computed(() => {
    const kpi = this._kpis().find(k => k.id === 'monto-vencido');
    return kpi?.value ?? '$0';
  });

  readonly totalChannelContacts = computed(() => {
    return this._channelEffectiveness().reduce((acc, item) => acc + item.value, 0);
  });

  readonly urgentAttentionCount = computed(() => {
    return this._attentionItems()
      .filter(item => item.type === 'overdue')
      .reduce((acc, item) => acc + item.count, 0);
  });

  constructor() {
    this.refreshDashboardData();
  }

  // Actions
  setDateFilter(filter: string): void {
    this._selectedDateFilter.set(filter);
    this.refreshDashboardData();
  }

  async refreshDashboardData(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const summary = await firstValueFrom(this.dashboardApi.getSummary());

      this._kpis.set(summary.kpis.map(k => this.mapKpi(k)));
      this._chartData.set(summary.chart_data.map(d => this.mapChartData(d)));
      this._channelEffectiveness.set(summary.channel_effectiveness.map(c => this.mapChannelEffectiveness(c)));
      this._attentionItems.set(summary.attention_items.map(a => this.mapAttentionItem(a)));
      this._activityItems.set(summary.activity_items.map(a => this.mapActivityItem(a)));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this._error.set('Error al cargar los datos del dashboard');
    } finally {
      this._isLoading.set(false);
    }
  }

  updateNavItemActive(itemId: string): void {
    this._navItems.update(items =>
      items.map(item => ({
        ...item,
        isActive: item.id === itemId
      }))
    );
  }

  // Activity actions
  markActivityAsRead(activityId: string): void {
    console.log('Marking activity as read:', activityId);
  }

  // Attention item actions
  handleAttentionItem(item: AttentionItem): void {
    console.log('Handling attention item:', item);
  }

  // Logout action
  logout(): void {
    this.authService.logout();
  }

  // ============================================
  // MAPPING METHODS
  // ============================================

  private mapKpi(api: KpiApiResponse): KpiData {
    const changeStr = api.change > 0 ? `+${api.change}%` : `${api.change}%`;
    const changeType: 'positive' | 'negative' | 'neutral' = api.change_positive
      ? 'positive'
      : api.change < 0
        ? 'negative'
        : 'neutral';
    const trendIcon = api.change >= 0 ? 'trending-up' : 'trending-down';
    const trendColor = api.change_positive ? '#10B981' : '#EF4444';

    const iconMap: Record<string, { icon: string; iconBgColor: string; iconColor: string; valueColor?: string }> = {
      'total-por-cobrar': { icon: 'dollar-sign', iconBgColor: '#EFF6FF', iconColor: '#1E40AF' },
      'monto-vencido': { icon: 'triangle-alert', iconBgColor: '#FEE2E2', iconColor: '#EF4444', valueColor: '#EF4444' },
      'pagado-este-mes': { icon: 'circle-check', iconBgColor: '#D1FAE5', iconColor: '#10B981', valueColor: '#10B981' },
      'tasa-recuperacion': { icon: 'target', iconBgColor: '#FEF3C7', iconColor: '#F59E0B', valueColor: '#F59E0B' }
    };

    const iconDefaults = { icon: 'bar-chart-2', iconBgColor: '#F3F4F6', iconColor: '#6B7280' };
    const iconConfig = iconMap[api.id] ?? iconDefaults;

    return {
      id: api.id,
      label: api.label,
      value: api.value,
      valueColor: iconConfig.valueColor,
      trendValue: changeStr,
      trendIcon,
      trendColor,
      change: changeStr,
      changeType,
      icon: iconConfig.icon,
      iconBgColor: iconConfig.iconBgColor,
      iconColor: iconConfig.iconColor
    };
  }

  private mapChartData(api: ChartDataApiResponse): ChartDataPoint {
    return {
      month: api.month,
      vigente: api.billed,
      porVencer: 0,
      vencido: 0,
      pagado: api.collected
    };
  }

  private mapChannelEffectiveness(api: ChannelEffectivenessApiResponse): ChannelEffectiveness {
    const colorMap: Record<string, string> = {
      'WhatsApp': '#22C55E',
      'Email': '#3B82F6',
      'SMS': '#F59E0B',
      'Llamadas': '#8B5CF6',
      'llamadas': '#8B5CF6',
      'whatsapp': '#22C55E',
      'email': '#3B82F6',
      'sms': '#F59E0B'
    };

    return {
      channel: api.channel,
      value: api.count,
      percentage: api.percentage,
      color: colorMap[api.channel] ?? '#6B7280'
    };
  }

  private mapAttentionItem(api: AttentionItemApiResponse): AttentionItem {
    const typeMap: Record<string, AttentionItem['type']> = {
      'overdue': 'overdue',
      'promise': 'promise',
      'communication': 'communication'
    };

    return {
      id: api.id,
      type: typeMap[api.type] ?? 'overdue',
      count: 1,
      label: api.description || api.title,
      linkText: 'Ver →'
    };
  }

  private mapActivityItem(api: ActivityItemApiResponse): ActivityItem {
    const statusMap: Record<string, ActivityItem['status']> = {
      'paid': 'paid',
      'pending': 'pending',
      'overdue': 'overdue',
      'promise': 'promise'
    };

    const statusLabelMap: Record<string, string> = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'overdue': 'Vencido',
      'promise': 'Promesa'
    };

    const channelLabelMap: Record<string, string> = {
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'sms': 'SMS',
      'llamada': 'Llamada'
    };

    const name = api.client_name;
    const parts = name.trim().split(' ');
    const initials = parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();

    const avatarColor = this.getAvatarColor(api.id);
    const mappedStatus = statusMap[api.status] ?? 'pending';
    const statusLabel = channelLabelMap[api.channel?.toLowerCase()] ?? statusLabelMap[api.status] ?? api.status;

    const timestamp = new Date(api.timestamp);
    const timeAgo = this.formatTimeAgo(timestamp);

    return {
      id: api.id,
      clientName: name,
      clientInitials: initials,
      avatarColor,
      description: api.action,
      status: mappedStatus,
      statusLabel,
      timeAgo
    };
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins}min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getInitials(fullName: string): string {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  private getAvatarColor(userId: string): string {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#8B5CF6', // Purple
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#EC4899', // Pink
      '#84CC16'  // Lime
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
