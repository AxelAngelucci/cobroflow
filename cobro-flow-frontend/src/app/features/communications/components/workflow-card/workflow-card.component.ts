import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CollectionWorkflow, WorkflowStep, WORKFLOW_STATUS_LABELS, CHANNEL_LABELS } from '../../models/communications.models';

@Component({
  selector: 'app-workflow-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <!-- Header -->
      <div class="card-header">
        <h3 class="workflow-name">{{ workflow().name }}</h3>
        <span class="status-badge" [class]="'status-' + workflow().status">
          {{ statusLabel }}
        </span>
      </div>

      <!-- Description -->
      @if (workflow().description) {
        <p class="description">{{ workflow().description }}</p>
      }

      <!-- Trigger -->
      @if (workflow().triggerDescription) {
        <p class="trigger">{{ workflow().triggerDescription }}</p>
      }

      <!-- Steps visualization -->
      @if (workflow().steps.length > 0) {
        <div class="steps-row">
          @for (step of workflow().steps; track step.id; let last = $last) {
            <div class="step-item" [title]="CHANNEL_LABELS[step.channel] + ': ' + step.name">
              <div class="step-icon">
                @switch (step.channel) {
                  @case ('email') {
                    <!-- Envelope icon -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  }
                  @case ('whatsapp') {
                    <!-- Phone icon -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                  }
                  @case ('sms') {
                    <!-- Chat bubble icon -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  }
                  @case ('call') {
                    <!-- Phone call icon -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  }
                  @case ('ai_voice') {
                    <!-- AI voice icon -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  }
                }
              </div>
            </div>
            @if (!last) {
              <span class="step-arrow">&rarr;</span>
            }
          }
        </div>
      }

      <!-- Footer -->
      <div class="card-footer">
        <div class="footer-stats">
          <span class="stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            {{ workflow().totalExecutions }} ejecuciones
          </span>
          @if (workflow().successRate != null) {
            <span class="stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {{ workflow().successRate }}% efectividad
            </span>
          }
        </div>
        <button type="button" class="edit-btn" (click)="handleEdit()" title="Editar workflow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Editar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
    }

    .card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #D1D5DB;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .workflow-name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
      line-height: 1.4;
    }

    .status-badge {
      flex-shrink: 0;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-active {
      background: #D1FAE5;
      color: #065F46;
    }

    .status-draft {
      background: #F3F4F6;
      color: #4B5563;
    }

    .status-paused {
      background: #FEF3C7;
      color: #92400E;
    }

    .status-archived {
      background: #FEE2E2;
      color: #991B1B;
    }

    .description {
      font-size: 14px;
      color: #6B7280;
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .trigger {
      font-size: 13px;
      color: #9CA3AF;
      font-style: italic;
      margin: 0;
      line-height: 1.4;
    }

    .steps-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 8px 0;
    }

    .step-item {
      display: flex;
      align-items: center;
    }

    .step-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #EFF6FF;
      color: #3B82F6;
      transition: background 0.15s ease;
    }

    .step-item:hover .step-icon {
      background: #DBEAFE;
    }

    .step-arrow {
      color: #D1D5DB;
      font-size: 14px;
      font-weight: 500;
      user-select: none;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #F3F4F6;
      gap: 12px;
    }

    .footer-stats {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #6B7280;
    }

    .stat svg {
      color: #9CA3AF;
    }

    .edit-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .edit-btn:hover {
      background: #F9FAFB;
      border-color: #3B82F6;
      color: #3B82F6;
    }

    @media (max-width: 768px) {
      .card-footer {
        flex-direction: column;
        align-items: flex-start;
      }

      .edit-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class WorkflowCardComponent {
  workflow = input.required<CollectionWorkflow>();

  onEdit = output<string>();
  onDelete = output<string>();

  protected readonly CHANNEL_LABELS = CHANNEL_LABELS;

  get statusLabel(): string {
    return WORKFLOW_STATUS_LABELS[this.workflow().status];
  }

  handleEdit(): void {
    this.onEdit.emit(this.workflow().id);
  }

  handleDelete(): void {
    this.onDelete.emit(this.workflow().id);
  }
}
