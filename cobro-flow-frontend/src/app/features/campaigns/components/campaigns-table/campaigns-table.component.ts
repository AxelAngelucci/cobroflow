import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CampaignWithStats } from '../../models/campaigns.models';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
  selector: 'app-campaigns-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <table class="campaigns-table" role="grid" aria-label="Lista de campañas">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col" class="text-center">Estado</th>
            <th scope="col" class="text-center">Canal</th>
            <th scope="col" class="text-center">Clientes</th>
            <th scope="col" class="text-center">Respuesta</th>
            <th scope="col" class="text-right">Recuperado</th>
            <th scope="col" class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (campaign of campaigns(); track campaign.id) {
            <tr
              class="campaign-row"
              (click)="onCampaignClick.emit(campaign)"
              (keydown.enter)="onCampaignClick.emit(campaign)"
              tabindex="0"
              role="row"
            >
              <td>
                <div class="campaign-info">
                  <span class="campaign-name">{{ campaign.name }}</span>
                  @if (campaign.startDate) {
                    <span class="campaign-date">Inicio: {{ campaignsService.formatDate(campaign.startDate) }}</span>
                  }
                </div>
              </td>
              <td class="text-center">
                <span
                  class="status-badge"
                  [class.active]="campaign.status === 'active'"
                  [class.paused]="campaign.status === 'paused'"
                  [class.finished]="campaign.status === 'finished'"
                >
                  {{ getStatusLabel(campaign.status) }}
                </span>
              </td>
              <td class="text-center">
                <div class="channel-icons">
                  @if (hasChannel(campaign, 'whatsapp')) {
                    <span class="channel-icon whatsapp" title="WhatsApp">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 0 1-4.29-1.24l-.31-.18-2.87.85.85-2.87-.19-.31A8 8 0 1 1 12 20z"/>
                      </svg>
                    </span>
                  }
                  @if (hasChannel(campaign, 'email')) {
                    <span class="channel-icon email" title="Email">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </span>
                  }
                  @if (hasChannel(campaign, 'sms')) {
                    <span class="channel-icon sms" title="SMS">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </span>
                  }
                  @if (hasChannel(campaign, 'call') || hasChannel(campaign, 'ai_voice')) {
                    <span class="channel-icon call" title="Llamada">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </span>
                  }
                </div>
              </td>
              <td class="text-center">
                <span class="clients-count">{{ campaignsService.formatNumber(campaign.clientsCount) }}</span>
              </td>
              <td class="text-center">
                <div class="response-rate">
                  <div class="rate-bar-bg">
                    <div
                      class="rate-bar"
                      [style.width.%]="campaign.responseRate"
                      [class.high]="campaign.responseRate >= 60"
                      [class.medium]="campaign.responseRate >= 30 && campaign.responseRate < 60"
                      [class.low]="campaign.responseRate < 30"
                    ></div>
                  </div>
                  <span class="rate-value">{{ campaign.responseRate }}%</span>
                </div>
              </td>
              <td class="text-right">
                <span class="amount">{{ campaignsService.formatCurrency(campaign.recoveredAmount) }}</span>
              </td>
              <td class="text-center">
                <div class="actions">
                  <button
                    type="button"
                    class="action-btn"
                    title="Ver detalles"
                    (click)="onView($event, campaign)"
                    aria-label="Ver detalles de {{ campaign.name }}"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="action-btn"
                    [title]="campaign.isActive ? 'Pausar' : 'Activar'"
                    (click)="onToggle($event, campaign)"
                    [attr.aria-label]="(campaign.isActive ? 'Pausar' : 'Activar') + ' ' + campaign.name"
                  >
                    @if (campaign.isActive) {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                    } @else {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    }
                  </button>
                  <button
                    type="button"
                    class="action-btn"
                    title="Más opciones"
                    (click)="onMore($event, campaign)"
                    aria-label="Más opciones para {{ campaign.name }}"
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
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <p>No se encontraron campañas</p>
                  <span>Crea una nueva campaña para comenzar</span>
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

    .campaigns-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
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

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .campaign-row {
      transition: background-color 0.15s ease;
      cursor: pointer;
    }

    .campaign-row:hover {
      background-color: #F9FAFB;
    }

    .campaign-row:focus {
      outline: none;
      background-color: #EFF6FF;
    }

    .campaign-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .campaign-name {
      font-weight: 500;
      color: #111827;
      font-size: 14px;
    }

    .campaign-date {
      font-size: 12px;
      color: #9CA3AF;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.active {
      background: #D1FAE5;
      color: #059669;
    }

    .status-badge.paused {
      background: #FEF3C7;
      color: #D97706;
    }

    .status-badge.finished {
      background: #E5E7EB;
      color: #6B7280;
    }

    .channel-icons {
      display: flex;
      gap: 6px;
      justify-content: center;
    }

    .channel-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      color: #6B7280;
    }

    .channel-icon.whatsapp { color: #25D366; }
    .channel-icon.email { color: #3B82F6; }
    .channel-icon.sms { color: #8B5CF6; }
    .channel-icon.call { color: #F59E0B; }

    .clients-count {
      font-weight: 500;
      color: #111827;
      font-size: 14px;
    }

    .response-rate {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }

    .rate-bar-bg {
      width: 60px;
      height: 6px;
      background: #F3F4F6;
      border-radius: 3px;
      overflow: hidden;
    }

    .rate-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .rate-bar.high { background: #22C55E; }
    .rate-bar.medium { background: #F59E0B; }
    .rate-bar.low { background: #EF4444; }

    .rate-value {
      font-size: 13px;
      font-weight: 500;
      color: #6B7280;
      min-width: 32px;
    }

    .amount {
      font-weight: 500;
      color: #111827;
      font-size: 14px;
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
export class CampaignsTableComponent {
  protected readonly campaignsService = inject(CampaignsService);

  // Inputs
  campaigns = input.required<CampaignWithStats[]>();

  // Outputs
  onCampaignClick = output<CampaignWithStats>();
  onViewCampaign = output<CampaignWithStats>();
  onToggleCampaign = output<CampaignWithStats>();
  onCampaignOptions = output<CampaignWithStats>();

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activa',
      paused: 'Pausada',
      finished: 'Finalizada'
    };
    return labels[status] || status;
  }

  hasChannel(campaign: CampaignWithStats, channel: string): boolean {
    return campaign.channelLabel.toLowerCase().includes(channel) ||
      (campaign.strategyConfig as Record<string, unknown>)?.['channels']?.toString().includes(channel) || false;
  }

  onView(event: Event, campaign: CampaignWithStats): void {
    event.stopPropagation();
    this.onViewCampaign.emit(campaign);
  }

  onToggle(event: Event, campaign: CampaignWithStats): void {
    event.stopPropagation();
    this.onToggleCampaign.emit(campaign);
  }

  onMore(event: Event, campaign: CampaignWithStats): void {
    event.stopPropagation();
    this.onCampaignOptions.emit(campaign);
  }
}
