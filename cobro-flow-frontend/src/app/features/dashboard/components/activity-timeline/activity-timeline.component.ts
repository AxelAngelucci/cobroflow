import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivityItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-activity-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  template: `
    <div class="activity-card">
      <div class="card-header">
        <h3 class="card-title">{{ title() }}</h3>
        <div class="filter-pills">
          @for (filter of filters; track filter.id) {
            <button
              class="pill"
              [class.active]="activeFilter() === filter.id"
              (click)="activeFilter.set(filter.id)"
            >
              {{ filter.label }}
            </button>
          }
        </div>
      </div>

      <div class="timeline">
        @for (item of items(); track item.id; let last = $last) {
          <div class="timeline-item" [class.last]="last">
            <div class="timeline-left">
              <div class="time-label">{{ item.timeAgo }}</div>
              <div class="avatar" [style.background-color]="getAvatarBg(item.avatarColor)">
                <span class="avatar-text" [style.color]="item.avatarColor">{{ item.clientInitials }}</span>
              </div>
            </div>
            <div class="timeline-content">
              <div class="content-header">
                <span class="client-name">{{ item.clientName }}</span>
                <span class="item-action">{{ item.description }}</span>
              </div>
              <span class="item-detail">{{ item.invoice }}</span>
              <div class="content-tags">
                <span class="status-badge" [class]="item.status">{{ item.statusLabel }}</span>
              </div>
            </div>
            <div class="timeline-right">
              @if (item.amount) {
                <span class="amount" [style.color]="getAmountColor(item.status)">
                  {{ item.amount | currency:'$':'symbol':'1.0-0' }}
                </span>
              }
              <i data-lucide="external-link" class="external-icon"></i>
            </div>
          </div>
        }
      </div>

      <div class="view-all">
        <button class="view-all-btn" (click)="onViewAllClick.emit()">
          Ver toda la actividad →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .activity-card {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
    }

    .filter-pills {
      display: flex;
      gap: 8px;
    }

    .pill {
      padding: 6px 12px;
      background: #E5E7EB;
      border: none;
      border-radius: 16px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: #D1D5DB;
        color: #1F2937;
      }

      &.active {
        background: #1E40AF;
        color: white;
        font-weight: 600;
      }
    }

    .timeline {
      display: flex;
      flex-direction: column;
    }

    .timeline-item {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #E5E7EB;
      align-items: flex-start;
      transition: background 0.15s ease;

      &.last {
        border-bottom: none;
      }

      &:hover {
        background: #FAFAFA;
        margin: 0 -12px;
        padding-left: 12px;
        padding-right: 12px;
        border-radius: 8px;
      }
    }

    .timeline-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .time-label {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #9CA3AF;
      width: 56px;
      text-align: right;
    }

    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 20px;
    }

    .avatar-text {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 700;
    }

    .timeline-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .content-header {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .client-name {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
    }

    .item-action {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #6B7280;
    }

    .item-detail {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #6B7280;
    }

    .content-tags {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .status-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;

      &.paid {
        background: #D1FAE5;
        color: #059669;
      }

      &.pending {
        background: #FEF3C7;
        color: #D97706;
      }

      &.overdue {
        background: #FEE2E2;
        color: #DC2626;
      }

      &.promise {
        background: #DBEAFE;
        color: #1E40AF;
      }
    }

    .timeline-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .amount {
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
    }

    .external-icon {
      width: 16px;
      height: 16px;
      color: #9CA3AF;
      transition: color 0.15s ease;
    }

    .timeline-item:hover .external-icon {
      color: #1E40AF;
    }

    .view-all {
      display: flex;
      justify-content: center;
      padding-top: 12px;
      border-top: 1px solid #F3F4F6;
    }

    .view-all-btn {
      padding: 0;
      background: none;
      border: none;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1E3A8A;
      cursor: pointer;
      transition: color 0.15s ease;

      &:hover {
        color: #1E40AF;
      }
    }
  `]
})
export class ActivityTimelineComponent {
  title = input<string>('Actividad Reciente');
  items = input.required<ActivityItem[]>();

  onViewAllClick = output<void>();

  activeFilter = signal('all');

  filters = [
    { id: 'all', label: 'Todas' },
    { id: 'payments', label: 'Pagos' },
    { id: 'messages', label: 'Mensajes' }
  ];

  getAvatarBg(color: string): string {
    return color + '20';
  }

  getAmountColor(status: string): string {
    switch (status) {
      case 'paid': return '#10B981';
      case 'overdue': return '#EF4444';
      default: return '#1F2937';
    }
  }
}
