import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignsStatsComponent } from '../../components/campaigns-stats/campaigns-stats.component';
import { CampaignsFiltersComponent } from '../../components/campaigns-filters/campaigns-filters.component';
import { CampaignsTableComponent } from '../../components/campaigns-table/campaigns-table.component';
import { CampaignWithStats, CampaignFilterTab } from '../../models/campaigns.models';

@Component({
  selector: 'app-campaigns-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CampaignsStatsComponent,
    CampaignsFiltersComponent,
    CampaignsTableComponent
  ],
  template: `
    <div class="campaigns-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Campañas</h1>
            <p>Gestiona tus campañas de cobranza</p>
          </div>
          <div class="header-actions">
            <button type="button" class="btn-secondary" (click)="exportCampaigns()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exportar
            </button>
            <button type="button" class="btn-primary" (click)="createCampaign()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nueva Campaña
            </button>
          </div>
        </div>
      </header>

      <!-- Stats -->
      <section class="stats-section">
        <app-campaigns-stats [kpis]="campaignsService.kpis()" />
      </section>

      <!-- Filters -->
      <section class="filters-section">
        <app-campaigns-filters
          [activeTab]="campaignsService.filter().tab"
          [allCount]="campaignsService.tabCounts().all"
          [activeCount]="campaignsService.tabCounts().active"
          [pausedCount]="campaignsService.tabCounts().paused"
          [finishedCount]="campaignsService.tabCounts().finished"
          (onTabChange)="handleTabChange($event)"
          (onSearchChange$)="handleSearchChange($event)"
        />
      </section>

      <!-- Loading State -->
      @if (campaignsService.isLoading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando campañas...</span>
        </div>
      }

      <!-- Table -->
      <section class="table-section">
        <app-campaigns-table
          [campaigns]="campaignsService.paginatedCampaigns()"
          (onCampaignClick)="viewCampaign($event)"
          (onViewCampaign)="viewCampaign($event)"
          (onToggleCampaign)="toggleCampaign($event)"
          (onCampaignOptions)="showOptions($event)"
        />
      </section>

      <!-- Pagination info -->
      @if (campaignsService.filteredCampaigns().length > 0) {
        <div class="pagination-info">
          <span>
            Mostrando {{ campaignsService.paginatedCampaigns().length }} de
            {{ campaignsService.filteredCampaigns().length }} campañas
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .campaigns-page {
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
      gap: 12px;
    }

    .btn-primary,
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
      border: none;
    }

    .btn-primary:hover {
      background: #2563EB;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #E5E7EB;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .stats-section,
    .filters-section,
    .table-section {
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

    .pagination-info {
      text-align: center;
      font-size: 14px;
      color: #6B7280;
    }

    @media (max-width: 768px) {
      .campaigns-page {
        padding: 20px;
      }

      .header-content {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions button {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class CampaignsListComponent implements OnInit {
  protected readonly campaignsService = inject(CampaignsService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.campaignsService.loadCampaigns();
  }

  handleTabChange(tab: CampaignFilterTab): void {
    this.campaignsService.setTab(tab);
  }

  handleSearchChange(search: string): void {
    this.campaignsService.setFilter({ search });
  }

  viewCampaign(campaign: CampaignWithStats): void {
    this.router.navigate(['/dashboard/campanas', campaign.id]);
  }

  createCampaign(): void {
    this.router.navigate(['/dashboard/campanas/nueva']);
  }

  toggleCampaign(campaign: CampaignWithStats): void {
    this.campaignsService.toggleCampaignStatus(campaign.id);
  }

  showOptions(campaign: CampaignWithStats): void {
    console.log('Show options for:', campaign.name);
  }

  exportCampaigns(): void {
    console.log('Export campaigns');
  }
}
