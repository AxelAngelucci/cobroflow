import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ChannelType, CHANNEL_LABELS } from '../../models/campaigns.models';

export interface ChannelConfig {
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  call: boolean;
}

@Component({
  selector: 'app-campaign-channels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-section">
      <h3 class="section-title">Canales de Comunicación</h3>
      <p class="section-desc">Selecciona los canales para esta campaña</p>

      <div class="channels-grid">
        <!-- WhatsApp -->
        <div class="channel-card" [class.enabled]="data().whatsapp">
          <div class="channel-header">
            <div class="channel-icon whatsapp">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="data().whatsapp"
                (change)="toggleChannel('whatsapp')"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <span class="channel-name">WhatsApp</span>
          <span class="channel-desc">Mensajes directos por WhatsApp Business</span>
        </div>

        <!-- Email -->
        <div class="channel-card" [class.enabled]="data().email">
          <div class="channel-header">
            <div class="channel-icon email">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="data().email"
                (change)="toggleChannel('email')"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <span class="channel-name">Email</span>
          <span class="channel-desc">Correos electrónicos automatizados</span>
        </div>

        <!-- SMS -->
        <div class="channel-card" [class.enabled]="data().sms">
          <div class="channel-header">
            <div class="channel-icon sms">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="data().sms"
                (change)="toggleChannel('sms')"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <span class="channel-name">SMS</span>
          <span class="channel-desc">Mensajes de texto cortos</span>
        </div>

        <!-- Llamadas IA -->
        <div class="channel-card" [class.enabled]="data().call">
          <div class="channel-header">
            <div class="channel-icon call">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="data().call"
                (change)="toggleChannel('call')"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <span class="channel-name">Llamadas IA</span>
          <span class="channel-desc">Llamadas automatizadas con agente IA</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-section {
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .section-desc {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 20px 0;
    }

    .channels-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .channel-card {
      padding: 20px;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      transition: all 0.15s ease;
    }

    .channel-card.enabled {
      border-color: #3B82F6;
      background: #F0F7FF;
    }

    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .channel-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 10px;
    }

    .channel-icon.whatsapp {
      background: #D1FAE5;
      color: #25D366;
    }

    .channel-icon.email {
      background: #DBEAFE;
      color: #3B82F6;
    }

    .channel-icon.sms {
      background: #EDE9FE;
      color: #8B5CF6;
    }

    .channel-icon.call {
      background: #FEF3C7;
      color: #F59E0B;
    }

    .channel-name {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .channel-desc {
      display: block;
      font-size: 13px;
      color: #6B7280;
    }

    /* Toggle switch */
    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      cursor: pointer;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      inset: 0;
      background: #D1D5DB;
      border-radius: 24px;
      transition: all 0.2s ease;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .toggle input:checked + .toggle-slider {
      background: #3B82F6;
    }

    .toggle input:checked + .toggle-slider::before {
      transform: translateX(20px);
    }

    @media (max-width: 640px) {
      .channels-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CampaignChannelsComponent {
  data = input<ChannelConfig>({ whatsapp: true, email: true, sms: false, call: false });
  onChange = output<ChannelConfig>();

  toggleChannel(channel: keyof ChannelConfig): void {
    const current = this.data();
    this.onChange.emit({ ...current, [channel]: !current[channel] });
  }
}
