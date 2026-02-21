import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ClientsApiService } from './clients-api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ClientApiResponse,
  InvoiceApiResponse,
  PaymentApiResponse,
  CreateClientRequest
} from '../models/api.models';
import {
  Client,
  ClientWithStats,
  Invoice,
  Payment,
  PaymentWithAllocations,
  ClientActivity,
  ClientsSummary,
  ClientsFilter,
  PaginationState,
  ClientDetail,
  RiskLevel,
  InvoiceStatus
} from '../models/clients.models';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly apiService = inject(ClientsApiService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private get isAuthenticated(): boolean {
    return this.isBrowser && !!this.authService.getToken();
  }

  // State signals
  private readonly _clients = signal<ClientWithStats[]>([]);
  private readonly _summary = signal<ClientsSummary>({
    totalClients: 0,
    activeClients: 0,
    totalDebt: 0,
    totalOverdue: 0,
    avgRiskScore: 0
  });
  private readonly _selectedClient = signal<ClientDetail | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal<ClientsFilter>({
    search: '',
    status: 'all',
    riskLevel: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  private readonly _pagination = signal<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Public readonly signals
  readonly clients = this._clients.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly selectedClient = this._selectedClient.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Filtered and sorted clients (client-side filtering for additional filters)
  readonly filteredClients = computed(() => {
    let result = [...this._clients()];
    const currentFilter = this._filter();

    // Note: search is handled by API, but we can do additional client-side filtering

    // Status filter (client-side since API doesn't have this for clients list)
    if (currentFilter.status && currentFilter.status !== 'all') {
      result = result.filter(client => {
        switch (currentFilter.status) {
          case 'overdue':
            return client.overdueAmount > 0;
          case 'pending':
            return client.totalDebt > 0 && client.overdueAmount === 0;
          case 'paid':
            return client.totalDebt === 0;
          default:
            return true;
        }
      });
    }

    // Risk level filter
    if (currentFilter.riskLevel && currentFilter.riskLevel !== 'all') {
      result = result.filter(client => {
        const score = client.riskScore || 0;
        switch (currentFilter.riskLevel) {
          case 'low':
            return score < 30;
          case 'medium':
            return score >= 30 && score < 60;
          case 'high':
            return score >= 60 && score < 80;
          case 'critical':
            return score >= 80;
          default:
            return true;
        }
      });
    }

    // Tags filter
    if (currentFilter.tags && currentFilter.tags.length > 0) {
      result = result.filter(client =>
        currentFilter.tags!.some(tag => client.tags?.includes(tag))
      );
    }

    // Sorting
    if (currentFilter.sortBy) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (currentFilter.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'totalDebt':
            comparison = a.totalDebt - b.totalDebt;
            break;
          case 'overdueAmount':
            comparison = a.overdueAmount - b.overdueAmount;
            break;
          case 'riskScore':
            comparison = (a.riskScore || 0) - (b.riskScore || 0);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }
        return currentFilter.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  });

  // Paginated clients (for display - API already paginates, this is for client-side filtered results)
  readonly paginatedClients = computed(() => {
    // Since we're doing some client-side filtering, we paginate the filtered results
    const filtered = this.filteredClients();
    const { page, pageSize } = this._pagination();
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  });

  // Total pages based on filtered results
  readonly totalPages = computed(() => {
    const { pageSize } = this._pagination();
    return Math.ceil(this.filteredClients().length / pageSize) || 1;
  });

  // Available tags from all clients
  readonly availableTags = computed(() => {
    const tags = new Set<string>();
    this._clients().forEach(client => {
      client.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  });

  // ============================================
  // PUBLIC ACTIONS
  // ============================================

  setFilter(filter: Partial<ClientsFilter>): void {
    this._filter.update(current => ({ ...current, ...filter }));
    this._pagination.update(current => ({ ...current, page: 1 }));

    // If search changed, refresh from API
    if (filter.search !== undefined) {
      this.refreshClients();
    }
  }

  setPage(page: number): void {
    this._pagination.update(current => ({ ...current, page }));
  }

  setPageSize(pageSize: number): void {
    this._pagination.update(current => ({ ...current, pageSize, page: 1 }));
    this.refreshClients();
  }

  /**
   * Load clients from API
   */
  async refreshClients(): Promise<void> {
    // Don't make API calls if not authenticated or not in browser
    if (!this.isAuthenticated) {
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const currentFilter = this._filter();

      const response = await firstValueFrom(
        this.apiService.getClients({
          page: 1, // Get all for client-side filtering
          size: 100, // Get enough data
          search: currentFilter.search || undefined
        })
      );

      // Convert API response to ClientWithStats (uses aggregated stats from backend)
      const clientsWithStats = this.enrichClientsWithStats(response.items);

      this._clients.set(clientsWithStats);
      this._pagination.update(current => ({
        ...current,
        total: response.total
      }));

      // Update summary
      this.updateSummary(clientsWithStats);

    } catch (error) {
      console.error('Error loading clients:', error);
      this._error.set('Error al cargar los clientes');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Load client detail with invoices and payments
   */
  async loadClientDetail(clientId: string): Promise<void> {
    // Don't make API calls if not authenticated or not in browser
    if (!this.isAuthenticated) {
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Load client, invoices, and payments in parallel
      const [clientResponse, invoicesResponse, paymentsResponse] = await Promise.all([
        firstValueFrom(this.apiService.getClient(clientId)),
        firstValueFrom(this.apiService.getClientInvoices(clientId, { size: 100 })),
        firstValueFrom(this.apiService.getClientPayments(clientId, { size: 100 }))
      ]);

      // Convert to domain models
      const invoices = invoicesResponse.items.map(inv => this.mapInvoiceFromApi(inv));
      const payments = paymentsResponse.items.map(pay => this.mapPaymentFromApi(pay));

      // Calculate stats
      const totalDebt = invoices.reduce((sum, inv) => sum + inv.balance, 0);
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);

      const detail: ClientDetail = {
        ...this.mapClientFromApi(clientResponse),
        totalDebt,
        overdueAmount,
        invoiceCount: invoices.length,
        overdueCount: overdueInvoices.length,
        lastPaymentDate: payments[0]?.paymentDate,
        statusLabel: this.calculateStatusLabel(overdueAmount, clientResponse.risk_score || 0, invoices),
        invoices,
        payments: payments.map(p => ({ ...p, allocations: [] })),
        recentActivity: this.generateActivityFromData(invoices, payments)
      };

      this._selectedClient.set(detail);

    } catch (error) {
      console.error('Error loading client detail:', error);
      this._error.set('Error al cargar el detalle del cliente');
      this._selectedClient.set(null);
    } finally {
      this._isLoading.set(false);
    }
  }

  clearSelectedClient(): void {
    this._selectedClient.set(null);
  }

  /**
   * Create a new client
   */
  async createClient(data: {
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    tags?: string[];
    notes?: string;
  }): Promise<ClientWithStats> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const request: CreateClientRequest = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        tax_id: data.taxId || undefined,
        tags: data.tags || undefined
      };

      const response = await firstValueFrom(this.apiService.createClient(request));

      const newClient: ClientWithStats = {
        ...this.mapClientFromApi(response),
        totalDebt: 0,
        overdueAmount: 0,
        invoiceCount: 0,
        overdueCount: 0,
        statusLabel: 'Al día'
      };

      // Add to local state
      this._clients.update(clients => [newClient, ...clients]);

      // Update summary
      this._summary.update(summary => ({
        ...summary,
        totalClients: summary.totalClients + 1
      }));

      return newClient;

    } catch (error) {
      console.error('Error creating client:', error);
      this._error.set('Error al crear el cliente');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update an existing client
   */
  async updateClient(clientId: string, data: Partial<CreateClientRequest>): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.updateClient(clientId, data));

      // Update in local state
      this._clients.update(clients =>
        clients.map(c =>
          c.id === clientId
            ? { ...c, ...this.mapClientFromApi(response) }
            : c
        )
      );

    } catch (error) {
      console.error('Error updating client:', error);
      this._error.set('Error al actualizar el cliente');
      throw error;
    }
  }

  /**
   * Delete a client
   */
  async deleteClient(clientId: string): Promise<void> {
    try {
      await firstValueFrom(this.apiService.deleteClient(clientId));

      // Remove from local state
      this._clients.update(clients => clients.filter(c => c.id !== clientId));

      // Update summary
      this._summary.update(summary => ({
        ...summary,
        totalClients: Math.max(0, summary.totalClients - 1)
      }));

    } catch (error) {
      console.error('Error deleting client:', error);
      this._error.set('Error al eliminar el cliente');
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  getRiskLevel(score: number): RiskLevel {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }

  getRiskColor(score: number): string {
    const level = this.getRiskLevel(score);
    switch (level) {
      case 'low':
        return '#22C55E';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#F97316';
      case 'critical':
        return '#EF4444';
    }
  }

  formatCurrency(amount: number, currency = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(clientId: string): string {
    const colors = [
      '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
      '#EF4444', '#06B6D4', '#EC4899', '#84CC16'
    ];
    let hash = 0;
    for (let i = 0; i < clientId.length; i++) {
      hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private mapClientFromApi(api: ClientApiResponse): Client {
    return {
      id: api.id,
      organizationId: api.organization_id,
      erpId: api.erp_id || undefined,
      name: api.name,
      email: api.email || undefined,
      phone: api.phone || undefined,
      taxId: api.tax_id || undefined,
      riskScore: api.risk_score || undefined,
      tags: api.tags || undefined,
      aiProfileSummary: api.ai_profile_summary || undefined,
      createdAt: new Date(api.created_at)
    };
  }

  private mapInvoiceFromApi(api: InvoiceApiResponse): Invoice {
    return {
      id: api.id,
      organizationId: api.organization_id,
      debtorId: api.debtor_id,
      invoiceNumber: api.invoice_number,
      issueDate: new Date(api.issue_date),
      dueDate: new Date(api.due_date),
      amount: parseFloat(api.amount),
      balance: parseFloat(api.balance),
      currency: api.currency,
      status: api.status,
      fileUrl: api.file_url || undefined,
      erpMetadata: api.erp_metadata || undefined
    };
  }

  private mapPaymentFromApi(api: PaymentApiResponse): Payment {
    return {
      id: api.id,
      organizationId: api.organization_id,
      debtorId: api.debtor_id,
      amount: parseFloat(api.amount),
      paymentDate: new Date(api.payment_date),
      method: api.method || undefined,
      referenceNumber: api.reference_number || undefined,
      proofFileUrl: api.proof_file_url || undefined
    };
  }

  private enrichClientsWithStats(apiClients: ClientApiResponse[]): ClientWithStats[] {
    // Use aggregated stats from backend - no additional API calls needed
    return apiClients.map(apiClient => {
      const client = this.mapClientFromApi(apiClient);

      const totalDebt = apiClient.total_debt ? parseFloat(apiClient.total_debt) : 0;
      const overdueAmount = apiClient.overdue_amount ? parseFloat(apiClient.overdue_amount) : 0;
      const invoiceCount = apiClient.total_invoices || 0;
      const overdueCount = apiClient.overdue_invoices || 0;

      return {
        ...client,
        totalDebt,
        overdueAmount,
        invoiceCount,
        overdueCount,
        statusLabel: this.mapStatusFromApi(apiClient.status, overdueAmount, client.riskScore || 0)
      };
    });
  }

  private mapStatusFromApi(
    apiStatus: ClientApiResponse['status'],
    overdueAmount: number,
    riskScore: number
  ): ClientWithStats['statusLabel'] {
    // Map backend status to frontend label
    switch (apiStatus) {
      case 'current':
        return 'Al día';
      case 'at_risk':
        return 'Por vencer';
      case 'overdue':
        return 'Vencido';
      case 'critical':
        return 'Crítico';
      default:
        // Fallback calculation if status is null
        if (riskScore >= 80) return 'Crítico';
        if (overdueAmount > 0) return 'Vencido';
        return 'Al día';
    }
  }

  private calculateStatusLabel(
    overdueAmount: number,
    riskScore: number,
    invoices: Invoice[]
  ): ClientWithStats['statusLabel'] {
    if (riskScore >= 80) {
      return 'Crítico';
    }

    if (overdueAmount > 0) {
      const maxDaysOverdue = Math.max(
        0,
        ...invoices
          .filter(inv => inv.status === 'overdue')
          .map(inv => {
            const today = new Date();
            const dueDate = new Date(inv.dueDate);
            return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          })
      );
      return maxDaysOverdue > 60 ? 'Crítico' : 'Vencido';
    }

    const hasUpcoming = invoices.some(inv => {
      if (inv.balance <= 0) return false;
      const today = new Date();
      const dueDate = new Date(inv.dueDate);
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    });

    return hasUpcoming ? 'Por vencer' : 'Al día';
  }

  private updateSummary(clients: ClientWithStats[]): void {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.totalDebt > 0).length;
    const totalDebt = clients.reduce((sum, c) => sum + c.totalDebt, 0);
    const totalOverdue = clients.reduce((sum, c) => sum + c.overdueAmount, 0);
    const avgRiskScore = totalClients > 0
      ? Math.round(clients.reduce((sum, c) => sum + (c.riskScore || 0), 0) / totalClients)
      : 0;

    this._summary.set({
      totalClients,
      activeClients,
      totalDebt,
      totalOverdue,
      avgRiskScore
    });
  }

  private generateActivityFromData(invoices: Invoice[], payments: Payment[]): ClientActivity[] {
    const activities: ClientActivity[] = [];

    // Add payment activities
    payments.forEach(payment => {
      activities.push({
        id: `act-pay-${payment.id}`,
        type: 'payment',
        description: `Pago recibido - ${payment.method || 'Sin especificar'}`,
        date: new Date(payment.paymentDate),
        amount: payment.amount
      });
    });

    // Add invoice activities
    invoices.forEach(invoice => {
      activities.push({
        id: `act-inv-${invoice.id}`,
        type: 'invoice_created',
        description: `Factura emitida`,
        date: new Date(invoice.issueDate),
        amount: invoice.amount,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      });

      if (invoice.status === 'overdue') {
        activities.push({
          id: `act-over-${invoice.id}`,
          type: 'invoice_overdue',
          description: `Factura vencida`,
          date: new Date(invoice.dueDate),
          amount: invoice.balance,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber
        });
      }
    });

    // Sort by date descending
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
