import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type ManagementEventType = 'whatsapp' | 'email' | 'call' | 'payment' | 'promise' | 'note' | 'sms';

export interface ManagementEvent {
  id: string;
  type: ManagementEventType;
  title: string;
  description: string;
  date: Date;
  amount?: number;
  invoiceNumber?: string;
}

interface EventConfig {
  bgColor: string;
  iconColor: string;
  icon: string;
  titleColor?: string;
}

@Component({
  selector: 'app-management-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="history-card">
      <!-- Header -->
      <div class="history-header">
        <h3>Historial de gestión</h3>
      </div>

      <div class="history-divider"></div>

      <!-- Events List -->
      <div class="history-items">
        @for (event of events(); track event.id; let last = $last) {
          <div class="history-item" [class.no-border]="last">
            <!-- Icon -->
            <div
              class="history-icon"
              [style.background-color]="getEventConfig(event.type).bgColor"
            >
              @switch (event.type) {
                @case ('whatsapp') {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="getEventConfig(event.type).iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                }
                @case ('email') {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="getEventConfig(event.type).iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                }
                @case ('call') {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="getEventConfig(event.type).iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                }
                @case ('payment') {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="getEventConfig(event.type).iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M6 12h.01M18 12h.01"></path>
                  </svg>
                }
                @case ('promise') {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="getEventConfig(event.type).iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                    <path d="m9 16 2 2 4-4"></path>
                  </svg>
                }
                @case ('sms') {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="getEventConfig(event.type).iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                }
                @default {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="getEventConfig(event.type).iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                }
              }
            </div>

            <!-- Info -->
            <div class="history-info">
              <span
                class="history-title"
                [style.color]="getEventConfig(event.type).titleColor || '#1F2937'"
              >
                {{ event.title }}
              </span>
              <span class="history-desc">{{ event.description }}</span>
              <span class="history-date">{{ formatTimeAgo(event.date) }}</span>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
            </svg>
            <p>Sin historial de gestión</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .history-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
      width: 400px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    .history-header {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .history-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1F2937;
    }

    .history-divider {
      height: 1px;
      background: #E5E7EB;
    }

    .history-items {
      display: flex;
      flex-direction: column;
    }

    .history-item {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid #E5E7EB;
    }

    .history-item.no-border {
      border-bottom: none;
    }

    .history-icon {
      width: 36px;
      height: 36px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .history-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .history-title {
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
    }

    .history-desc {
      font-size: 12px;
      color: #6B7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .history-date {
      font-size: 11px;
      color: #9CA3AF;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px 20px;
      color: #9CA3AF;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: #6B7280;
    }

    @media (max-width: 1200px) {
      .history-card {
        width: 100%;
      }
    }
  `]
})
export class ManagementHistoryComponent {
  events = input<ManagementEvent[]>([]);

  private eventConfigs: Record<ManagementEventType, EventConfig> = {
    whatsapp: { bgColor: '#F0FDF4', iconColor: '#10B981', icon: 'message-circle' },
    email: { bgColor: '#EFF6FF', iconColor: '#1E40AF', icon: 'mail' },
    call: { bgColor: '#FEF3C7', iconColor: '#D97706', icon: 'phone' },
    payment: { bgColor: '#D1FAE5', iconColor: '#059669', icon: 'banknote', titleColor: '#10B981' },
    promise: { bgColor: '#FEF3C7', iconColor: '#D97706', icon: 'calendar-check' },
    sms: { bgColor: '#EDE9FE', iconColor: '#7C3AED', icon: 'message-square' },
    note: { bgColor: '#F3F4F6', iconColor: '#6B7280', icon: 'file-text' }
  };

  getEventConfig(type: ManagementEventType): EventConfig {
    return this.eventConfigs[type] || this.eventConfigs.note;
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffWeeks < 4) return `Hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;

    return eventDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: eventDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}
