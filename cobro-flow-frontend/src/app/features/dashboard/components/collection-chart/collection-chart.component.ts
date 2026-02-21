import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { ChartDataPoint } from '../../models/dashboard.models';

interface ChartViewOption {
  id: string;
  label: string;
}

interface LegendItem {
  label: string;
  color: string;
}

@Component({
  selector: 'app-collection-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-group">
          <h3 class="chart-title">{{ title() }}</h3>
          <span class="chart-subtitle">Últimos 6 meses</span>
        </div>
        <div class="chart-controls">
          <div class="view-toggle">
            @for (option of viewOptions(); track option.id) {
              <button
                class="toggle-btn"
                [class.active]="selectedView() === option.id"
                (click)="onViewSelect(option.id)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <div class="chart-legend">
        @for (item of legend(); track item.label) {
          <div class="legend-item">
            <span class="legend-dot" [style.background-color]="item.color"></span>
            <span class="legend-label">{{ item.label }}</span>
          </div>
        }
      </div>

      <div class="chart-area">
        <div class="chart-bars">
          @for (point of chartData(); track point.month; let last = $last) {
            <div class="bar-group">
              <div class="stacked-bar">
                <div class="bar-segment pagado" [style.height.px]="getBarHeight(point.pagado)"></div>
                <div class="bar-segment vencido" [style.height.px]="getBarHeight(point.vencido)"></div>
                <div class="bar-segment por-vencer" [style.height.px]="getBarHeight(point.porVencer)"></div>
                <div class="bar-segment vigente" [style.height.px]="getBarHeight(point.vigente)"></div>
              </div>
              <span class="bar-label" [class.current]="last">{{ point.month }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-card {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      height: 400px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .chart-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .chart-title {
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
    }

    .chart-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #6B7280;
    }

    .view-toggle {
      display: flex;
      background: #F9FAFB;
      border-radius: 6px;
      padding: 4px;
      gap: 4px;
    }

    .toggle-btn {
      padding: 6px 12px;
      background: transparent;
      border: none;
      border-radius: 4px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        color: #1F2937;
      }

      &.active {
        background: #1E40AF;
        color: #FFFFFF;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(30, 64, 175, 0.3);
      }
    }

    .chart-legend {
      display: flex;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .legend-label {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #6B7280;
    }

    .chart-area {
      flex: 1;
      display: flex;
      border-top: 1px solid #E5E7EB;
      padding-top: 16px;
    }

    .chart-bars {
      flex: 1;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      gap: 16px;
      padding-bottom: 28px;
      position: relative;
    }

    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .stacked-bar {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 52px;
      border-radius: 6px 6px 2px 2px;
      overflow: hidden;
      transition: opacity 0.2s ease;
    }

    .bar-group:hover .stacked-bar {
      opacity: 0.85;
    }

    .bar-segment {
      width: 100%;
      transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);

      &.vigente {
        background: #10B981;
      }

      &.por-vencer {
        background: #F59E0B;
      }

      &.vencido {
        background: #EF4444;
      }

      &.pagado {
        background: #1E40AF;
      }
    }

    .bar-label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: #9CA3AF;

      &.current {
        color: #1E3A8A;
        font-weight: 600;
      }
    }
  `]
})
export class CollectionChartComponent {
  title = input<string>('Evolución de Cobranza');
  chartData = input.required<ChartDataPoint[]>();
  viewOptions = input<ChartViewOption[]>([
    { id: 'by-status', label: 'Por Estado' },
    { id: 'by-channel', label: 'Por Canal' }
  ]);
  legend = input<LegendItem[]>([
    { label: 'Vigente', color: '#10B981' },
    { label: 'Por vencer', color: '#F59E0B' },
    { label: 'Vencido', color: '#EF4444' },
    { label: 'Pagado', color: '#1E40AF' }
  ]);

  selectedView = signal('by-status');

  onViewChange = output<string>();

  private maxValue = computed(() => {
    const data = this.chartData();
    return Math.max(...data.map(d => d.vigente + d.porVencer + d.vencido + d.pagado));
  });

  onViewSelect(viewId: string): void {
    this.selectedView.set(viewId);
    this.onViewChange.emit(viewId);
  }

  getBarHeight(value: number): number {
    const maxHeight = 200;
    const max = this.maxValue() || 1;
    return (value / max) * maxHeight;
  }
}
