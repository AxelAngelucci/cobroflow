import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlidePanelComponent } from '../../../../shared/components/slide-panel/slide-panel.component';
import { StageDisplay } from '../campaign-stages/campaign-stages.component';

@Component({
  selector: 'app-stage-edit-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SlidePanelComponent],
  template: `
    <app-slide-panel
      [isOpen]="isOpen()"
      [title]="panelTitle()"
      size="md"
      (onClose)="onClose.emit()"
    >
      @if (stage()) {
        <div class="panel-form">
          <!-- Day range -->
          <div class="form-group">
            <label>Rango de días</label>
            <div class="range-inputs">
              <div class="range-field">
                <span class="range-label">Desde</span>
                <input
                  type="number"
                  class="form-input"
                  min="0"
                  [ngModel]="editDayStart()"
                  (ngModelChange)="editDayStart.set($event)"
                />
              </div>
              <span class="range-separator">—</span>
              <div class="range-field">
                <span class="range-label">Hasta</span>
                <input
                  type="number"
                  class="form-input"
                  min="0"
                  [ngModel]="editDayEnd()"
                  (ngModelChange)="editDayEnd.set($event)"
                />
              </div>
            </div>
          </div>

          <!-- Tone -->
          <div class="form-group">
            <label for="tone">Tono del mensaje</label>
            <select
              id="tone"
              class="form-input"
              [ngModel]="editTone()"
              (ngModelChange)="editTone.set($event)"
            >
              <option value="amigable">Amigable</option>
              <option value="firme">Firme</option>
              <option value="urgente">Urgente</option>
              <option value="legal">Legal</option>
            </select>
          </div>

          <!-- Instructions -->
          <div class="form-group">
            <label for="instructions">Instrucciones de tono</label>
            <textarea
              id="instructions"
              class="form-input textarea"
              rows="3"
              placeholder="Describe el tono que debe tener la IA..."
              [ngModel]="editInstructions()"
              (ngModelChange)="editInstructions.set($event)"
            ></textarea>
          </div>

          <!-- Frequency -->
          <div class="form-group">
            <label for="frequency">Frecuencia de contacto</label>
            <select
              id="frequency"
              class="form-input"
              [ngModel]="editFrequency()"
              (ngModelChange)="editFrequency.set($event)"
            >
              <option value="daily">Diaria</option>
              <option value="every_3_days">Cada 3 días</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
            </select>
          </div>

          <!-- Channels for this stage -->
          <div class="form-group">
            <label>Canales activos</label>
            <div class="channel-checks">
              @for (ch of channelOptions; track ch.value) {
                <label class="check-label">
                  <input
                    type="checkbox"
                    [checked]="editChannels().includes(ch.value)"
                    (change)="toggleChannel(ch.value)"
                  />
                  <span class="check-box"></span>
                  {{ ch.label }}
                </label>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="panel-actions">
            <button type="button" class="btn-secondary" (click)="onClose.emit()">
              Cancelar
            </button>
            <button type="button" class="btn-primary" (click)="save()">
              Guardar cambios
            </button>
          </div>
        </div>
      }
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

    label:not(.check-label) {
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
    }

    .form-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .textarea {
      resize: vertical;
      min-height: 80px;
    }

    .range-inputs {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .range-field {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .range-label {
      font-size: 12px;
      color: #6B7280;
    }

    .range-separator {
      color: #9CA3AF;
      margin-top: 20px;
    }

    .channel-checks {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .check-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
    }

    .check-label input {
      display: none;
    }

    .check-box {
      width: 18px;
      height: 18px;
      border: 2px solid #D1D5DB;
      border-radius: 4px;
      flex-shrink: 0;
      transition: all 0.15s ease;
      position: relative;
    }

    .check-label input:checked + .check-box {
      background: #3B82F6;
      border-color: #3B82F6;
    }

    .check-label input:checked + .check-box::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 0px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
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
export class StageEditPanelComponent {
  isOpen = input.required<boolean>();
  stage = input<StageDisplay | null>(null);

  onClose = output<void>();
  onSave = output<{
    id: string;
    dayStart: number;
    dayEnd: number;
    tone: string;
    instructions: string;
    frequency: string;
    channels: string[];
  }>();

  // Edit state
  editDayStart = signal(0);
  editDayEnd = signal(15);
  editTone = signal('amigable');
  editInstructions = signal('');
  editFrequency = signal('every_3_days');
  editChannels = signal<string[]>(['whatsapp', 'email']);

  channelOptions = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'call', label: 'Llamadas IA' }
  ];

  panelTitle(): string {
    const s = this.stage();
    return s ? `Editar Etapa: ${s.dayStart}-${s.dayEnd} días` : 'Editar Etapa';
  }

  toggleChannel(channel: string): void {
    this.editChannels.update(channels =>
      channels.includes(channel)
        ? channels.filter(c => c !== channel)
        : [...channels, channel]
    );
  }

  save(): void {
    const s = this.stage();
    if (!s) return;

    this.onSave.emit({
      id: s.id,
      dayStart: this.editDayStart(),
      dayEnd: this.editDayEnd(),
      tone: this.editTone(),
      instructions: this.editInstructions(),
      frequency: this.editFrequency(),
      channels: this.editChannels()
    });
  }
}
