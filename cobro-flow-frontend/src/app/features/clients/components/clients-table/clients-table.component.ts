import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { ClientWithStats } from '../../models/clients.models';
import { ClientsService } from '../../services/clients.service';

@Component({
  selector: 'app-clients-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <table class="clients-table" role="grid" aria-label="Lista de clientes">
        <thead>
          <tr>
            <th scope="col">Cliente</th>
            <th scope="col" class="text-right">Deuda Total</th>
            <th scope="col" class="text-right">Monto Vencido</th>
            <th scope="col" class="text-center">Facturas</th>
            <th scope="col" class="text-center">Riesgo</th>
            <th scope="col" class="text-center">Estado</th>
            <th scope="col" class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (client of clients(); track client.id) {
            <tr
              class="client-row"
              [class.clickable]="true"
              (click)="onClientClick.emit(client)"
              (keydown.enter)="onClientClick.emit(client)"
              (keydown.space)="onClientClick.emit(client)"
              tabindex="0"
              role="row"
            >
              <td>
                <div class="client-info">
                  <div
                    class="avatar"
                    [style.background-color]="clientsService.getAvatarColor(client.id)"
                  >
                    {{ clientsService.getInitials(client.name) }}
                  </div>
                  <div class="client-details">
                    <span class="client-name">{{ client.name }}</span>
                    <span class="client-email">{{ client.email || 'Sin email' }}</span>
                    @if (client.tags && client.tags.length > 0) {
                      <div class="client-tags">
                        @for (tag of client.tags.slice(0, 2); track tag) {
                          <span class="tag">{{ tag }}</span>
                        }
                        @if (client.tags.length > 2) {
                          <span class="tag-more">+{{ client.tags.length - 2 }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </td>
              <td class="text-right">
                <span class="amount" [class.zero]="client.totalDebt === 0">
                  {{ clientsService.formatCurrency(client.totalDebt) }}
                </span>
              </td>
              <td class="text-right">
                <span
                  class="amount"
                  [class.overdue]="client.overdueAmount > 0"
                  [class.zero]="client.overdueAmount === 0"
                >
                  {{ clientsService.formatCurrency(client.overdueAmount) }}
                </span>
              </td>
              <td class="text-center">
                <div class="invoice-count">
                  <span class="total">{{ client.invoiceCount }}</span>
                  @if (client.overdueCount > 0) {
                    <span class="overdue-badge" title="Facturas vencidas">
                      {{ client.overdueCount }} vencidas
                    </span>
                  }
                </div>
              </td>
              <td class="text-center">
                <div class="risk-indicator">
                  <div
                    class="risk-bar"
                    [style.width.%]="client.riskScore || 0"
                    [style.background-color]="clientsService.getRiskColor(client.riskScore || 0)"
                  ></div>
                  <span class="risk-score">{{ client.riskScore || 0 }}</span>
                </div>
              </td>
              <td class="text-center">
                <span
                  class="status-badge"
                  [class.al-dia]="client.statusLabel === 'Al día'"
                  [class.por-vencer]="client.statusLabel === 'Por vencer'"
                  [class.vencido]="client.statusLabel === 'Vencido'"
                  [class.critico]="client.statusLabel === 'Crítico'"
                >
                  {{ client.statusLabel }}
                </span>
              </td>
              <td class="text-center">
                <div class="actions">
                  <button
                    type="button"
                    class="action-btn"
                    title="Ver detalles"
                    (click)="onViewDetails($event, client)"
                    aria-label="Ver detalles de {{ client.name }}"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="action-btn"
                    title="Enviar mensaje"
                    (click)="onSendMessage($event, client)"
                    aria-label="Enviar mensaje a {{ client.name }}"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="action-btn"
                    title="Más opciones"
                    (click)="onMoreOptions($event, client)"
                    aria-label="Más opciones para {{ client.name }}"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="empty-state">
                <div class="empty-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <p>No se encontraron clientes</p>
                  <span>Intenta ajustar los filtros de búsqueda</span>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .clients-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }

    thead {
      background: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
    }

    th {
      padding: 14px 16px;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
    }

    td {
      padding: 16px;
      border-bottom: 1px solid #F3F4F6;
      vertical-align: middle;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .client-row {
      transition: background-color 0.15s ease;
    }

    .client-row.clickable {
      cursor: pointer;
    }

    .client-row:hover {
      background-color: #F9FAFB;
    }

    .client-row:focus {
      outline: none;
      background-color: #EFF6FF;
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }

    .client-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .client-name {
      font-weight: 500;
      color: #111827;
      font-size: 14px;
    }

    .client-email {
      font-size: 13px;
      color: #6B7280;
    }

    .client-tags {
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }

    .tag {
      padding: 2px 8px;
      background: #E5E7EB;
      color: #374151;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .tag-more {
      padding: 2px 6px;
      color: #6B7280;
      font-size: 11px;
    }

    .amount {
      font-weight: 500;
      color: #111827;
      font-size: 14px;
    }

    .amount.zero {
      color: #9CA3AF;
    }

    .amount.overdue {
      color: #EF4444;
    }

    .invoice-count {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .invoice-count .total {
      font-weight: 500;
      color: #111827;
    }

    .overdue-badge {
      font-size: 11px;
      color: #EF4444;
      background: #FEE2E2;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .risk-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }

    .risk-bar {
      height: 6px;
      background: #22C55E;
      border-radius: 3px;
      max-width: 60px;
      min-width: 4px;
    }

    .risk-score {
      font-size: 13px;
      font-weight: 500;
      color: #6B7280;
      min-width: 24px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.al-dia {
      background: #D1FAE5;
      color: #059669;
    }

    .status-badge.por-vencer {
      background: #FEF3C7;
      color: #D97706;
    }

    .status-badge.vencido {
      background: #FEE2E2;
      color: #DC2626;
    }

    .status-badge.critico {
      background: #FEE2E2;
      color: #991B1B;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .actions {
      display: flex;
      gap: 4px;
      justify-content: center;
    }

    .action-btn {
      padding: 6px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      color: #6B7280;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      background: #F3F4F6;
      color: #111827;
    }

    .action-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px #3B82F6;
    }

    .empty-state {
      padding: 48px 24px;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #9CA3AF;
    }

    .empty-content p {
      font-weight: 500;
      color: #6B7280;
      margin: 0;
    }

    .empty-content span {
      font-size: 14px;
    }
  `]
})
export class ClientsTableComponent {
  protected readonly clientsService = inject(ClientsService);

  // Inputs
  clients = input.required<ClientWithStats[]>();

  // Outputs
  onClientClick = output<ClientWithStats>();
  onViewClient = output<ClientWithStats>();
  onSendMessageToClient = output<ClientWithStats>();
  onClientOptions = output<ClientWithStats>();

  onViewDetails(event: Event, client: ClientWithStats): void {
    event.stopPropagation();
    this.onViewClient.emit(client);
  }

  onSendMessage(event: Event, client: ClientWithStats): void {
    event.stopPropagation();
    this.onSendMessageToClient.emit(client);
  }

  onMoreOptions(event: Event, client: ClientWithStats): void {
    event.stopPropagation();
    this.onClientOptions.emit(client);
  }
}
