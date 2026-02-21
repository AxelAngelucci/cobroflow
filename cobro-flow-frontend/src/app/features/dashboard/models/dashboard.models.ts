export interface KpiData {
  id: string;
  label: string;
  value: string;
  valueColor?: string;
  secondaryText?: string;
  secondaryColor?: string;
  trendValue?: string;
  trendIcon?: string;
  trendColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

export interface ChartDataPoint {
  month: string;
  vigente: number;
  porVencer: number;
  vencido: number;
  pagado: number;
}

export interface ChannelEffectiveness {
  channel: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AttentionItem {
  id: string;
  type: 'overdue' | 'promise' | 'communication';
  count: number;
  label: string;
  linkText?: string;
}

export interface ActivityItem {
  id: string;
  clientName: string;
  clientInitials: string;
  avatarColor: string;
  description: string;
  invoice?: string;
  status: 'paid' | 'pending' | 'overdue' | 'promise';
  statusLabel: string;
  amount?: number;
  timeAgo: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  isActive?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
}

export interface PlanInfo {
  name: string;
  percentage: number;
  upgradeLabel: string;
}
