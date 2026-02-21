import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import {
  ActivityItem,
  ActivityFilterTab,
  CHANNEL_LABELS,
  COMMUNICATION_STATUS_LABELS,
} from '../../models/communications.models';
import { CommunicationsService } from '../../services/communications.service';

@Component({
  selector: 'app-activity-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Actividad Reciente</h3>
        <div class="filter-tabs">
          @for (tab of tabs; track tab.value) {
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === tab.value"
              (click)="tabChange.emit(tab.value)"
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>
      <div class="activity-list">
        @for (item of items(); track item.id) {
          <div class="activity-row">
            <div class="activity-icon" [class]="item.channel">
              @switch (item.channel) {
                @case ('email') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                }
                @case ('whatsapp') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                }
                @case ('call') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    <path d="M14.05 2a9 9 0 0 1 8 7.94"></path>
                    <path d="M14.05 6A5 5 0 0 1 18 10"></path>
                  </svg>
                }
                @case ('sms') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                }
                @default {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                }
              }
            </div>
            <div class="activity-content">
              <div class="activity-top">
                <span class="activity-title">{{ item.title }}</span>
                <span class="status-badge" [class]="getStatusClass(item.status)">
                  {{ getStatusLabel(item.status) }}
                </span>
              </div>
              <p class="activity-desc">{{ item.description }}</p>
            </div>
            <span class="activity-time">{{ commsService.formatRelativeTime(item.timestamp) }}</span>
          </div>
        } @empty {
          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>No hay actividad reciente</span>
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
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #F3F4F6;
      flex-wrap: wrap;
      gap: 12px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
      background: #F3F4F6;
      border-radius: 8px;
      padding: 3px;
    }

    .tab-btn {
      padding: 5px 14px;
      font-size: 13px;
      font-weight: 500;
      color: #6B7280;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #374151;
    }

    .tab-btn.active {
      background: white;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      max-height: 420px;
      overflow-y: auto;
    }

    .activity-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 24px;
      border-bottom: 1px solid #F9FAFB;
      transition: background 0.15s ease;
    }

    .activity-row:last-child {
      border-bottom: none;
    }

    .activity-row:hover {
      background: #F9FAFB;
    }

    .activity-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .activity-icon.email {
      background: #DBEAFE;
      color: #3B82F6;
    }

    .activity-icon.whatsapp {
      background: #D1FAE5;
      color: #10B981;
    }

    .activity-icon.call {
      background: #EDE9FE;
      color: #7C3AED;
    }

    .activity-icon.sms {
      background: #FEF3C7;
      color: #F59E0B;
    }

    .activity-icon.ai_voice {
      background: #E0E7FF;
      color: #4F46E5;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .activity-top {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .activity-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-badge.green {
      background: #D1FAE5;
      color: #059669;
    }

    .status-badge.blue {
      background: #DBEAFE;
      color: #2563EB;
    }

    .status-badge.red {
      background: #FEE2E2;
      color: #EF4444;
    }

    .status-badge.gray {
      background: #F3F4F6;
      color: #6B7280;
    }

    .activity-desc {
      font-size: 13px;
      color: #6B7280;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-time {
      font-size: 12px;
      color: #9CA3AF;
      white-space: nowrap;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      color: #9CA3AF;
      font-size: 14px;
    }

    .activity-list::-webkit-scrollbar {
      width: 4px;
    }

    .activity-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .activity-list::-webkit-scrollbar-thumb {
      background: #E5E7EB;
      border-radius: 4px;
    }
  `]
})
export class ActivityFeedComponent {
  protected readonly commsService = inject(CommunicationsService);

  items = input.required<ActivityItem[]>();
  activeTab = input.required<ActivityFilterTab>();
  tabChange = output<ActivityFilterTab>();

  protected readonly tabs: { value: ActivityFilterTab; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'email', label: 'Email' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'call', label: 'Llamadas' },
  ];

  getStatusLabel(status: string): string {
    return COMMUNICATION_STATUS_LABELS[status as keyof typeof COMMUNICATION_STATUS_LABELS] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      delivered: 'green',
      opened: 'blue',
      replied: 'green',
      bounced: 'red',
      sent: 'gray',
      failed: 'red',
      scheduled: 'gray',
      queued: 'gray',
      sending: 'blue',
      clicked: 'blue',
      cancelled: 'gray',
    };
    return map[status] ?? 'gray';
  }
}
