import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { WorkflowStep, CHANNEL_LABELS } from '../../models/communications.models';

@Component({
  selector: 'app-workflow-step-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="step-list-container">
      <div class="step-list-header">
        <h3>Pasos del Workflow</h3>
        <span class="step-count">{{ steps().length }} pasos</span>
      </div>

      <div class="steps">
        @for (step of steps(); track step.id; let i = $index; let last = $last) {
          <div
            class="step-item"
            [class.selected]="selectedStepId() === step.id"
            (click)="stepSelect.emit(step.id)"
          >
            <div class="step-connector">
              <div class="step-circle" [class]="'channel-' + step.channel">
                {{ step.stepOrder }}
              </div>
              @if (!last) {
                <div class="step-line"></div>
              }
            </div>

            <div class="step-content">
              <div class="step-top-row">
                <span class="step-channel-icon">
                  @switch (step.channel) {
                    @case ('email') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    }
                    @case ('whatsapp') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    }
                    @case ('sms') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    }
                    @case ('call') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        <path d="M14.05 2a9 9 0 0 1 8 7.94"></path>
                        <path d="M14.05 6A5 5 0 0 1 18 10"></path>
                      </svg>
                    }
                    @default {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    }
                  }
                </span>
                <span class="step-name">{{ step.name }}</span>
              </div>
              <div class="step-meta">
                <span class="step-channel-label">{{ getChannelLabel(step.channel) }}</span>
                <span class="meta-dot"></span>
                <span class="step-delay">{{ getDelayDescription(step) }}</span>
              </div>
            </div>

            <!-- Step actions (visible on hover) -->
            <div class="step-actions">
              @if (i > 0) {
                <button type="button" class="step-action-btn" title="Mover arriba" (click)="onMoveUp(step.id, $event)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
              }
              @if (!last) {
                <button type="button" class="step-action-btn" title="Mover abajo" (click)="onMoveDown(step.id, $event)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              }
              <button type="button" class="step-action-btn delete-btn" title="Eliminar paso" (click)="onDelete(step.id, $event)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        }
      </div>

      <button type="button" class="add-step-btn" (click)="addStep.emit()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Agregar paso
      </button>
    </div>
  `,
  styles: [`
    .step-list-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .step-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 16px;
      border-bottom: 1px solid #F3F4F6;
    }

    .step-list-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #111827;
    }

    .step-count {
      font-size: 13px;
      color: #6B7280;
      font-weight: 500;
    }

    .steps {
      flex: 1;
      overflow-y: auto;
      padding: 12px 0;
    }

    .step-item {
      display: flex;
      gap: 12px;
      padding: 12px 20px;
      cursor: pointer;
      border-left: 3px solid transparent;
      transition: all 0.15s ease;
      position: relative;
    }

    .step-item:hover {
      background: #F9FAFB;
    }

    .step-item:hover .step-actions {
      opacity: 1;
    }

    .step-item.selected {
      border-left-color: #3B82F6;
      background: #EFF6FF;
    }

    .step-connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }

    .step-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
      background: #6B7280;
    }

    .step-circle.channel-email {
      background: #3B82F6;
    }

    .step-circle.channel-whatsapp {
      background: #10B981;
    }

    .step-circle.channel-sms {
      background: #F59E0B;
    }

    .step-circle.channel-call {
      background: #6B7280;
    }

    .step-circle.channel-ai_voice {
      background: #8B5CF6;
    }

    .step-line {
      width: 2px;
      flex: 1;
      min-height: 20px;
      background: #E5E7EB;
      margin: 4px 0;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 4px;
      min-width: 0;
    }

    .step-top-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-channel-icon {
      display: flex;
      align-items: center;
      color: #6B7280;
      flex-shrink: 0;
    }

    .step-name {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .step-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6B7280;
    }

    .meta-dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #D1D5DB;
      flex-shrink: 0;
    }

    .step-channel-label {
      font-weight: 500;
    }

    .step-delay {
      white-space: nowrap;
    }

    .step-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s ease;
      flex-shrink: 0;
      align-self: center;
    }

    .step-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #9CA3AF;
      transition: all 0.15s ease;
    }

    .step-action-btn:hover {
      background: #F3F4F6;
      border-color: #E5E7EB;
      color: #374151;
    }

    .step-action-btn.delete-btn:hover {
      background: #FEF2F2;
      border-color: #FECACA;
      color: #EF4444;
    }

    .add-step-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 12px 20px 20px;
      padding: 12px;
      background: transparent;
      border: 2px dashed #D1D5DB;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .add-step-btn:hover {
      border-color: #3B82F6;
      color: #3B82F6;
      background: #EFF6FF;
    }
  `]
})
export class WorkflowStepListComponent {
  steps = input.required<WorkflowStep[]>();
  selectedStepId = input<string | null>(null);

  stepSelect = output<string>();
  addStep = output<void>();
  deleteStep = output<string>();
  moveStepUp = output<string>();
  moveStepDown = output<string>();

  onMoveUp(stepId: string, event: Event): void {
    event.stopPropagation();
    this.moveStepUp.emit(stepId);
  }

  onMoveDown(stepId: string, event: Event): void {
    event.stopPropagation();
    this.moveStepDown.emit(stepId);
  }

  onDelete(stepId: string, event: Event): void {
    event.stopPropagation();
    this.deleteStep.emit(stepId);
  }

  getChannelLabel(channel: string): string {
    return CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS] ?? channel;
  }

  getDelayDescription(step: WorkflowStep): string {
    const days = step.delayDays;
    const hours = step.delayHours;

    if (days === 0 && hours === 0) {
      return 'Inmediato';
    }

    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
    }
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    }
    return 'Después de ' + parts.join(' ');
  }
}
