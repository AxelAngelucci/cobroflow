import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowStep, MessageTemplate, ChannelType, StepConditionType, CHANNEL_LABELS, CONDITION_TYPE_LABELS } from '../../models/communications.models';

@Component({
  selector: 'app-workflow-step-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (step()) {
      <div class="editor-container">
        <!-- Tabs -->
        <div class="editor-tabs">
          @for (tab of tabs; track tab.key) {
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === tab.key"
              (click)="activeTab.set(tab.key)"
            >
              <span class="tab-icon">
                @switch (tab.key) {
                  @case ('contenido') {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  }
                  @case ('condiciones') {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  }
                  @case ('programacion') {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  }
                }
              </span>
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Tab: Contenido -->
          @if (activeTab() === 'contenido') {
            <div class="form-section">
              <div class="field-group">
                <label class="field-label">Nombre del paso</label>
                <input
                  type="text"
                  class="field-input"
                  [ngModel]="step()!.name"
                  (ngModelChange)="updateField('name', $event)"
                  placeholder="Ej: Recordatorio inicial"
                />
              </div>

              <div class="field-group">
                <label class="field-label">Canal</label>
                <select
                  class="field-input"
                  [ngModel]="step()!.channel"
                  (ngModelChange)="updateField('channel', $event)"
                >
                  @for (ch of channelOptions; track ch.value) {
                    <option [value]="ch.value">{{ ch.label }}</option>
                  }
                </select>
              </div>

              <div class="field-group">
                <label class="field-label">Plantilla</label>
                <select
                  class="field-input"
                  [ngModel]="step()!.templateId ?? ''"
                  (ngModelChange)="updateField('templateId', $event || undefined)"
                >
                  <option value="">Sin plantilla</option>
                  @for (tpl of filteredTemplates(); track tpl.id) {
                    <option [value]="tpl.id">{{ tpl.name }}</option>
                  }
                </select>
              </div>

              @if (step()!.channel === 'email' && selectedTemplate()) {
                <div class="field-group">
                  <label class="field-label">Asunto</label>
                  <input
                    type="text"
                    class="field-input readonly"
                    [value]="selectedTemplate()!.subject ?? ''"
                    readonly
                  />
                </div>
              }

              <div class="field-group">
                <label class="field-label">Cuerpo del mensaje</label>
                <textarea
                  class="field-textarea readonly"
                  [value]="selectedTemplate() ? selectedTemplate()!.body : 'Sin plantilla seleccionada'"
                  readonly
                  rows="6"
                ></textarea>
              </div>

              <div class="ai-toggle-section">
                <div class="ai-toggle-row">
                  <div class="ai-toggle-info">
                    <span class="ai-toggle-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 8V4H8"></path>
                        <rect x="2" y="2" width="20" height="8" rx="2"></rect>
                        <rect x="6" y="14" width="12" height="8" rx="2"></rect>
                        <path d="M12 10v4"></path>
                      </svg>
                      Habilitar IA
                    </span>
                    <span class="ai-toggle-desc">Permite personalizar el mensaje con IA</span>
                  </div>
                  <label class="toggle">
                    <input
                      type="checkbox"
                      [checked]="step()!.aiEnabled"
                      (change)="updateField('aiEnabled', !step()!.aiEnabled)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                @if (step()!.aiEnabled) {
                  <div class="field-group" style="margin-top: 12px;">
                    <label class="field-label">Instrucciones para IA</label>
                    <textarea
                      class="field-textarea"
                      [ngModel]="step()!.aiInstructions ?? ''"
                      (ngModelChange)="updateField('aiInstructions', $event)"
                      placeholder="Ej: Usar tono amigable, mencionar el nombre del cliente..."
                      rows="4"
                    ></textarea>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Tab: Condiciones -->
          @if (activeTab() === 'condiciones') {
            <div class="form-section">
              <div class="field-group">
                <label class="field-label">Tipo de condición</label>
                <select
                  class="field-input"
                  [ngModel]="step()!.conditionType"
                  (ngModelChange)="updateField('conditionType', $event)"
                >
                  @for (cond of conditionOptions; track cond.value) {
                    <option [value]="cond.value">{{ cond.label }}</option>
                  }
                </select>
                <span class="field-hint">Define cuándo se ejecutará este paso</span>
              </div>

              <div class="field-group">
                <label class="field-label">Canal alternativo (fallback)</label>
                <select
                  class="field-input"
                  [ngModel]="step()!.fallbackChannel ?? ''"
                  (ngModelChange)="updateField('fallbackChannel', $event || undefined)"
                >
                  <option value="">Sin canal alternativo</option>
                  @for (ch of channelOptions; track ch.value) {
                    <option [value]="ch.value">{{ ch.label }}</option>
                  }
                </select>
                <span class="field-hint">Canal a usar si el principal falla</span>
              </div>
            </div>
          }

          <!-- Tab: Programación -->
          @if (activeTab() === 'programacion') {
            <div class="form-section">
              <div class="delay-row">
                <div class="field-group">
                  <label class="field-label">Delay días</label>
                  <input
                    type="number"
                    class="field-input"
                    [ngModel]="step()!.delayDays"
                    (ngModelChange)="updateField('delayDays', $event)"
                    min="0"
                    max="365"
                  />
                </div>
                <div class="field-group">
                  <label class="field-label">Delay horas</label>
                  <input
                    type="number"
                    class="field-input"
                    [ngModel]="step()!.delayHours"
                    (ngModelChange)="updateField('delayHours', $event)"
                    min="0"
                    max="23"
                  />
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Hora de envío</label>
                <input
                  type="time"
                  class="field-input"
                  [ngModel]="step()!.sendTime ?? ''"
                  (ngModelChange)="updateField('sendTime', $event || undefined)"
                />
                <span class="field-hint">Hora preferida para enviar este paso</span>
              </div>

              <div class="delay-summary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <span>
                  @if (step()!.delayDays === 0 && step()!.delayHours === 0) {
                    Este paso se ejecutará inmediatamente después del anterior.
                  } @else {
                    Este paso se ejecutará después de
                    @if (step()!.delayDays > 0) {
                      {{ step()!.delayDays }} {{ step()!.delayDays === 1 ? 'día' : 'días' }}
                    }
                    @if (step()!.delayDays > 0 && step()!.delayHours > 0) {
                      y
                    }
                    @if (step()!.delayHours > 0) {
                      {{ step()!.delayHours }} {{ step()!.delayHours === 1 ? 'hora' : 'horas' }}
                    }
                    @if (step()!.sendTime) {
                      a las {{ step()!.sendTime }}
                    }.
                  }
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <p class="empty-title">Selecciona un paso para editarlo</p>
        <p class="empty-desc">Haz clic en un paso de la lista o agrega uno nuevo</p>
      </div>
    }
  `,
  styles: [`
    .editor-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    /* Tabs */
    .editor-tabs {
      display: flex;
      border-bottom: 1px solid #E5E7EB;
      padding: 0 20px;
      gap: 4px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 14px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 14px;
      font-weight: 500;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #374151;
    }

    .tab-btn.active {
      color: #3B82F6;
      border-bottom-color: #3B82F6;
    }

    .tab-icon {
      display: flex;
      align-items: center;
    }

    /* Tab Content */
    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Fields */
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .field-input {
      padding: 10px 12px;
      background: white;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      color: #111827;
      transition: border-color 0.15s ease;
      outline: none;
    }

    .field-input:focus {
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .field-input.readonly {
      background: #F9FAFB;
      color: #6B7280;
      cursor: default;
    }

    .field-textarea {
      padding: 10px 12px;
      background: white;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      color: #111827;
      resize: vertical;
      font-family: inherit;
      transition: border-color 0.15s ease;
      outline: none;
    }

    .field-textarea:focus {
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .field-textarea.readonly {
      background: #F9FAFB;
      color: #6B7280;
      cursor: default;
    }

    .field-hint {
      font-size: 12px;
      color: #9CA3AF;
    }

    select.field-input {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
    }

    /* Delay row */
    .delay-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* AI Toggle */
    .ai-toggle-section {
      padding: 16px;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
    }

    .ai-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ai-toggle-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .ai-toggle-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .ai-toggle-desc {
      font-size: 12px;
      color: #6B7280;
    }

    /* Toggle */
    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      cursor: pointer;
      flex-shrink: 0;
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

    /* Delay summary */
    .delay-summary {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 8px;
      font-size: 13px;
      color: #1E40AF;
    }

    .delay-summary svg {
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 400px;
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: #F3F4F6;
      border-radius: 50%;
      color: #9CA3AF;
      margin-bottom: 20px;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 6px 0;
    }

    .empty-desc {
      font-size: 14px;
      color: #6B7280;
      margin: 0;
    }

    @media (max-width: 768px) {
      .editor-tabs {
        overflow-x: auto;
        padding: 0 12px;
      }

      .tab-content {
        padding: 16px;
      }

      .delay-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WorkflowStepEditorComponent {
  step = input<WorkflowStep | null>(null);
  templates = input<MessageTemplate[]>([]);

  stepChange = output<WorkflowStep>();

  activeTab = signal<'contenido' | 'condiciones' | 'programacion'>('contenido');

  tabs = [
    { key: 'contenido' as const, label: 'Contenido' },
    { key: 'condiciones' as const, label: 'Condiciones' },
    { key: 'programacion' as const, label: 'Programación' }
  ];

  channelOptions: { value: ChannelType; label: string }[] = [
    { value: 'email', label: CHANNEL_LABELS.email },
    { value: 'whatsapp', label: CHANNEL_LABELS.whatsapp },
    { value: 'sms', label: CHANNEL_LABELS.sms },
    { value: 'call', label: CHANNEL_LABELS.call },
  ];

  conditionOptions: { value: StepConditionType; label: string }[] = [
    { value: 'none', label: CONDITION_TYPE_LABELS.none },
    { value: 'previous_not_opened', label: CONDITION_TYPE_LABELS.previous_not_opened },
    { value: 'previous_not_replied', label: CONDITION_TYPE_LABELS.previous_not_replied },
    { value: 'previous_bounced', label: CONDITION_TYPE_LABELS.previous_bounced },
    { value: 'invoice_still_unpaid', label: CONDITION_TYPE_LABELS.invoice_still_unpaid },
  ];

  filteredTemplates = computed(() => {
    const currentStep = this.step();
    if (!currentStep) return [];
    return this.templates().filter(t => t.channel === currentStep.channel);
  });

  selectedTemplate = computed(() => {
    const currentStep = this.step();
    if (!currentStep?.templateId) return null;
    return this.templates().find(t => t.id === currentStep.templateId) ?? null;
  });

  updateField(field: string, value: unknown): void {
    const currentStep = this.step();
    if (!currentStep) return;

    const updated: WorkflowStep = { ...currentStep, [field]: value };

    // When channel changes, clear template if it no longer matches
    if (field === 'channel') {
      const tpl = this.templates().find(t => t.id === updated.templateId);
      if (tpl && tpl.channel !== value) {
        updated.templateId = undefined;
      }
    }

    this.stepChange.emit(updated);
  }
}
