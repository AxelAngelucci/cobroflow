import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  CampaignWithStats,
  CampaignsSummary,
  CampaignsFilter,
  CampaignFilterTab,
  CampaignKpi,
  mapApiListItemToCampaignWithStats
} from '../models/campaigns.models';
import { CreateCampaignRequest } from '../models/api.models';
import { CampaignsApiService } from './campaigns-api.service';

@Injectable({
  providedIn: 'root'
})
export class CampaignsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiService = inject(CampaignsApiService);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Private writable signals
  private readonly _campaigns = signal<CampaignWithStats[]>([]);
  private readonly _summary = signal<CampaignsSummary>({
    kpis: { activeCampaigns: 0, clientsReached: 0, responseRate: 0, recoveredAmount: 0 },
    totalCampaigns: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    finishedCampaigns: 0
  });
  private readonly _selectedCampaign = signal<CampaignWithStats | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal<CampaignsFilter>({
    search: '',
    tab: 'all'
  });
  private readonly _pagination = signal({ page: 1, pageSize: 10 });

  // Public readonly signals
  readonly campaigns = this._campaigns.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly selectedCampaign = this._selectedCampaign.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Computed: filtered campaigns
  readonly filteredCampaigns = computed(() => {
    let result = [...this._campaigns()];
    const currentFilter = this._filter();

    // Tab filter
    if (currentFilter.tab !== 'all') {
      result = result.filter(c => c.status === currentFilter.tab);
    }

    // Search filter
    if (currentFilter.search) {
      const search = currentFilter.search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(search) ||
        (c.description && c.description.toLowerCase().includes(search))
      );
    }

    return result;
  });

  // Computed: paginated campaigns
  readonly paginatedCampaigns = computed(() => {
    const filtered = this.filteredCampaigns();
    const { page, pageSize } = this._pagination();
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  });

  // Computed: total pages
  readonly totalPages = computed(() => {
    const total = this.filteredCampaigns().length;
    const { pageSize } = this._pagination();
    return Math.ceil(total / pageSize) || 1;
  });

  // Computed: KPIs
  readonly kpis = computed<CampaignKpi>(() => this._summary().kpis);

  // Computed: tab counts
  readonly tabCounts = computed(() => {
    const all = this._campaigns();
    return {
      all: all.length,
      active: all.filter(c => c.status === 'active').length,
      paused: all.filter(c => c.status === 'paused').length,
      finished: all.filter(c => c.status === 'finished').length
    };
  });

  // Public actions
  setFilter(filter: Partial<CampaignsFilter>): void {
    this._filter.update(current => ({ ...current, ...filter }));
    this._pagination.update(p => ({ ...p, page: 1 }));
  }

  setTab(tab: CampaignFilterTab): void {
    this._filter.update(current => ({ ...current, tab }));
    this._pagination.update(p => ({ ...p, page: 1 }));
  }

  setPage(page: number): void {
    this._pagination.update(p => ({ ...p, page }));
  }

  setPageSize(pageSize: number): void {
    this._pagination.update(() => ({ page: 1, pageSize }));
  }

  async loadCampaigns(): Promise<void> {
    if (!this.isBrowser) return;

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.apiService.getCampaigns({ page: 1, size: 100 }));
      const campaigns = response.items.map(mapApiListItemToCampaignWithStats);

      this._campaigns.set(campaigns);
      this.recalculateSummary();
    } catch (error) {
      console.error('Error loading campaigns:', error);
      this._error.set('Error al cargar las campañas');
    } finally {
      this._isLoading.set(false);
    }
  }

  async createCampaign(request: CreateCampaignRequest): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.apiService.createCampaign(request));
      await this.loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      this._error.set('Error al crear la campaña');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async toggleCampaignStatus(campaignId: string): Promise<void> {
    const campaign = this._campaigns().find(c => c.id === campaignId);
    if (!campaign) return;

    const newIsActive = !campaign.isActive;

    try {
      await firstValueFrom(this.apiService.updateCampaign(campaignId, { is_active: newIsActive }));

      this._campaigns.update(campaigns =>
        campaigns.map(c => {
          if (c.id !== campaignId) return c;
          return {
            ...c,
            isActive: newIsActive,
            status: newIsActive ? 'active' as const : 'paused' as const
          };
        })
      );
      this.recalculateSummary();
    } catch (error) {
      console.error('Error toggling campaign status:', error);
      this._error.set('Error al cambiar el estado de la campaña');
    }
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    try {
      await firstValueFrom(this.apiService.deleteCampaign(campaignId));

      this._campaigns.update(campaigns =>
        campaigns.filter(c => c.id !== campaignId)
      );
      this.recalculateSummary();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      this._error.set('Error al eliminar la campaña');
    }
  }

  // Formatting helpers
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-AR').format(num);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  private recalculateSummary(): void {
    const all = this._campaigns();
    const active = all.filter(c => c.status === 'active');

    this._summary.set({
      kpis: {
        activeCampaigns: active.length,
        clientsReached: all.reduce((sum, c) => sum + c.clientsCount, 0),
        responseRate: all.length > 0
          ? Math.round(all.reduce((sum, c) => sum + c.responseRate, 0) / all.length)
          : 0,
        recoveredAmount: all.reduce((sum, c) => sum + c.recoveredAmount, 0)
      },
      totalCampaigns: all.length,
      activeCampaigns: active.length,
      pausedCampaigns: all.filter(c => c.status === 'paused').length,
      finishedCampaigns: all.filter(c => c.status === 'finished').length
    });
  }
}
