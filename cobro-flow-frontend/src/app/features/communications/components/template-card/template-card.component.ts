import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MessageTemplate, CHANNEL_LABELS, TEMPLATE_STATUS_LABELS } from '../../models/communications.models';

@Component({
  selector: 'app-template-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" (click)="onEdit.emit(template().id)">
      <!-- Top row: channel icon, name, status -->
      <div class="card-header">
        <div class="header-left">
          <span class="channel-icon" [innerHTML]="channelIcon()"></span>
          <span class="template-name">{{ template().name }}</span>
        </div>
        <span
          class="status-badge"
          [class.status-active]="template().status === 'active'"
          [class.status-draft]="template().status === 'draft'"
          [class.status-archived]="template().status === 'archived'"
        >
          {{ statusLabel() }}
        </span>
      </div>

      <!-- Usage count -->
      <div class="usage-label">
        Usado {{ template().timesUsed }} veces
      </div>

      <!-- Body preview -->
      <div class="body-preview" [innerHTML]="highlightedBody()"></div>

      <!-- Metrics row -->
      @if (hasMetrics()) {
        <div class="metrics-row">
          @if (template().openRate != null) {
            <div class="metric">
              <span class="metric-value">{{ template().openRate }}%</span>
              <span class="metric-label">Apertura</span>
            </div>
          }
          @if (template().clickRate != null) {
            <div class="metric">
              <span class="metric-value">{{ template().clickRate }}%</span>
              <span class="metric-label">Clics</span>
            </div>
          }
          @if (template().replyRate != null) {
            <div class="metric">
              <span class="metric-value">{{ template().replyRate }}%</span>
              <span class="metric-label">Respuesta</span>
            </div>
          }
          @if (template().conversionRate != null) {
            <div class="metric">
              <span class="metric-value">{{ template().conversionRate }}%</span>
              <span class="metric-label">Conversion</span>
            </div>
          }
        </div>
      }

      <!-- Actions row -->
      <div class="card-actions">
        <button
          type="button"
          class="action-btn edit-btn"
          (click)="handleEdit($event)"
          aria-label="Editar plantilla"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Editar
        </button>
        <button
          type="button"
          class="action-btn delete-btn"
          (click)="handleDelete($event)"
          aria-label="Eliminar plantilla"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .card:hover {
      border-color: #3B82F6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .channel-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #EFF6FF;
      color: #3B82F6;
      flex-shrink: 0;
    }

    .template-name {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .status-active {
      background: #D1FAE5;
      color: #065F46;
    }

    .status-draft {
      background: #F3F4F6;
      color: #6B7280;
    }

    .status-archived {
      background: #FEE2E2;
      color: #991B1B;
    }

    .usage-label {
      font-size: 13px;
      color: #6B7280;
    }

    .body-preview {
      font-size: 13px;
      color: #4B5563;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }

    :host ::ng-deep .var-highlight {
      color: #3B82F6;
      font-weight: 600;
    }

    .metrics-row {
      display: flex;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px solid #F3F4F6;
      flex-wrap: wrap;
    }

    .metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .metric-label {
      font-size: 11px;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #F3F4F6;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid #E5E7EB;
      background: white;
    }

    .edit-btn {
      color: #3B82F6;
    }

    .edit-btn:hover {
      background: #EFF6FF;
      border-color: #3B82F6;
    }

    .delete-btn {
      color: #EF4444;
    }

    .delete-btn:hover {
      background: #FEF2F2;
      border-color: #EF4444;
    }
  `]
})
export class TemplateCardComponent {
  // Inputs
  template = input.required<MessageTemplate>();

  // Outputs
  onEdit = output<string>();
  onDelete = output<string>();

  // Computed
  statusLabel = computed(() => TEMPLATE_STATUS_LABELS[this.template().status]);

  channelLabel = computed(() => CHANNEL_LABELS[this.template().channel]);

  channelIcon = computed(() => {
    switch (this.template().channel) {
      case 'email':
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>';
      case 'whatsapp':
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
      case 'sms':
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      case 'call':
      case 'ai_voice':
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path><path d="M14.05 2a9 9 0 0 1 8 7.94"></path><path d="M14.05 6A5 5 0 0 1 18 10"></path></svg>';
      default:
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>';
    }
  });

  highlightedBody = computed(() => {
    const body = this.template().body;
    return body.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="var-highlight">{{$1}}</span>'
    );
  });

  hasMetrics = computed(() => {
    const t = this.template();
    return t.openRate != null || t.clickRate != null || t.replyRate != null || t.conversionRate != null;
  });

  handleEdit(event: Event): void {
    event.stopPropagation();
    this.onEdit.emit(this.template().id);
  }

  handleDelete(event: Event): void {
    event.stopPropagation();
    this.onDelete.emit(this.template().id);
  }
}
