import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AgenteIaService } from '../../services/agente-ia.service';
import {
  AGENT_STATUS_LABELS, CONVERSATION_STATUS_LABELS,
  CHANNEL_LABELS,
} from '../../models/agente-ia.models';

@Component({
  selector: 'app-agente-ia-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ai-dashboard">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Agente IA</h1>
          <p>Tu asistente virtual de cobranza inteligente</p>
        </div>
        <div class="header-right">
          <button class="btn-config" (click)="navigateTo('configuracion')">
            <i class="lucide-settings"></i>
            Configurar Agente
          </button>
          <div class="status-badge">
            <span class="status-dot"></span>
            {{ service.isAgentActive() ? 'Agente Activo' : AGENT_STATUS_LABELS[service.config()?.status || 'paused'] }}
          </div>
        </div>
      </header>

      <!-- Agent Card (Blue Gradient) -->
      <section class="agent-card">
        <div class="agent-left">
          <div class="agent-info">
            <h2>{{ service.config()?.name || 'LUNA' }}</h2>
            <p class="agent-subtitle">Agente de Cobranza Inteligente</p>
            <p class="agent-desc">Aprende del comportamiento de tus clientes y adapta su tono según el nivel de morosidad. Disponible 24/7.</p>
          </div>
          <div class="agent-stats">
            <div class="agent-stat">
              <span class="stat-val">{{ service.dashboardKpis()?.totalConversations || 0 }}</span>
              <span class="stat-lbl">Conversaciones hoy</span>
            </div>
            <div class="agent-stat">
              <span class="stat-val">{{ service.dashboardKpis()?.resolutionRate || 0 }}%</span>
              <span class="stat-lbl">Tasa de respuesta</span>
            </div>
            <div class="agent-stat">
              <span class="stat-val">&lt; 3s</span>
              <span class="stat-lbl">Tiempo promedio</span>
            </div>
          </div>
        </div>
        <div class="agent-right">
          <span class="channels-title">Canales Activos</span>
          <div class="channels-list">
            <div class="channel-row">
              <i class="lucide-message-circle ch-icon"></i>
              <span class="ch-name">WhatsApp</span>
              <span class="ch-dot green"></span>
            </div>
            <div class="channel-row">
              <i class="lucide-mail ch-icon"></i>
              <span class="ch-name">Email</span>
              <span class="ch-dot green"></span>
            </div>
            <div class="channel-row">
              <i class="lucide-smartphone ch-icon"></i>
              <span class="ch-name">SMS</span>
              <span class="ch-dot green"></span>
            </div>
            <div class="channel-row">
              <i class="lucide-phone ch-icon"></i>
              <span class="ch-name">Llamadas</span>
              <span class="ch-dot yellow"></span>
            </div>
          </div>
        </div>
      </section>

      <!-- KPI Grid (4 cards) -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg green"><i class="lucide-dollar-sign kpi-icon green"></i></div>
            <div class="kpi-trend green"><i class="lucide-trending-up trend-icon"></i> +23%</div>
          </div>
          <span class="kpi-value">{{ formatCurrency(service.dashboardKpis()?.paymentsCollectedAmount || 0) }}</span>
          <span class="kpi-label">Recuperado por IA</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg blue"><i class="lucide-handshake kpi-icon blue"></i></div>
            <div class="kpi-trend green"><i class="lucide-trending-up trend-icon"></i> +18%</div>
          </div>
          <span class="kpi-value">{{ service.dashboardKpis()?.paymentsCollectedCount || 0 }}</span>
          <span class="kpi-label">Promesas de Pago</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg amber"><i class="lucide-target kpi-icon amber"></i></div>
            <div class="kpi-trend green"><i class="lucide-trending-up trend-icon"></i> +8%</div>
          </div>
          <span class="kpi-value">{{ service.dashboardKpis()?.resolutionRate || 0 }}%</span>
          <span class="kpi-label">Efectividad</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg purple"><i class="lucide-smile kpi-icon purple"></i></div>
            <div class="kpi-trend green"><i class="lucide-trending-up trend-icon"></i> +5%</div>
          </div>
          <span class="kpi-value">Positivo</span>
          <span class="kpi-label">Sentimiento Promedio</span>
        </div>
      </section>

      <!-- Main Grid: Activity + Quick Actions/Insights -->
      <section class="main-grid">
        <!-- Activity Feed -->
        <div class="card activity-section">
          <div class="card-header">
            <span class="card-title">Actividad Reciente del Agente</span>
            <button class="filter-btn">
              Últimas 24h
              <i class="lucide-chevron-down filter-icon"></i>
            </button>
          </div>
          <div class="activity-list">
            @if (service.conversations().length === 0) {
              <div class="empty-state">
                <p>No hay actividad reciente</p>
              </div>
            }
            @for (conv of service.conversations().slice(0, 5); track conv.id) {
              <div class="activity-item">
                <div class="act-icon-bg" [class]="getActivityIconClass(conv.status)">
                  <i [class]="getActivityIcon(conv.status)"></i>
                </div>
                <div class="act-content">
                  <span class="act-title">{{ getActivityTitle(conv) }}</span>
                  <span class="act-desc">{{ CHANNEL_LABELS[conv.channel] }} &middot; {{ conv.totalMessages }} mensajes</span>
                </div>
                <span class="act-time">{{ getRelativeTime(conv.createdAt) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Quick Actions + Insights -->
        <div class="card insights-section">
          <div class="card-header">
            <span class="card-title">Acciones Rápidas</span>
          </div>
          <div class="insights-list">
            <button class="action-card primary" (click)="navigateTo('conversaciones')">
              <div class="action-icon primary"><i class="lucide-play"></i></div>
              <div class="action-text">
                <span class="action-title primary">Iniciar Campaña IA</span>
                <span class="action-desc primary">{{ service.dashboardKpis()?.totalConversations || 0 }} clientes pendientes</span>
              </div>
            </button>
            <button class="action-card" (click)="navigateTo('entrenamiento')">
              <div class="action-icon gray"><i class="lucide-brain"></i></div>
              <div class="action-text">
                <span class="action-title">Entrenar Agente</span>
                <span class="action-desc">Mejorar respuestas</span>
              </div>
            </button>
            <button class="action-card" (click)="navigateTo('conversaciones')">
              <div class="action-icon gray"><i class="lucide-message-square"></i></div>
              <div class="action-text">
                <span class="action-title">Ver Conversaciones</span>
                <span class="action-desc">{{ service.dashboardKpis()?.activeConversations || 0 }} activas ahora</span>
              </div>
            </button>

            <div class="divider"></div>
            <span class="insights-subtitle">Insights IA</span>

            <div class="insight-card yellow">
              <div class="insight-header">
                <i class="lucide-lightbulb insight-icon yellow"></i>
                <span class="insight-title yellow">Recomendación</span>
              </div>
              <p class="insight-desc yellow">32 clientes responden mejor por WhatsApp a las 10 AM</p>
            </div>
            <div class="insight-card green-card">
              <div class="insight-header">
                <i class="lucide-trending-up insight-icon green-card"></i>
                <span class="insight-title green-card">Tendencia positiva</span>
              </div>
              <p class="insight-desc green-card">Tasa de respuesta mejoró 15% esta semana</p>
            </div>
          </div>
        </div>
      </section>

      @if (service.isLoading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ai-dashboard { display: flex; flex-direction: column; gap: 24px; padding: 32px; min-height: 100%; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 28px; font-weight: 700; color: #1F2937; margin: 0; }
    .header-left p { font-size: 14px; color: #6B7280; margin: 4px 0 0; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .btn-config { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #FFFFFF; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-config:hover { background: #F9FAFB; }
    .status-badge { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #D1FAE5; border-radius: 20px; font-size: 13px; font-weight: 600; color: #059669; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10B981; }

    /* Agent Card */
    .agent-card { display: flex; gap: 32px; background: linear-gradient(135deg, #1E40AF, #3B82F6); border-radius: 16px; padding: 32px; color: white; }
    .agent-left { flex: 1; display: flex; flex-direction: column; gap: 20px; }
    .agent-info { display: flex; flex-direction: column; gap: 8px; }
    .agent-info h2 { font-size: 32px; font-weight: 700; margin: 0; color: white; }
    .agent-subtitle { font-size: 16px; font-weight: 500; color: #BFDBFE; margin: 0; }
    .agent-desc { font-size: 14px; color: #93C5FD; margin: 0; max-width: 400px; line-height: 1.5; }
    .agent-stats { display: flex; gap: 24px; }
    .agent-stat { display: flex; flex-direction: column; gap: 4px; }
    .stat-val { font-size: 28px; font-weight: 700; color: white; }
    .stat-lbl { font-size: 12px; font-weight: 500; color: #93C5FD; }

    .agent-right { width: 280px; display: flex; flex-direction: column; gap: 16px; }
    .channels-title { font-size: 14px; font-weight: 600; color: white; }
    .channels-list { display: flex; flex-direction: column; gap: 12px; }
    .channel-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.15); border-radius: 8px; }
    .ch-icon { color: white; font-size: 20px; }
    .ch-name { flex: 1; font-size: 14px; font-weight: 500; color: white; }
    .ch-dot { width: 8px; height: 8px; border-radius: 50%; }
    .ch-dot.green { background: #10B981; }
    .ch-dot.yellow { background: #F59E0B; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .kpi-card { background: white; border-radius: 12px; padding: 24px; border: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 12px; }
    .kpi-top { display: flex; justify-content: space-between; align-items: center; }
    .kpi-icon-bg { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon-bg.green { background: #D1FAE5; }
    .kpi-icon-bg.blue { background: #DBEAFE; }
    .kpi-icon-bg.amber { background: #FEF3C7; }
    .kpi-icon-bg.purple { background: #F3E8FF; }
    .kpi-icon { font-size: 24px; }
    .kpi-icon.green { color: #059669; }
    .kpi-icon.blue { color: #1E40AF; }
    .kpi-icon.amber { color: #D97706; }
    .kpi-icon.purple { color: #7C3AED; }
    .kpi-trend { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .kpi-trend.green { background: #D1FAE5; color: #059669; }
    .trend-icon { font-size: 14px; }
    .kpi-value { font-size: 28px; font-weight: 700; color: #1F2937; }
    .kpi-label { font-size: 13px; font-weight: 500; color: #6B7280; }

    /* Main Grid */
    .main-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; flex: 1; }
    .card { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .card-title { font-size: 16px; font-weight: 600; color: #1F2937; }
    .filter-btn { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #F3F4F6; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; }
    .filter-icon { font-size: 14px; color: #6B7280; }

    /* Activity List */
    .activity-list { display: flex; flex-direction: column; flex: 1; }
    .activity-item { display: flex; align-items: center; gap: 16px; padding: 16px 24px; border-bottom: 1px solid #F3F4F6; }
    .activity-item:last-child { border-bottom: none; }
    .act-icon-bg { width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .act-icon-bg.bg-green { background: #D1FAE5; color: #059669; }
    .act-icon-bg.bg-blue { background: #DBEAFE; color: #1E40AF; }
    .act-icon-bg.bg-red { background: #FEE2E2; color: #DC2626; }
    .act-icon-bg.bg-amber { background: #FEF3C7; color: #D97706; }
    .act-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .act-title { font-size: 14px; font-weight: 500; color: #1F2937; }
    .act-desc { font-size: 12px; color: #6B7280; }
    .act-time { font-size: 12px; color: #9CA3AF; white-space: nowrap; }
    .empty-state { padding: 32px; text-align: center; color: #9CA3AF; }

    /* Insights Section */
    .insights-list { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
    .action-card { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 10px; border: 1px solid #E5E7EB; background: #F9FAFB; cursor: pointer; text-align: left; width: 100%; }
    .action-card.primary { background: #EFF6FF; border-color: #BFDBFE; }
    .action-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; font-size: 18px; }
    .action-icon.primary { background: #1E40AF; }
    .action-icon.gray { background: #6B7280; }
    .action-text { display: flex; flex-direction: column; gap: 2px; }
    .action-title { font-size: 14px; font-weight: 600; color: #374151; }
    .action-title.primary { color: #1E40AF; }
    .action-desc { font-size: 12px; color: #6B7280; }
    .action-desc.primary { color: #3B82F6; }

    .divider { height: 1px; background: #E5E7EB; }
    .insights-subtitle { font-size: 14px; font-weight: 600; color: #1F2937; }

    .insight-card { padding: 16px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px; }
    .insight-card.yellow { background: #FEF3C7; }
    .insight-card.green-card { background: #D1FAE5; }
    .insight-header { display: flex; align-items: center; gap: 8px; }
    .insight-icon { font-size: 16px; }
    .insight-icon.yellow { color: #D97706; }
    .insight-icon.green-card { color: #059669; }
    .insight-title { font-size: 12px; font-weight: 600; }
    .insight-title.yellow { color: #92400E; }
    .insight-title.green-card { color: #047857; }
    .insight-desc { font-size: 13px; font-weight: 500; margin: 0; }
    .insight-desc.yellow { color: #78350F; }
    .insight-desc.green-card { color: #065F46; }

    /* Loading */
    .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .spinner { width: 32px; height: 32px; border: 3px solid #E5E7EB; border-top: 3px solid #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Lucide icon stubs via CSS content (they render as text placeholders since we use SVG inline usually) */
  `]
})
export class AgenteIaDashboardComponent implements OnInit {
  protected readonly service = inject(AgenteIaService);
  private readonly router = inject(Router);

  readonly AGENT_STATUS_LABELS = AGENT_STATUS_LABELS;
  readonly CHANNEL_LABELS = CHANNEL_LABELS;
  readonly CONVERSATION_STATUS_LABELS = CONVERSATION_STATUS_LABELS;

  ngOnInit(): void {
    this.service.loadConfig();
    this.service.loadDashboardKpis();
    this.service.loadConversations({ page: 1, size: 5 });
  }

  navigateTo(path: string): void {
    this.router.navigate(['/dashboard/agente-ia', path]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  }

  getActivityIconClass(status: string): string {
    switch (status) {
      case 'resolved': return 'bg-green';
      case 'active': return 'bg-blue';
      case 'escalated': return 'bg-red';
      default: return 'bg-amber';
    }
  }

  getActivityIcon(status: string): string {
    switch (status) {
      case 'resolved': return 'lucide-check';
      case 'active': return 'lucide-message-circle';
      case 'escalated': return 'lucide-x';
      default: return 'lucide-calendar';
    }
  }

  getActivityTitle(conv: any): string {
    const name = conv.debtorName || `Deudor ${conv.debtorId?.slice(0, 8) || ''}`;
    switch (conv.status) {
      case 'resolved': return `Pago recibido - ${name}`;
      case 'active': return `Conversación iniciada - ${name}`;
      case 'escalated': return `Escalado a agente humano - ${name}`;
      default: return `Recordatorio programado - ${name}`;
    }
  }

  getRelativeTime(dateStr: Date | string | undefined): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  }
}
