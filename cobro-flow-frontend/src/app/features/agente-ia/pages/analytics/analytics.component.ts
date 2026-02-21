import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgenteIaService } from '../../services/agente-ia.service';
import { CHANNEL_LABELS } from '../../models/agente-ia.models';

@Component({
  selector: 'app-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="analytics-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>Analytics del Agente IA</h1>
          <p>Métricas de rendimiento y análisis detallado</p>
        </div>
        <div class="header-right">
          <select class="date-select" [ngModel]="dateRange()" (ngModelChange)="changeDateRange($event)">
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </div>
      </header>

      <!-- Top KPIs (4 cards) -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg blue"><i class="lucide-message-circle kpi-icon"></i></div>
            <div class="kpi-trend green"><i class="lucide-trending-up"></i></div>
          </div>
          <span class="kpi-value">{{ kpis()?.totalConversations || 0 }}</span>
          <span class="kpi-label">Total Conversaciones</span>
          <span class="kpi-sub">{{ kpis()?.resolvedConversations || 0 }} resueltas</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg green"><i class="lucide-check-circle kpi-icon"></i></div>
          </div>
          <span class="kpi-value success">{{ kpis()?.resolutionRate || 0 }}%</span>
          <span class="kpi-label">Tasa de Resolución</span>
          <span class="kpi-sub">{{ kpis()?.escalatedConversations || 0 }} escaladas</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg amber"><i class="lucide-clock kpi-icon"></i></div>
          </div>
          <span class="kpi-value">{{ formatMs(kpis()?.avgResponseTimeMs) }}</span>
          <span class="kpi-label">Tiempo Promedio Resp.</span>
          <span class="kpi-sub">Tiempo de primera respuesta</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg purple"><i class="lucide-smile kpi-icon"></i></div>
          </div>
          <span class="kpi-value">{{ kpis()?.satisfactionScore ? (kpis()!.satisfactionScore! * 100).toFixed(0) + '%' : 'N/A' }}</span>
          <span class="kpi-label">Satisfacción</span>
          <span class="kpi-sub">Score de satisfacción</span>
        </div>
      </section>

      <!-- Middle KPIs (4 cards) -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg blue"><i class="lucide-mail kpi-icon"></i></div>
          </div>
          <span class="kpi-value">{{ formatNumber(kpis()?.totalMessages || 0) }}</span>
          <span class="kpi-label">Total Mensajes</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg purple"><i class="lucide-cpu kpi-icon"></i></div>
          </div>
          <span class="kpi-value">{{ formatNumber(kpis()?.totalTokensUsed || 0) }}</span>
          <span class="kpi-label">Tokens Usados</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg green"><i class="lucide-dollar-sign kpi-icon"></i></div>
          </div>
          <span class="kpi-value">{{ formatCurrency(kpis()?.totalCost || 0) }}</span>
          <span class="kpi-label">Costo Total</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-bg amber"><i class="lucide-alert-triangle kpi-icon"></i></div>
          </div>
          <span class="kpi-value warning">{{ kpis()?.escalationRate || 0 }}%</span>
          <span class="kpi-label">Tasa de Escalación</span>
        </div>
      </section>

      <!-- Charts Grid -->
      <section class="charts-grid">
        <!-- Sentiment Donut -->
        <div class="card">
          <div class="card-header"><h3>Distribución de Sentimiento</h3></div>
          <div class="card-body sentiment-chart">
            <div class="donut-placeholder">
              <div class="donut-ring">
                <svg viewBox="0 0 100 100" width="160" height="160">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" stroke-width="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" stroke-width="12" [attr.stroke-dasharray]="positiveArc() + ' 251.3'" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" stroke-width="12" [attr.stroke-dasharray]="neutralArc() + ' 251.3'" [attr.stroke-dashoffset]="'-' + positiveArc()" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" stroke-width="12" [attr.stroke-dasharray]="negativeArc() + ' 251.3'" [attr.stroke-dashoffset]="'-' + (positiveArc() + neutralArc())" transform="rotate(-90 50 50)" />
                </svg>
              </div>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-dot positive"></span> Positivo {{ kpis()?.positiveSentimentPct || 0 }}%</div>
                <div class="legend-item"><span class="legend-dot neutral"></span> Neutral {{ kpis()?.neutralSentimentPct || 0 }}%</div>
                <div class="legend-item"><span class="legend-dot negative"></span> Negativo {{ kpis()?.negativeSentimentPct || 0 }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payments -->
        <div class="card">
          <div class="card-header"><h3>Cobros y Pagos</h3></div>
          <div class="card-body">
            <div class="payments-grid">
              <div class="payment-stat">
                <span class="payment-value success">{{ formatCurrency(kpis()?.paymentsCollectedAmount || 0) }}</span>
                <span class="payment-label">Monto recuperado</span>
              </div>
              <div class="payment-stat">
                <span class="payment-value">{{ kpis()?.paymentsCollectedCount || 0 }}</span>
                <span class="payment-label">Pagos cobrados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Channel Performance Table -->
      <section class="card">
        <div class="card-header"><h3>Rendimiento por Canal</h3></div>
        <div class="card-body table-body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th>Conversaciones</th>
                <th>Resueltas</th>
                <th>Escaladas</th>
                <th>Msgs Enviados</th>
                <th>Msgs Recibidos</th>
                <th>Tiempo Resp.</th>
                <th>Sentimiento +</th>
              </tr>
            </thead>
            <tbody>
              @for (row of service.analytics(); track row.id) {
                <tr>
                  <td><span class="channel-badge">{{ row.channel ? CHANNEL_LABELS[row.channel] : 'General' }}</span></td>
                  <td>{{ row.totalConversations }}</td>
                  <td>{{ row.resolvedConversations }}</td>
                  <td>{{ row.escalatedConversations }}</td>
                  <td>{{ row.totalMessagesSent }}</td>
                  <td>{{ row.totalMessagesReceived }}</td>
                  <td>{{ row.avgResponseTimeMs ? (row.avgResponseTimeMs / 1000).toFixed(1) + 's' : '-' }}</td>
                  <td>{{ row.positiveSentimentCount }}</td>
                </tr>
              }
              @if (service.analytics().length === 0) {
                <tr><td colspan="8" class="empty-td">No hay datos de analytics</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .analytics-page { display: flex; flex-direction: column; gap: 24px; padding: 32px; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 28px; font-weight: 700; color: #1F2937; margin: 0; }
    .header-left p { font-size: 14px; color: #6B7280; margin: 4px 0 0; }
    .date-select { padding: 10px 16px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; background: white; color: #374151; cursor: pointer; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .kpi-card { background: white; border-radius: 12px; padding: 24px; border: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 8px; }
    .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .kpi-icon-bg { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon-bg.blue { background: #DBEAFE; color: #1E40AF; }
    .kpi-icon-bg.green { background: #D1FAE5; color: #059669; }
    .kpi-icon-bg.amber { background: #FEF3C7; color: #D97706; }
    .kpi-icon-bg.purple { background: #F3E8FF; color: #7C3AED; }
    .kpi-icon { font-size: 24px; }
    .kpi-trend { color: #059669; font-size: 14px; }
    .kpi-value { font-size: 28px; font-weight: 700; color: #1F2937; }
    .kpi-value.success { color: #10B981; }
    .kpi-value.warning { color: #F59E0B; }
    .kpi-label { font-size: 13px; font-weight: 500; color: #6B7280; }
    .kpi-sub { font-size: 12px; color: #9CA3AF; }

    /* Charts Grid */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    /* Card */
    .card { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); }
    .card-header { padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .card-header h3 { font-size: 16px; font-weight: 600; color: #1F2937; margin: 0; }
    .card-body { padding: 24px; }
    .table-body { padding: 0; overflow-x: auto; }

    /* Sentiment Chart */
    .sentiment-chart { display: flex; justify-content: center; }
    .donut-placeholder { display: flex; align-items: center; gap: 32px; }
    .donut-ring { flex-shrink: 0; }
    .donut-legend { display: flex; flex-direction: column; gap: 12px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    .legend-dot.positive { background: #10B981; }
    .legend-dot.neutral { background: #F59E0B; }
    .legend-dot.negative { background: #EF4444; }

    /* Payments */
    .payments-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .payment-stat { display: flex; flex-direction: column; gap: 4px; text-align: center; padding: 20px; background: #F9FAFB; border-radius: 12px; }
    .payment-value { font-size: 28px; font-weight: 700; color: #1F2937; }
    .payment-value.success { color: #10B981; }
    .payment-label { font-size: 13px; color: #6B7280; }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #6B7280; border-bottom: 2px solid #E5E7EB; background: #F9FAFB; }
    .data-table td { padding: 12px 16px; font-size: 14px; color: #1F2937; border-bottom: 1px solid #F3F4F6; }
    .channel-badge { padding: 4px 10px; background: #F3F4F6; border-radius: 10px; font-size: 12px; color: #374151; font-weight: 500; }
    .empty-td { text-align: center; color: #9CA3AF; padding: 32px 16px !important; }
  `]
})
export class AnalyticsComponent implements OnInit {
  protected readonly service = inject(AgenteIaService);
  private readonly router = inject(Router);
  readonly CHANNEL_LABELS = CHANNEL_LABELS;
  readonly dateRange = signal('30');

  readonly kpis = this.service.dashboardKpis;

  readonly positiveArc = signal(0);
  readonly neutralArc = signal(0);
  readonly negativeArc = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const days = parseInt(this.dateRange(), 10);
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const params = {
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
    };
    this.service.loadDashboardKpis(params).then(() => this.updateArcs());
    this.service.loadAnalytics({ ...params, size: 100 });
  }

  changeDateRange(range: string): void {
    this.dateRange.set(range);
    this.loadData();
  }

  updateArcs(): void {
    const k = this.kpis();
    if (!k) return;
    const circumference = 251.3;
    this.positiveArc.set((k.positiveSentimentPct / 100) * circumference);
    this.neutralArc.set((k.neutralSentimentPct / 100) * circumference);
    this.negativeArc.set((k.negativeSentimentPct / 100) * circumference);
  }

  formatMs(ms: number | null | undefined): string {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  formatNumber(n: number): string {
    return new Intl.NumberFormat('es-MX').format(n);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  }
}
