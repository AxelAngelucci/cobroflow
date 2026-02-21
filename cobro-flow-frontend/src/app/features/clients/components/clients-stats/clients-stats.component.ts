import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { ClientsSummary } from '../../models/clients.models';
import { ClientsService } from '../../services/clients.service';

@Component({
  selector: 'app-clients-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ summary().totalClients }}</span>
          <span class="stat-label">Total Clientes</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ summary().activeClients }}</span>
          <span class="stat-label">Con Deuda Activa</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ clientsService.formatCurrency(summary().totalDebt) }}</span>
          <span class="stat-label">Deuda Total</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon red">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ clientsService.formatCurrency(summary().totalOverdue) }}</span>
          <span class="stat-label">Monto Vencido</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ summary().avgRiskScore }}</span>
          <span class="stat-label">Riesgo Promedio</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .stat-icon.blue {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .stat-icon.green {
      background: #D1FAE5;
      color: #059669;
    }

    .stat-icon.yellow {
      background: #FEF3C7;
      color: #D97706;
    }

    .stat-icon.red {
      background: #FEE2E2;
      color: #DC2626;
    }

    .stat-icon.purple {
      background: #EDE9FE;
      color: #7C3AED;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-label {
      font-size: 13px;
      color: #6B7280;
      white-space: nowrap;
    }

    @media (max-width: 1400px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 900px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ClientsStatsComponent {
  protected readonly clientsService = inject(ClientsService);

  summary = input.required<ClientsSummary>();
}
