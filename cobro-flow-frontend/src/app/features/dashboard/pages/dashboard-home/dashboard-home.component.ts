import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DashboardHeaderComponent } from '../../components/dashboard-header/dashboard-header.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { CollectionChartComponent } from '../../components/collection-chart/collection-chart.component';
import { ChannelEffectivenessComponent } from '../../components/channel-effectiveness/channel-effectiveness.component';
import { AttentionListComponent } from '../../components/attention-list/attention-list.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';
import { DashboardService } from '../../services/dashboard.service';
import { AttentionItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DashboardHeaderComponent,
    KpiCardComponent,
    CollectionChartComponent,
    ChannelEffectivenessComponent,
    AttentionListComponent,
    ActivityTimelineComponent
  ],
  template: `
    <div class="dashboard-content">
      <!-- Header -->
      <app-dashboard-header
        title="Dashboard"
        [subtitle]="getWelcome()"
        [dateText]="getDateText()"
        (onDateFilterChange)="handleDateFilterChange($event)"
        (onNewCampaignClick)="handleNewCampaignClick()"
      />

      <!-- KPI Cards -->
      <section class="kpi-grid">
        @for (kpi of dashboardService.kpis(); track kpi.id) {
          <app-kpi-card [data]="kpi" />
        }
      </section>

      <!-- Charts Section -->
      <section class="charts-section">
        <div class="chart-main">
          <app-collection-chart
            title="Evolución de Cobranza"
            [chartData]="dashboardService.chartData()"
            (onViewChange)="handleChartViewChange($event)"
          />
        </div>
        <div class="chart-sidebar">
          <app-channel-effectiveness
            title="Efectividad por Canal"
            [channelData]="dashboardService.channelEffectiveness()"
          />
          <app-attention-list
            title="Requieren Atención"
            [items]="dashboardService.attentionItems()"
            (onItemClick)="handleAttentionItemClick($event)"
          />
        </div>
      </section>

      <!-- Activity Section -->
      <section class="activity-section">
        <app-activity-timeline
          title="Actividad Reciente"
          [items]="dashboardService.activityItems()"
          (onViewAllClick)="handleViewAllActivity()"
        />
      </section>
    </div>
  `,
  styles: [`
    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
      padding: 32px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .charts-section {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
    }

    .chart-main {
      min-width: 0;
    }

    .chart-sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-section {
      width: 100%;
    }

    @media (max-width: 1400px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .chart-sidebar {
        flex-direction: row;
      }
    }

    @media (max-width: 768px) {
      .dashboard-content {
        padding: 20px;
        gap: 24px;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .chart-sidebar {
        flex-direction: column;
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  protected readonly dashboardService = inject(DashboardService);

  ngOnInit(): void {
    this.dashboardService.refreshDashboardData();
  }

  getWelcome(): string {
    const userName = this.dashboardService.userProfile().name.split(' ')[0];
    return `Bienvenido, ${userName}`;
  }

  getDateText(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const dateStr = now.toLocaleDateString('es-ES', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }

  handleDateFilterChange(filter: string): void {
    this.dashboardService.setDateFilter(filter);
  }

  handleNewCampaignClick(): void {
    console.log('New campaign clicked');
  }

  handleChartViewChange(view: string): void {
    console.log('Chart view changed:', view);
  }

  handleAttentionItemClick(item: AttentionItem): void {
    this.dashboardService.handleAttentionItem(item);
  }

  handleViewAllActivity(): void {
    console.log('View all activity clicked');
  }
}
