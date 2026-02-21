import { Injectable, inject, signal, computed } from '@angular/core';
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
  MOCK_KPIS,
  MOCK_CHART_DATA,
  MOCK_CHANNEL_EFFECTIVENESS,
  MOCK_ATTENTION_ITEMS,
  MOCK_ACTIVITY_ITEMS,
  MOCK_NAV_ITEMS,
  MOCK_PLAN_INFO
} from '../data/dashboard.mock-data';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly authService = inject(AuthService);

  // State signals
  private readonly _kpis = signal<KpiData[]>(MOCK_KPIS);
  private readonly _chartData = signal<ChartDataPoint[]>(MOCK_CHART_DATA);
  private readonly _channelEffectiveness = signal<ChannelEffectiveness[]>(MOCK_CHANNEL_EFFECTIVENESS);
  private readonly _attentionItems = signal<AttentionItem[]>(MOCK_ATTENTION_ITEMS);
  private readonly _activityItems = signal<ActivityItem[]>(MOCK_ACTIVITY_ITEMS);
  private readonly _navItems = signal<NavItem[]>(MOCK_NAV_ITEMS);
  private readonly _planInfo = signal<PlanInfo>(MOCK_PLAN_INFO);
  private readonly _selectedDateFilter = signal<string>('30days');
  private readonly _isLoading = signal<boolean>(false);

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

  // Actions
  setDateFilter(filter: string): void {
    this._selectedDateFilter.set(filter);
    this.refreshDashboardData();
  }

  refreshDashboardData(): void {
    this._isLoading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, this would fetch data from an API
      // For now, we just reset to mock data
      this._kpis.set(MOCK_KPIS);
      this._chartData.set(MOCK_CHART_DATA);
      this._channelEffectiveness.set(MOCK_CHANNEL_EFFECTIVENESS);
      this._attentionItems.set(MOCK_ATTENTION_ITEMS);
      this._activityItems.set(MOCK_ACTIVITY_ITEMS);
      this._isLoading.set(false);
    }, 500);
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
    // Implementation for marking activity as read
    console.log('Marking activity as read:', activityId);
  }

  // Attention item actions
  handleAttentionItem(item: AttentionItem): void {
    // Implementation for handling attention item click
    console.log('Handling attention item:', item);
  }

  // Logout action
  logout(): void {
    this.authService.logout();
  }

  // Helper methods
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
    
    // Generate a consistent color based on user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
