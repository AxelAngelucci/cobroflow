import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CampaignStage } from '../../models/campaigns.models';

export interface StageDisplay {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  color: string;
  bgColor: string;
  toneInstructions?: string;
}

@Component({
  selector: 'app-campaign-stages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-section">
      <div class="section-header">
        <div>
          <h3 class="section-title">Reglas de Escalamiento</h3>
          <p class="section-desc">Etapas de cobranza según los días de mora</p>
        </div>
        <button type="button" class="edit-rules-btn" (click)="onEditRules.emit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Editar reglas
        </button>
      </div>

      <div class="stages-timeline">
        @for (stage of stages(); track stage.id) {
          <div
            class="stage-card"
            [style.border-left-color]="stage.color"
            (click)="onEditStage.emit(stage)"
          >
            <div class="stage-header">
              <span class="stage-badge" [style.background]="stage.bgColor" [style.color]="stage.color">
                {{ stage.name }}
              </span>
              <span class="stage-days">{{ stage.dayStart }}-{{ stage.dayEnd }} días</span>
            </div>
            @if (stage.toneInstructions) {
              <p class="stage-tone">{{ stage.toneInstructions }}</p>
            }
          </div>
        } @empty {
          <div class="empty-stages">
            <p>No hay etapas configuradas</p>
            <button type="button" class="add-stage-btn" (click)="onEditRules.emit()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Agregar etapa
            </button>
          </div>
        }
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

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
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
      margin: 0;
    }

    .edit-rules-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .edit-rules-btn:hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .stages-timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stage-card {
      padding: 16px 20px;
      border: 1px solid #E5E7EB;
      border-left-width: 4px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .stage-card:hover {
      background: #F9FAFB;
    }

    .stage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stage-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
    }

    .stage-days {
      font-size: 13px;
      color: #6B7280;
      font-weight: 500;
    }

    .stage-tone {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #6B7280;
    }

    .empty-stages {
      text-align: center;
      padding: 24px;
      color: #9CA3AF;
    }

    .empty-stages p {
      margin: 0 0 12px 0;
    }

    .add-stage-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .add-stage-btn:hover {
      background: #2563EB;
    }
  `]
})
export class CampaignStagesComponent {
  stages = input<StageDisplay[]>([]);
  onEditStage = output<StageDisplay>();
  onEditRules = output<void>();
}
