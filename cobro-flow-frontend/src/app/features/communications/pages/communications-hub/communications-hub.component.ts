import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationsService } from '../../services/communications.service';
import { HubStatsComponent } from '../../components/hub-stats/hub-stats.component';
import { ChannelStatusComponent } from '../../components/channel-status/channel-status.component';
import { ActivityFeedComponent } from '../../components/activity-feed/activity-feed.component';
import { ActivityFilterTab } from '../../models/communications.models';

@Component({
  selector: 'app-communications-hub',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HubStatsComponent,
    ChannelStatusComponent,
    ActivityFeedComponent,
  ],
  template: `
    <div class="hub-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Centro de Comunicaciones</h1>
            <p>Monitorea y gestiona todas las comunicaciones</p>
          </div>
          <div class="header-actions">
            <div class="search-input-wrap">
              <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                class="search-input"
                placeholder="Buscar comunicaciones..."
                [value]="commsService.hubSearch()"
                (input)="onSearchChange($event)"
              />
            </div>
            <button type="button" class="btn-primary" (click)="navigateToWorkflows()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuevo Workflow
            </button>
          </div>
        </div>
      </header>

      <!-- KPI Stats -->
      <section class="stats-section">
        <app-hub-stats [kpis]="commsService.kpis()" />
      </section>

      <!-- Loading State -->
      @if (commsService.isLoading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando datos...</span>
        </div>
      }

      <!-- Two-column layout -->
      <section class="content-grid">
        <div class="col-left">
          <app-channel-status [channels]="commsService.channels()" />
        </div>
        <div class="col-right">
          <app-activity-feed
            [items]="commsService.filteredActivity()"
            [activeTab]="commsService.activityFilter()"
            (tabChange)="handleActivityTabChange($event)"
          />
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hub-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 32px;
      min-height: 100%;
    }

    .page-header {
      margin-bottom: 8px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    .header-text h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .header-text p {
      font-size: 15px;
      color: #6B7280;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #9CA3AF;
      pointer-events: none;
    }

    .search-input {
      padding: 10px 16px 10px 40px;
      font-size: 14px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      background: white;
      color: #111827;
      width: 260px;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .search-input::placeholder {
      color: #9CA3AF;
    }

    .search-input:focus {
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: #3B82F6;
      color: white;
      border: none;
      white-space: nowrap;
    }

    .btn-primary:hover {
      background: #2563EB;
    }

    .stats-section {
      width: 100%;
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #E5E7EB;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .content-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 24px;
      align-items: start;
    }

    .col-left,
    .col-right {
      min-width: 0;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hub-page {
        padding: 20px;
      }

      .header-content {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .search-input {
        width: 100%;
      }

      .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class CommunicationsHubComponent implements OnInit {
  protected readonly commsService = inject(CommunicationsService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.commsService.loadHubData();
    this.commsService.loadTemplates();
    this.commsService.loadWorkflows();
  }

  handleActivityTabChange(tab: ActivityFilterTab): void {
    this.commsService.setActivityFilter(tab);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.commsService.setHubSearch(value);
  }

  navigateToWorkflows(): void {
    this.router.navigate(['/dashboard/comunicaciones/workflows']);
  }
}
