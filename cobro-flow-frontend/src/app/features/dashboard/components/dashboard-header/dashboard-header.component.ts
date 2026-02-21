import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

interface DateFilterOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-dashboard-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="title">{{ title() }}</h1>
        <span class="subtitle">{{ subtitle() }}</span>
        <span class="date-text">{{ dateText() }}</span>
      </div>
      <div class="header-right">
        <div class="period-selector">
          @for (option of dateOptions(); track option.id) {
            <button
              class="filter-btn"
              [class.active]="selectedDateFilter() === option.id"
              (click)="onDateFilterSelect(option.id)"
            >
              {{ option.label }}
            </button>
          }
        </div>
        <button class="refresh-btn" title="Actualizar datos">
          <i data-lucide="refresh-cw" class="refresh-icon"></i>
        </button>
        <button class="cta-btn" (click)="onNewCampaignClick.emit()">
          <i data-lucide="plus" class="btn-icon"></i>
          Nueva Campaña
        </button>
      </div>
    </header>
  `,
  styles: [`
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .title {
      font-family: 'Inter', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      color: #6B7280;
    }

    .date-text {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #9CA3AF;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .period-selector {
      display: flex;
      gap: 8px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 4px;
    }

    .filter-btn {
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-radius: 6px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        color: #1F2937;
        background: #F9FAFB;
      }

      &.active {
        background: #1E40AF;
        color: #FFFFFF;
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(30, 64, 175, 0.3);
      }
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: #F3F4F6;
        border-color: #D1D5DB;
      }

      &:active {
        transform: rotate(180deg);
      }
    }

    .refresh-icon {
      width: 18px;
      height: 18px;
      color: #6B7280;
    }

    .cta-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #1E3A8A;
      border: none;
      border-radius: 8px;
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(30, 58, 138, 0.3);

      &:hover {
        background: #1E40AF;
        box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .btn-icon {
      width: 16px;
      height: 16px;
    }
  `]
})
export class DashboardHeaderComponent {
  title = input<string>('Dashboard');
  subtitle = input<string>('');
  dateText = input<string>('');
  dateOptions = input<DateFilterOption[]>([
    { id: 'today', label: 'Hoy' },
    { id: '7days', label: '7 días' },
    { id: '30days', label: '30 días' },
    { id: '90days', label: '90 días' }
  ]);

  selectedDateFilter = signal('30days');

  onDateFilterChange = output<string>();
  onNewCampaignClick = output<void>();

  onDateFilterSelect(filterId: string): void {
    this.selectedDateFilter.set(filterId);
    this.onDateFilterChange.emit(filterId);
  }
}
