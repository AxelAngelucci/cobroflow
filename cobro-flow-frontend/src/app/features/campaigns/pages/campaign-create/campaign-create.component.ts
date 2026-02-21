import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CampaignFormComponent, CampaignBasicInfo } from '../../components/campaign-form/campaign-form.component';
import { CampaignAudienceComponent, AudienceConfig } from '../../components/campaign-audience/campaign-audience.component';
import { CampaignChannelsComponent, ChannelConfig } from '../../components/campaign-channels/campaign-channels.component';
import { CampaignScheduleComponent, ScheduleConfig } from '../../components/campaign-schedule/campaign-schedule.component';
import { CampaignStagesComponent, StageDisplay } from '../../components/campaign-stages/campaign-stages.component';
import { StageEditPanelComponent } from '../../components/stage-edit-panel/stage-edit-panel.component';
import { CampaignsService } from '../../services/campaigns.service';
import { CreateCampaignRequest, CreateCampaignStageRequest, CreateStageActionRequest } from '../../models/api.models';
import { CampaignType, ChannelType } from '../../models/campaigns.models';

@Component({
  selector: 'app-campaign-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CampaignFormComponent,
    CampaignAudienceComponent,
    CampaignChannelsComponent,
    CampaignScheduleComponent,
    CampaignStagesComponent,
    StageEditPanelComponent
  ],
  template: `
    <div class="create-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button type="button" class="back-btn" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="header-text">
            <h1>Nueva Campaña de Cobranza</h1>
            <p>Configura los detalles de tu campaña</p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-ghost" (click)="goBack()">Cancelar</button>
          <button type="button" class="btn-secondary" (click)="saveDraft()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Guardar borrador
          </button>
          <button type="button" class="btn-primary" (click)="createCampaign()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            Crear campaña
          </button>
        </div>
      </header>

      <!-- Form sections -->
      <div class="form-container">
        <!-- Section 1: Basic Info -->
        <app-campaign-form
          [data]="basicInfo()"
          (onChange)="basicInfo.set($event)"
        />

        <!-- Section 2: Audience -->
        <app-campaign-audience
          [data]="audienceConfig()"
          [selectedCount]="selectedClients()"
          (onChange)="audienceConfig.set($event)"
        />

        <!-- Section 3: Channels -->
        <app-campaign-channels
          [data]="channelConfig()"
          (onChange)="channelConfig.set($event)"
        />

        <!-- Section 4: Schedule -->
        <app-campaign-schedule
          [data]="scheduleConfig()"
          (onChange)="scheduleConfig.set($event)"
        />

        <!-- Section 5: AI Agent -->
        <div class="ai-agent-card">
          <div class="ai-gradient">
            <div class="ai-content">
              <div class="ai-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 8V4H8"></path>
                  <rect x="2" y="2" width="20" height="8" rx="2"></rect>
                  <rect x="6" y="14" width="12" height="8" rx="2"></rect>
                  <path d="M12 10v4"></path>
                  <path d="M2 10h20"></path>
                </svg>
              </div>
              <div class="ai-text">
                <h3>Agente IA</h3>
                <p>Personaliza cómo el agente IA se comunica con tus clientes</p>
              </div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                [checked]="aiEnabled()"
                (change)="aiEnabled.set(!aiEnabled())"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Section 6: Escalation Stages -->
        <app-campaign-stages
          [stages]="defaultStages"
          (onEditStage)="openStagePanel($event)"
          (onEditRules)="openStagePanel(defaultStages[0])"
        />
      </div>

      <!-- Stage Edit Panel -->
      <app-stage-edit-panel
        [isOpen]="isStagePanelOpen()"
        [stage]="editingStage()"
        (onClose)="closeStagePanel()"
        (onSave)="handleStageSave($event)"
      />
    </div>
  `,
  styles: [`
    .create-page {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 24px 32px;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      flex-wrap: wrap;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      background: transparent;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      color: #6B7280;
      transition: all 0.15s ease;
    }

    .back-btn:hover {
      background: #F9FAFB;
      color: #374151;
    }

    .header-text h1 {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .header-text p {
      font-size: 14px;
      color: #6B7280;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary,
    .btn-secondary,
    .btn-ghost {
      display: flex;
      align-items: center;
      gap: 6px;
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
      border-color: #D1D5DB;
    }

    .btn-ghost {
      background: transparent;
      color: #6B7280;
      border: none;
    }

    .btn-ghost:hover {
      color: #374151;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 32px;
      max-width: 900px;
    }

    /* AI Agent Card */
    .ai-agent-card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .ai-gradient {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    }

    .ai-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .ai-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      color: white;
    }

    .ai-text h3 {
      margin: 0 0 4px 0;
      font-size: 17px;
      font-weight: 600;
      color: white;
    }

    .ai-text p {
      margin: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Toggle */
    .toggle {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
      cursor: pointer;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 26px;
      transition: all 0.2s ease;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .toggle input:checked + .toggle-slider {
      background: rgba(255, 255, 255, 0.5);
    }

    .toggle input:checked + .toggle-slider::before {
      transform: translateX(22px);
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 16px 20px;
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        flex-wrap: wrap;
      }

      .header-actions button {
        flex: 1;
        justify-content: center;
      }

      .form-container {
        padding: 20px;
      }
    }
  `]
})
export class CampaignCreateComponent {
  private readonly router = inject(Router);
  private readonly campaignsService = inject(CampaignsService);

