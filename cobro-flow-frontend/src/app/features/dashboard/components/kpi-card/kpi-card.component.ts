import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { KpiData } from '../../models/dashboard.models';

@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-label">{{ data().label }}</span>
        <div class="kpi-icon-bg" [style.background-color]="data().iconBgColor">
          <lucide-icon [name]="data().icon" class="kpi-icon" [style.color]="data().iconColor"></lucide-icon>
        </div>
      </div>
      <span class="kpi-value" [style.color]="data().valueColor || '#1F2937'">{{ data().value }}</span>
      <div class="kpi-footer">
        @if (data().secondaryText) {
          <span class="kpi-secondary" [style.color]="data().secondaryColor || '#6B7280'">
            {{ data().secondaryText }}
          </span>
        }
        @if (data().trendValue) {
          <span class="kpi-trend" [style.color]="data().trendColor || '#10B981'">
            <lucide-icon [name]="data().trendIcon || 'trending-up'" class="trend-icon" [style.color]="data().trendColor || '#10B981'"></lucide-icon>
            {{ data().trendValue }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 24px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06);
      height: 140px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06);
        transform: translateY(-2px);
      }
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-label {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #6B7280;
    }

    .kpi-icon-bg {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 20px;
      transition: transform 0.2s ease;
    }

    .kpi-card:hover .kpi-icon-bg {
      transform: scale(1.05);
    }

    .kpi-icon {
      width: 20px;
      height: 20px;
    }

    .kpi-value {
      font-family: 'Inter', sans-serif;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -1px;
      line-height: 1;
    }

    .kpi-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-secondary {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 400;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
    }

    .trend-icon {
      width: 14px;
      height: 14px;
    }
  `]
})
export class KpiCardComponent {
  data = input.required<KpiData>();
}
