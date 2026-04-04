import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CollectionChartComponent } from '../../components/collection-chart/collection-chart.component';
import { ChannelEffectivenessComponent } from '../../components/channel-effectiveness/channel-effectiveness.component';
import { DashboardApiService, DashboardSummaryApiResponse, KpiApiResponse } from '../../services/dashboard-api.service';
import { ChartDataPoint, ChannelEffectiveness } from '../../models/dashboard.models';
import { firstValueFrom } from 'rxjs';

interface ReporteKpi {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

@Component({
  selector: 'app-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CollectionChartComponent, ChannelEffectivenessComponent],
  template: `
    <div class="reportes-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-text">
          <h1>Reportes</h1>
          <p>Análisis y métricas de tu operación de cobranza</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <lucide-icon name="loader-circle" class="spin"></lucide-icon>
          <span>Cargando datos...</span>
        </div>
      } @else {

        <!-- KPI Cards -->
        <section class="kpi-grid">
          @for (kpi of kpis(); track kpi.label) {
            <div class="kpi-card">
              <div class="kpi-icon-wrap" [style.background]="kpi.iconBg">
                <lucide-icon [name]="kpi.icon" class="kpi-icon" [style.color]="kpi.iconColor"></lucide-icon>
              </div>
              <div class="kpi-body">
                <span class="kpi-label">{{ kpi.label }}</span>
                <span class="kpi-value">{{ kpi.value }}</span>
              </div>
            </div>
          }
        </section>

        <!-- Charts Row -->
        <section class="charts-row">
          <div class="chart-main">
            <app-collection-chart
              title="Evolución de Cobranza"
              [chartData]="chartData()"
            />
          </div>
          <div class="chart-side">
            <app-channel-effectiveness
              title="Efectividad por Canal"
              [channelData]="channelData()"
            />
          </div>
        </section>

        <!-- Monthly Table -->
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">Detalle Mensual</h3>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Facturado</th>
                <th>Cobrado</th>
                <th>Tasa</th>
              </tr>
            </thead>
            <tbody>
              @for (row of monthlyRows(); track row.month) {
                <tr>
                  <td class="month-col">{{ row.month }}</td>
                  <td>{{ formatCurrency(row.billed) }}</td>
                  <td class="green">{{ formatCurrency(row.collected) }}</td>
                  <td>
                    <div class="rate-cell">
                      <div class="rate-bar">
                        <div class="rate-fill" [style.width.%]="row.rate"></div>
                      </div>
                      <span class="rate-text">{{ row.rate }}%</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      }
    </div>
  `,
  styles: [`
    .reportes-page {
      display: flex;
      flex-direction: column;
      gap: 32px;
      padding: 32px;
      min-height: 100%;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1F2937;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .page-header p { font-size: 15px; color: #6B7280; margin: 0; }

    /* Loading */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 80px;
      color: #6B7280;
      font-size: 15px;
    }
    .spin { width: 24px; height: 24px; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #F3F4F6;
    }
    .kpi-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
    }
    .kpi-icon { width: 22px; height: 22px; }
    .kpi-body { display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 13px; color: #6B7280; font-weight: 500; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #1F2937; line-height: 1; }

    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }

    /* Monthly Table */
    .table-card {
      background: white;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .table-header {
      padding: 20px 24px;
      border-bottom: 1px solid #E5E7EB;
    }
    .table-title {
      font-size: 16px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th {
      padding: 12px 24px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
    }
    .data-table td {
      padding: 14px 24px;
      font-size: 14px;
      color: #1F2937;
      border-bottom: 1px solid #F3F4F6;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #FAFAFA; }
    .month-col { font-weight: 600; }
    .green { color: #059669; font-weight: 600; }
    .rate-cell { display: flex; align-items: center; gap: 10px; }
    .rate-bar { flex: 1; max-width: 120px; height: 6px; background: #E5E7EB; border-radius: 3px; overflow: hidden; }
    .rate-fill { height: 100%; background: #1E40AF; border-radius: 3px; transition: width 0.5s ease; }
    .rate-text { font-size: 13px; font-weight: 600; color: #1F2937; min-width: 36px; }

    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .reportes-page { padding: 20px; gap: 24px; }
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportesComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  isLoading = signal(true);
  private summary = signal<DashboardSummaryApiResponse | null>(null);

  kpis = computed<ReporteKpi[]>(() => {
    const s = this.summary();
    if (!s) return [];

    const find = (id: string): KpiApiResponse | undefined => s.kpis.find(k => k.id === id);
    const totalChannelContacts = s.channel_effectiveness.reduce((acc, c) => acc + c.count, 0);

    return [
      {
        label: 'Total Cobrado este mes',
        value: find('pagado-este-mes')?.value ?? '$0',
        icon: 'dollar-sign',
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
      },
      {
        label: 'Total por Cobrar',
        value: find('total-por-cobrar')?.value ?? '$0',
        icon: 'send',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
      },
      {
        label: 'Tasa Recuperación',
        value: find('tasa-recuperacion')?.value ?? '0%',
        icon: 'trending-up',
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
      },
      {
        label: 'Contactos (30d)',
        value: totalChannelContacts.toString(),
        icon: 'users',
        iconBg: '#F3E8FF',
        iconColor: '#7C3AED',
      },
    ];
  });

  chartData = computed<ChartDataPoint[]>(() => {
    const s = this.summary();
    if (!s) return [];
    return s.chart_data.map(d => ({
      month: d.month,
      vigente: d.billed,
      porVencer: 0,
      vencido: 0,
      pagado: d.collected,
    }));
  });

  channelData = computed<ChannelEffectiveness[]>(() => {
    const s = this.summary();
    if (!s) return [];
    const colorMap: Record<string, string> = {
      whatsapp: '#22C55E', WhatsApp: '#22C55E',
      email: '#3B82F6', Email: '#3B82F6',
      sms: '#F59E0B', SMS: '#F59E0B',
      call: '#8B5CF6', llamadas: '#8B5CF6',
    };
    return s.channel_effectiveness.map(c => ({
      channel: c.channel,
      value: c.count,
      percentage: c.percentage,
      color: colorMap[c.channel] ?? '#6B7280',
    }));
  });

  monthlyRows = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return s.chart_data.map(d => ({
      month: d.month,
      billed: d.billed,
      collected: d.collected,
      rate: d.billed > 0 ? Math.round((d.collected / d.billed) * 100) : 0,
    }));
  });

  async ngOnInit(): Promise<void> {
    try {
      const data = await firstValueFrom(this.dashboardApi.getSummary());
      this.summary.set(data);
    } catch {
      // leave as null — components will show empty state
    } finally {
      this.isLoading.set(false);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  }
}
