import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlidePanelComponent } from '../../../../shared/components/slide-panel/slide-panel.component';
import { MessageTemplate, ChannelType, CHANNEL_LABELS } from '../../models/communications.models';

@Component({
  selector: 'app-template-form-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SlidePanelComponent],
  template: `
    <app-slide-panel
      [isOpen]="isOpen()"
      [title]="panelTitle()"
      size="md"
      (onClose)="onClose.emit()"
    >
      <div class="panel-form">
        <!-- Nombre -->
        <div class="form-group">
          <label for="tpl-name">Nombre</label>
          <input
            id="tpl-name"
            type="text"
            class="form-input"
            placeholder="Nombre de la plantilla"
            [ngModel]="formName()"
            (ngModelChange)="formName.set($event)"
          />
        </div>

        <!-- Canal -->
        <div class="form-group">
          <label for="tpl-channel">Canal</label>
          <select
            id="tpl-channel"
            class="form-input"
            [ngModel]="formChannel()"
            (ngModelChange)="formChannel.set($event)"
          >
            @for (ch of channelOptions; track ch.value) {
              <option [value]="ch.value">{{ ch.label }}</option>
            }
          </select>
        </div>

        <!-- Asunto (solo email) -->
        @if (formChannel() === 'email') {
          <div class="form-group">
            <label for="tpl-subject">Asunto</label>
            <input
              id="tpl-subject"
              type="text"
              class="form-input"
              placeholder="Asunto del email"
              [ngModel]="formSubject()"
              (ngModelChange)="formSubject.set($event)"
            />
          </div>
        }

        <!-- Cuerpo -->
        <div class="form-group">
          <label for="tpl-body">Cuerpo</label>
          <textarea
            id="tpl-body"
            class="form-input textarea"
            rows="8"
            [placeholder]="bodyPlaceholder"
            [ngModel]="formBody()"
            (ngModelChange)="formBody.set($event)"
          ></textarea>
        </div>

        <!-- Variables -->
        <div class="form-group">
          <label for="tpl-variables">Variables</label>
          <input
            id="tpl-variables"
            type="text"
            class="form-input"
            placeholder="nombre, monto, fecha_vencimiento"
            [ngModel]="formVariables()"
            (ngModelChange)="formVariables.set($event)"
          />
          <span class="helper-text">Variables disponibles: nombre, monto, fecha_vencimiento, empresa, numero_factura...</span>
        </div>

        <!-- Actions -->
        <div class="panel-actions">
          <button type="button" class="btn-secondary" (click)="onClose.emit()">
            Cancelar
          </button>
          <button type="button" class="btn-primary" (click)="save()">
            {{ template() ? 'Guardar cambios' : 'Crear plantilla' }}
          </button>
        </div>
      </div>
    </app-slide-panel>
  `,
  styles: [`
    .panel-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .form-input {
      padding: 10px 12px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.15s ease;
      background: white;
      font-family: inherit;
    }

    .form-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input::placeholder {
      color: #9CA3AF;
    }

    .textarea {
      resize: vertical;
      min-height: 160px;
      line-height: 1.5;
    }

    .helper-text {
      font-size: 12px;
      color: #9CA3AF;
      line-height: 1.4;
    }

    .panel-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
    }

    .btn-primary,
    .btn-secondary {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
      border: none;
    }

    .btn-primary:hover {
      background: #2563EB;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #E5E7EB;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
    }
  `]
})
export class TemplateFormPanelComponent {
  // Inputs
  isOpen = input.required<boolean>();
  template = input<MessageTemplate | null>(null);

  // Outputs
  onClose = output<void>();
  onSave = output<{
    name: string;
    channel: ChannelType;
    subject: string;
    body: string;
    variables: string[];
  }>();

  // Form state
  formName = signal('');
  formChannel = signal<ChannelType>('email');
  formSubject = signal('');
  formBody = signal('');
  formVariables = signal('');

  bodyPlaceholder = 'Escribe el contenido de la plantilla. Usa {{variable}} para variables dinamicas.';

  channelOptions: { value: ChannelType; label: string }[] = [
    { value: 'email', label: CHANNEL_LABELS['email'] },
    { value: 'whatsapp', label: CHANNEL_LABELS['whatsapp'] },
    { value: 'sms', label: CHANNEL_LABELS['sms'] },
    { value: 'call', label: CHANNEL_LABELS['call'] },
  ];

  constructor() {
    // Populate form when panel opens with template data
    effect(() => {
      const open = this.isOpen();
      const tpl = this.template();

      if (open && tpl) {
        // Edit mode: populate form
        this.formName.set(tpl.name);
        this.formChannel.set(tpl.channel);
        this.formSubject.set(tpl.subject ?? '');
        this.formBody.set(tpl.body);
        this.formVariables.set(tpl.variables?.join(', ') ?? '');
      } else if (open && !tpl) {
        // Create mode: reset form
        this.formName.set('');
        this.formChannel.set('email');
        this.formSubject.set('');
        this.formBody.set('');
        this.formVariables.set('');
      }
    });
  }

  panelTitle(): string {
    return this.template() ? 'Editar Plantilla' : 'Nueva Plantilla';
  }

  save(): void {
    const variables = this.formVariables()
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    this.onSave.emit({
      name: this.formName(),
      channel: this.formChannel(),
      subject: this.formSubject(),
      body: this.formBody(),
      variables,
    });
  }
}
