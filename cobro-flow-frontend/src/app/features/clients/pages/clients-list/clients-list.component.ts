import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ClientsService } from '../../services/clients.service';
import { ClientsTableComponent } from '../../components/clients-table/clients-table.component';
import { ClientsFiltersComponent } from '../../components/clients-filters/clients-filters.component';
import { ClientsStatsComponent } from '../../components/clients-stats/clients-stats.component';
import { ClientsPaginationComponent } from '../../components/clients-pagination/clients-pagination.component';
import { ClientFormComponent, ClientFormData } from '../../components/client-form/client-form.component';
import { SlidePanelComponent } from '../../../../shared/components/slide-panel/slide-panel.component';
import { ClientWithStats, ClientsFilter } from '../../models/clients.models';

@Component({
  selector: 'app-clients-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ClientsTableComponent,
    ClientsFiltersComponent,
    ClientsStatsComponent,
    ClientsPaginationComponent,
    ClientFormComponent,
    SlidePanelComponent
  ],
  template: `
    <div class="clients-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Clientes</h1>
            <p>Gestiona tu cartera de clientes y sus cuentas por cobrar</p>
          </div>
          <div class="header-actions">
            <button type="button" class="btn-secondary" (click)="importClients()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Importar
            </button>
            <button type="button" class="btn-secondary" (click)="exportClients()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exportar
            </button>
            <button type="button" class="btn-primary" (click)="addClient()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuevo Cliente
            </button>
          </div>
        </div>
      </header>

      <!-- Stats -->
      <section class="stats-section">
        <app-clients-stats [summary]="clientsService.summary()" />
      </section>

      <!-- Filters -->
      <section class="filters-section">
        <app-clients-filters
          [currentFilter]="clientsService.filter()"
          [availableTags]="clientsService.availableTags()"
          (onFilterChange)="handleFilterChange($event)"
        />
      </section>

      <!-- Loading State -->
      @if (clientsService.isLoading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando clientes...</span>
        </div>
      }

      <!-- Table -->
      <section class="table-section">
        <app-clients-table
          [clients]="clientsService.paginatedClients()"
          (onClientClick)="viewClientDetail($event)"
          (onViewClient)="viewClientDetail($event)"
          (onSendMessageToClient)="sendMessage($event)"
          (onClientOptions)="showClientOptions($event)"
        />
      </section>

      <!-- Pagination -->
      @if (clientsService.filteredClients().length > 0) {
        <section class="pagination-section">
          <app-clients-pagination
            [currentPage]="clientsService.pagination().page"
            [totalPages]="clientsService.totalPages()"
            [pageSize]="clientsService.pagination().pageSize"
            [total]="clientsService.filteredClients().length"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange$)="handlePageSizeChange($event)"
          />
        </section>
      }

      <!-- New Client Slide Panel -->
      <app-slide-panel
        [isOpen]="isNewClientPanelOpen()"
        title="Nuevo Cliente"
        size="md"
        (onClose)="closeNewClientPanel()"
      >
        <app-client-form
          (onSave)="handleSaveClient($event)"
          (onCancel)="closeNewClientPanel()"
        />
      </app-slide-panel>
    </div>
  `,
  styles: [`
    .clients-page {
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

    .btn-primary:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
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

    .btn-secondary:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .stats-section,
    .filters-section,
    .table-section,
    .pagination-section {
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

    .loading-overlay span {
      font-size: 14px;
      color: #6B7280;
    }

    @media (max-width: 768px) {
      .clients-page {
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
export class ClientsListComponent implements OnInit {
  protected readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);

  // Panel state
  isNewClientPanelOpen = signal(false);

  ngOnInit(): void {
    this.clientsService.refreshClients();
  }

  handleFilterChange(filter: Partial<ClientsFilter>): void {
    this.clientsService.setFilter(filter);
  }

  handlePageChange(page: number): void {
    this.clientsService.setPage(page);
  }

  handlePageSizeChange(pageSize: number): void {
    this.clientsService.setPageSize(pageSize);
  }

  viewClientDetail(client: ClientWithStats): void {
    this.router.navigate(['/dashboard/clientes', client.id]);
  }

  sendMessage(client: ClientWithStats): void {
    console.log('Send message to:', client.name);
    // TODO: Navigate to communications or open message modal
  }

  showClientOptions(client: ClientWithStats): void {
    console.log('Show options for:', client.name);
    // TODO: Show context menu
  }

  addClient(): void {
    this.isNewClientPanelOpen.set(true);
  }

  closeNewClientPanel(): void {
    this.isNewClientPanelOpen.set(false);
  }

  async handleSaveClient(data: ClientFormData): Promise<void> {
    try {
      const newClient = await this.clientsService.createClient({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        taxId: data.taxId || undefined,
        tags: data.tags,
        notes: data.notes || undefined
      });

      this.closeNewClientPanel();

      // Optionally navigate to the new client's detail page
      // this.router.navigate(['/dashboard/clientes', newClient.id]);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  }

  importClients(): void {
    this.router.navigate(['/dashboard/clientes/importar']);
  }

  exportClients(): void {
    console.log('Export clients');
  }
}