  // Form state
  basicInfo = signal<CampaignBasicInfo>({ name: '', campaignType: '', description: '' });
  audienceConfig = signal<AudienceConfig>({ minDaysOverdue: 0, maxDaysOverdue: 30, minAmount: 10000, tags: [] });
  channelConfig = signal<ChannelConfig>({ whatsapp: true, email: true, sms: false, call: false });
  scheduleConfig = signal<ScheduleConfig>({
    startDate: new Date().toISOString().split('T')[0],
    sendTime: '09:00',
    autoResend: true,
    autoEscalate: true,
    pauseOnPayment: true
  });
  aiEnabled = signal(true);
  selectedClients = signal(145);
  isSaving = signal(false);

  // Stage panel state
  isStagePanelOpen = signal(false);
  editingStage = signal<StageDisplay | null>(null);

  // Default stages
  defaultStages: StageDisplay[] = [
    { id: 's1', name: 'Amigable', dayStart: 0, dayEnd: 15, color: '#22C55E', bgColor: '#D1FAE5', toneInstructions: 'Tono amigable y cordial' },
    { id: 's2', name: 'Firme', dayStart: 16, dayEnd: 30, color: '#F59E0B', bgColor: '#FEF3C7', toneInstructions: 'Tono firme pero respetuoso' },
    { id: 's3', name: 'Urgente', dayStart: 31, dayEnd: 60, color: '#EF4444', bgColor: '#FEE2E2', toneInstructions: 'Tono urgente con advertencia' }
  ];

  goBack(): void {
    this.router.navigate(['/dashboard/campanas']);
  }

  async saveDraft(): Promise<void> {
    await this.submitCampaign(false);
  }

  async createCampaign(): Promise<void> {
    await this.submitCampaign(true);
  }

  openStagePanel(stage: StageDisplay): void {
    this.editingStage.set(stage);
    this.isStagePanelOpen.set(true);
  }

  closeStagePanel(): void {
    this.isStagePanelOpen.set(false);
    this.editingStage.set(null);
  }

  handleStageSave(data: { id: string; dayStart: number; dayEnd: number; tone: string; instructions: string; frequency: string; channels: string[] }): void {
    console.log('Stage saved:', data);
    this.closeStagePanel();
  }

  private async submitCampaign(isActive: boolean): Promise<void> {
    const info = this.basicInfo();
    if (!info.name.trim()) return;

    this.isSaving.set(true);

    try {
      const request = this.buildCreateRequest(isActive);
      await this.campaignsService.createCampaign(request);
      this.router.navigate(['/dashboard/campanas']);
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildCreateRequest(isActive: boolean): CreateCampaignRequest {
    const info = this.basicInfo();
    const audience = this.audienceConfig();
    const channels = this.channelConfig();
    const schedule = this.scheduleConfig();

    const strategyConfig: Record<string, unknown> = {
      channels: this.getActiveChannels(),
      audience: {
        minDaysOverdue: audience.minDaysOverdue,
        maxDaysOverdue: audience.maxDaysOverdue,
        minAmount: audience.minAmount,
        tags: audience.tags
      },
      schedule: {
        startDate: schedule.startDate,
        sendTime: schedule.sendTime,
        autoResend: schedule.autoResend,
        autoEscalate: schedule.autoEscalate,
        pauseOnPayment: schedule.pauseOnPayment
      },
      aiEnabled: this.aiEnabled()
    };

    const stages = this.buildStages(channels);

    return {
      name: info.name,
      description: info.description || undefined,
      campaign_type: (info.campaignType as CampaignType) || undefined,
      is_active: isActive,
      strategy_config: strategyConfig,
      stages
    };
  }

  private buildStages(channels: ChannelConfig): CreateCampaignStageRequest[] {
    const activeChannels = this.getActiveChannels();

    return this.defaultStages.map(stage => {
      const actions: CreateStageActionRequest[] = activeChannels.map((channel, index) => ({
        channel: channel as ChannelType,
        trigger_day: stage.dayStart + index,
        ai_enabled: this.aiEnabled()
      }));

      return {
        name: stage.name,
        day_start: stage.dayStart,
        day_end: stage.dayEnd,
        tone_instructions: stage.toneInstructions,
        actions
      };
    });
  }

  private getActiveChannels(): string[] {
    const channels = this.channelConfig();
    const active: string[] = [];
    if (channels.whatsapp) active.push('whatsapp');
    if (channels.email) active.push('email');
    if (channels.sms) active.push('sms');
    if (channels.call) active.push('call');
    return active;
  }
}
