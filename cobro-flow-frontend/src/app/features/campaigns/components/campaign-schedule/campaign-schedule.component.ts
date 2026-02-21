import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ScheduleConfig {
  startDate: string;
  sendTime: string;
  autoResend: boolean;
  autoEscalate: boolean;
  pauseOnPayment: boolean;
}

@Component({
  selector: 'app-campaign-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="form-section">
      <h3 class="section-title">Programación</h3>
      <p class="section-desc">Configura cuándo se ejecutará la campaña</p>

      <div class="form-grid">
        <div class="form-group">
          <label for="start-date">Fecha de inicio</label>
          <input
            id="start-date"
            type="date"
            class="form-input"
            [ngModel]="data().startDate"
            (ngModelChange)="updateField('startDate', $event)"
          />
        </div>

        <div class="form-group">
          <label for="send-time">Hora de envío</label>
          <input
            id="send-time"
            type="time"
            class="form-input"
            [ngModel]="data().sendTime"
            (ngModelChange)="updateField('sendTime', $event)"
          />
        </div>
      </div>

      <div class="checkboxes">
        <label class="checkbox-label">
          <input
            type="checkbox"
            [checked]="data().autoResend"
            (change)="toggleField('autoResend')"
          />
          <span class="checkbox-custom"></span>
          <div class="checkbox-text">
            <span class="checkbox-title">Reenviar automáticamente</span>
            <span class="checkbox-desc">Reenviar a clientes que no respondieron</span>
          </div>
        </label>

        <label class="checkbox-label">
          <input
            type="checkbox"
            [checked]="data().autoEscalate"
            (change)="toggleField('autoEscalate')"
          />
          <span class="checkbox-custom"></span>
          <div class="checkbox-text">
            <span class="checkbox-title">Escalamiento automático</span>
            <span class="checkbox-desc">Cambiar de etapa según los días configurados</span>
          </div>
        </label>

        <label class="checkbox-label">
          <input
            type="checkbox"
            [checked]="data().pauseOnPayment"
            (change)="toggleField('pauseOnPayment')"
          />
          <span class="checkbox-custom"></span>
          <div class="checkbox-text">
            <span class="checkbox-title">Pausar al recibir pago</span>
            <span class="checkbox-desc">Detener mensajes cuando el cliente paga</span>
          </div>
        </label>
      </div>
    </div>
  `,
  styles: [`
    .form-section {
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .section-desc {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 20px 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label:not(.checkbox-label) {
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
    }

    .form-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .checkboxes {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 12px 16px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      transition: background 0.15s ease;
    }

    .checkbox-label:hover {
      background: #F9FAFB;
    }

    .checkbox-label input {
      display: none;
    }

    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #D1D5DB;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 2px;
      transition: all 0.15s ease;
      position: relative;
    }

    .checkbox-label input:checked + .checkbox-custom {
      background: #3B82F6;
      border-color: #3B82F6;
    }

    .checkbox-label input:checked + .checkbox-custom::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 1px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .checkbox-title {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
    }

    .checkbox-desc {
      font-size: 13px;
      color: #6B7280;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CampaignScheduleComponent {
  data = input<ScheduleConfig>({
    startDate: '',
    sendTime: '09:00',
    autoResend: true,
    autoEscalate: true,
    pauseOnPayment: true
  });
  onChange = output<ScheduleConfig>();

  updateField(field: keyof ScheduleConfig, value: string): void {
    this.onChange.emit({ ...this.data(), [field]: value });
  }

  toggleField(field: 'autoResend' | 'autoEscalate' | 'pauseOnPayment'): void {
    const current = this.data();
    this.onChange.emit({ ...current, [field]: !current[field] });
  }
}
