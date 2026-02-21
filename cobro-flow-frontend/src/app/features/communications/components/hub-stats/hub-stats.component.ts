import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommunicationHubKpis } from '../../models/communications.models';

@Component({
  selector: 'app-hub-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-grid">
      <!-- Enviados Hoy -->
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ kpis().sentToday }}</span>
          <span class="stat-label">Enviados Hoy</span>
        </div>
        <div class="stat-change" [class.positive]="kpis().sentTodayChange >= 0" [class.negative]="kpis().sentTodayChange < 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            @if (kpis().sentTodayChange >= 0) {
              <polyline points="18 15 12 9 6 15"></polyline>
            } @else {
              <polyline points="6 9 12 15 18 9"></polyline>
            }
          </svg>
          <span>{{ kpis().sentTodayChange >= 0 ? '+' : '' }}{{ kpis().sentTodayChange }}%</span>
        </div>
      </div>

      <!-- Tasa Apertura -->
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ kpis().openRate }}%</span>
          <span class="stat-label">Tasa Apertura</span>
        </div>
        <div class="stat-change" [class.positive]="kpis().openRateChange >= 0" [class.negative]="kpis().openRateChange < 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            @if (kpis().openRateChange >= 0) {
              <polyline points="18 15 12 9 6 15"></polyline>
            } @else {
              <polyline points="6 9 12 15 18 9"></polyline>
            }
          </svg>
          <span>{{ kpis().openRateChange >= 0 ? '+' : '' }}{{ kpis().openRateChange }}%</span>
        </div>
      </div>

      <!-- Tasa Respuesta -->
      <div class="stat-card">
        <div class="stat-icon amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ kpis().replyRate }}%</span>
          <span class="stat-label">Tasa Respuesta</span>
        </div>
        <div class="stat-change" [class.positive]="kpis().replyRateChange >= 0" [class.negative]="kpis().replyRateChange < 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            @if (kpis().replyRateChange >= 0) {
              <polyline points="18 15 12 9 6 15"></polyline>
            } @else {
              <polyline points="6 9 12 15 18 9"></polyline>
            }
          </svg>
          <span>{{ kpis().replyRateChange >= 0 ? '+' : '' }}{{ kpis().replyRateChange }}%</span>
        </div>
      </div>

      <!-- Pagos Post-Contacto -->
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ kpis().paymentsPostContact }}</span>
          <span class="stat-label">Pagos Post-Contacto</span>
        </div>
        <div class="stat-change" [class.positive]="kpis().paymentsPostContactChange >= 0" [class.negative]="kpis().paymentsPostContactChange < 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            @if (kpis().paymentsPostContactChange >= 0) {
              <polyline points="18 15 12 9 6 15"></polyline>
            } @else {
              <polyline points="6 9 12 15 18 9"></polyline>
            }
          </svg>
          <span>{{ kpis().paymentsPostContactChange >= 0 ? '+' : '' }}{{ kpis().paymentsPostContactChange }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
      position: relative;
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
      color: #3B82F6;
    }

    .stat-icon.green {
      background: #D1FAE5;
      color: #10B981;
    }

    .stat-icon.amber {
      background: #FEF3C7;
      color: #F59E0B;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    .stat-value {
      font-size: 22px;
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

    .stat-change {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .stat-change.positive {
      background: #D1FAE5;
      color: #059669;
    }

    .stat-change.negative {
      background: #FEE2E2;
      color: #EF4444;
    }

    @media (max-width: 1200px) {
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
export class HubStatsComponent {
  kpis = input.required<CommunicationHubKpis>();
}
