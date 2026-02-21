import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { ChannelSummary, CHANNEL_LABELS } from '../../models/communications.models';

@Component({
  selector: 'app-channel-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Canales Activos</h3>
      </div>
      <div class="channel-list">
        @for (channel of channels(); track channel.channel) {
          <div class="channel-row">
            <div class="channel-left">
              <div class="channel-icon" [class]="channel.channel">
                @switch (channel.channel) {
                  @case ('email') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  }
                  @case ('whatsapp') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  }
                  @case ('call') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      <path d="M14.05 2a9 9 0 0 1 8 7.94"></path>
                      <path d="M14.05 6A5 5 0 0 1 18 10"></path>
                    </svg>
                  }
                  @case ('sms') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  }
                  @default {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  }
                }
              </div>
              <div class="channel-info">
                <span class="channel-name">{{ getChannelLabel(channel.channel) }}</span>
                <span class="channel-desc">{{ channel.description }}</span>
              </div>
            </div>
            <div class="channel-right">
              <span class="status-badge" [class]="channel.status">
                {{ getStatusLabel(channel.status) }}
              </span>
              <span class="sent-count">{{ channel.sentToday }} env.</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .card-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #F3F4F6;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .channel-list {
      display: flex;
      flex-direction: column;
    }

    .channel-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      border-bottom: 1px solid #F9FAFB;
      transition: background 0.15s ease;
    }

    .channel-row:last-child {
      border-bottom: none;
    }

    .channel-row:hover {
      background: #F9FAFB;
    }

    .channel-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .channel-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .channel-icon.email {
      background: #DBEAFE;
      color: #3B82F6;
    }

    .channel-icon.whatsapp {
      background: #D1FAE5;
      color: #10B981;
    }

    .channel-icon.call {
      background: #EDE9FE;
      color: #7C3AED;
    }

    .channel-icon.sms {
      background: #FEF3C7;
      color: #F59E0B;
    }

    .channel-icon.ai_voice {
      background: #E0E7FF;
      color: #4F46E5;
    }

    .channel-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .channel-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .channel-desc {
      font-size: 12px;
      color: #6B7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .channel-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.active {
      background: #D1FAE5;
      color: #059669;
    }

    .status-badge.manual {
      background: #FEF3C7;
      color: #D97706;
    }

    .status-badge.inactive {
      background: #F3F4F6;
      color: #6B7280;
    }

    .sent-count {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      min-width: 50px;
      text-align: right;
    }
  `]
})
export class ChannelStatusComponent {
  channels = input.required<ChannelSummary[]>();

  protected readonly channelLabels = CHANNEL_LABELS;

  getChannelLabel(channel: string): string {
    return this.channelLabels[channel as keyof typeof CHANNEL_LABELS] ?? channel;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      manual: 'Manual',
      inactive: 'Inactivo',
    };
    return labels[status] ?? status;
  }
}
