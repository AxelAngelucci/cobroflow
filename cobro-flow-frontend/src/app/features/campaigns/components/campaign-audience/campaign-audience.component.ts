import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface AudienceConfig {
  minDaysOverdue: number;
  maxDaysOverdue: number;
  minAmount: number;
  tags: string[];
}

@Component({
  selector: 'app-campaign-audience',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="form-section">
      <h3 class="section-title">Audiencia</h3>
      <p class="section-desc">Define qué clientes recibirán esta campaña</p>

      <div class="form-grid">
        <div class="form-group">
          <label for="min-days">Días de vencimiento (desde)</label>
          <input
            id="min-days"
            type="number"
            class="form-input"
            min="0"
            placeholder="0"
            [ngModel]="data().minDaysOverdue"
            (ngModelChange)="updateField('minDaysOverdue', $event)"
          />
        </div>

        <div class="form-group">
          <label for="max-days">Días de vencimiento (hasta)</label>
          <input
            id="max-days"
            type="number"
            class="form-input"
            min="0"
            placeholder="30"
            [ngModel]="data().maxDaysOverdue"
            (ngModelChange)="updateField('maxDaysOverdue', $event)"
          />
        </div>

        <div class="form-group">
          <label for="min-amount">Monto mínimo (ARS)</label>
          <input
            id="min-amount"
            type="number"
            class="form-input"
            min="0"
            placeholder="10000"
            [ngModel]="data().minAmount"
            (ngModelChange)="updateField('minAmount', $event)"
          />
        </div>
      </div>

      <!-- Tags -->
      <div class="form-group">
        <label>Tags de segmentación</label>
        <div class="tags-container">
          @for (tag of data().tags; track tag) {
            <span class="tag">
              {{ tag }}
              <button type="button" class="tag-remove" (click)="removeTag(tag)" aria-label="Remover tag {{ tag }}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </span>
          }
          <input
            type="text"
            class="tag-input"
            placeholder="Agregar tag..."
            [ngModel]="newTag()"
            (ngModelChange)="newTag.set($event)"
            (keydown.enter)="addTag()"
          />
        </div>
      </div>

      <!-- Selected count badge -->
      <div class="audience-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
        <span>{{ selectedCount() }} clientes seleccionados</span>
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
      grid-template-columns: repeat(3, 1fr);
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
    }

    .form-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      min-height: 42px;
      align-items: center;
    }

    .tag {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #EFF6FF;
      color: #1D4ED8;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    .tag-remove {
      display: flex;
      align-items: center;
      padding: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #1D4ED8;
      opacity: 0.6;
    }

    .tag-remove:hover {
      opacity: 1;
    }

    .tag-input {
      border: none;
      outline: none;
      font-size: 14px;
      flex: 1;
      min-width: 100px;
    }

    .tag-input::placeholder {
      color: #9CA3AF;
    }

    .audience-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 8px 16px;
      background: #F0FDF4;
      color: #15803D;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CampaignAudienceComponent {
  data = input<AudienceConfig>({ minDaysOverdue: 0, maxDaysOverdue: 30, minAmount: 10000, tags: [] });
  selectedCount = input(0);
  onChange = output<AudienceConfig>();

  newTag = signal('');

  updateField(field: keyof AudienceConfig, value: number): void {
    this.onChange.emit({ ...this.data(), [field]: value });
  }

  addTag(): void {
    const tag = this.newTag().trim();
    if (tag && !this.data().tags.includes(tag)) {
      this.onChange.emit({ ...this.data(), tags: [...this.data().tags, tag] });
      this.newTag.set('');
    }
  }

  removeTag(tag: string): void {
    this.onChange.emit({ ...this.data(), tags: this.data().tags.filter(t => t !== tag) });
  }
}
