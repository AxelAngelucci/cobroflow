import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CampaignType, CAMPAIGN_TYPE_LABELS } from '../../models/campaigns.models';

export interface CampaignBasicInfo {
  name: string;
  campaignType: CampaignType | '';
  description: string;
}

@Component({
  selector: 'app-campaign-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="form-section">
      <h3 class="section-title">Información Básica</h3>
      <p class="section-desc">Define el nombre y tipo de tu campaña</p>

      <div class="form-grid">
        <div class="form-group">
          <label for="campaign-name">Nombre de la campaña *</label>
          <input
            id="campaign-name"
            type="text"
            class="form-input"
            placeholder="Ej: Recordatorio preventivo Q1"
            [ngModel]="data().name"
            (ngModelChange)="updateField('name', $event)"
          />
        </div>

        <div class="form-group">
          <label for="campaign-type">Tipo de campaña</label>
          <select
            id="campaign-type"
            class="form-input"
            [ngModel]="data().campaignType"
            (ngModelChange)="updateField('campaignType', $event)"
          >
            <option value="">Seleccionar tipo</option>
            @for (type of campaignTypes; track type.value) {
              <option [value]="type.value">{{ type.label }}</option>
            }
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="campaign-desc">Descripción</label>
        <textarea
          id="campaign-desc"
          class="form-input textarea"
          rows="3"
          placeholder="Describe el objetivo de esta campaña..."
          [ngModel]="data().description"
          (ngModelChange)="updateField('description', $event)"
        ></textarea>
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
      margin-bottom: 16px;
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
      min-height: 80px;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CampaignFormComponent {
  data = input<CampaignBasicInfo>({ name: '', campaignType: '', description: '' });
  onChange = output<CampaignBasicInfo>();

  campaignTypes = [
    { value: 'preventive', label: CAMPAIGN_TYPE_LABELS.preventive },
    { value: 'friendly', label: CAMPAIGN_TYPE_LABELS.friendly },
    { value: 'assertive', label: CAMPAIGN_TYPE_LABELS.assertive },
    { value: 'legal', label: CAMPAIGN_TYPE_LABELS.legal }
  ];

  updateField(field: keyof CampaignBasicInfo, value: string): void {
    this.onChange.emit({ ...this.data(), [field]: value });
  }
}
