import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AttentionItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-attention-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="attention-card">
      <div class="card-header">
        <h3 class="card-title">{{ title() }}</h3>
        <div class="badge" [class.has-items]="totalCount() > 0">
          {{ totalCount() }}
        </div>
      </div>

      <div class="attention-items">
        @for (item of items(); track item.id; let first = $first; let last = $last) {
          <div class="attention-item" [class.has-border]="!first && !last">
            <lucide-icon [name]="getIcon(item.type)" class="item-icon" [style.color]="getIconColor(item.type)"></lucide-icon>
            <span class="item-text">
              <strong>{{ item.count }}</strong> {{ item.label }}
            </span>
            @if (item.linkText) {
              <button class="item-link" (click)="onItemClick.emit(item)">
                {{ item.linkText }}
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .attention-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
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
      font-size: 16px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
    }

    .badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      border-radius: 12px;
      background: #E5E7EB;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      padding: 0 6px;

      &.has-items {
        background: #EF4444;
        color: #FFFFFF;
      }
    }

    .attention-items {
      display: flex;
      flex-direction: column;
    }

    .attention-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;

      &.has-border {
        border-top: 1px solid #E5E7EB;
        border-bottom: 1px solid #E5E7EB;
      }

      &:first-child {
        border-bottom: none;
      }

      &:not(:first-child):not(:last-child) {
        border-top: 1px solid #E5E7EB;
        border-bottom: 1px solid #E5E7EB;
      }
    }

    .item-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .item-text {
      flex: 1;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #1F2937;

      strong {
        font-weight: 700;
      }
    }

    .item-link {
      padding: 0;
      background: none;
      border: none;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #1E40AF;
      cursor: pointer;
      transition: color 0.15s ease;
      white-space: nowrap;

      &:hover {
        color: #1E3A8A;
      }
    }
  `]
})
export class AttentionListComponent {
  title = input<string>('Requieren Atención');
  items = input.required<AttentionItem[]>();

  onItemClick = output<AttentionItem>();

  totalCount = computed(() => {
    return this.items().reduce((acc, item) => acc + item.count, 0);
  });

  getIcon(type: string): string {
    switch (type) {
      case 'overdue': return 'triangle-alert';
      case 'promise': return 'timer';
      case 'communication': return 'message-circle';
      default: return 'alert-circle';
    }
  }

  getIconColor(type: string): string {
    switch (type) {
      case 'overdue': return '#EF4444';
      case 'promise': return '#F59E0B';
      case 'communication': return '#1E40AF';
      default: return '#6B7280';
    }
  }
}
