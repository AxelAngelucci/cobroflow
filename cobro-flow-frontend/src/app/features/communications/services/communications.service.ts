import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  MessageTemplate, CollectionWorkflow, ActivityItem,
  CommunicationHubSummary, CommunicationHubKpis, ChannelSummary,
  TemplateFilterTab, WorkflowFilterTab, ActivityFilterTab,
  WorkflowStep,
} from '../models/communications.models';
import {
  MessageTemplateApiResponse,
  WorkflowStepApiResponse,
  CollectionWorkflowApiResponse,
  CommunicationLogApiResponse,
  CommunicationHubSummaryApiResponse,
  CreateMessageTemplateRequest,
  CreateCollectionWorkflowRequest,
  UpdateWorkflowRequest,
} from '../models/api.models';
import { CommunicationsApiService } from './communications-api.service';

const EMPTY_HUB_SUMMARY: CommunicationHubSummary = {
  kpis: {
    sentToday: 0,
    sentTodayChange: 0,
    openRate: 0,
    openRateChange: 0,
    replyRate: 0,
    replyRateChange: 0,
    paymentsPostContact: 0,
    paymentsPostContactChange: 0,
  },
  channels: [],
};

@Injectable({
  providedIn: 'root'
})
export class CommunicationsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(CommunicationsApiService);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // ============== State Signals ==============
  private readonly _templates = signal<MessageTemplate[]>([]);
  private readonly _workflows = signal<CollectionWorkflow[]>([]);
  private readonly _activity = signal<ActivityItem[]>([]);
  private readonly _hubSummary = signal<CommunicationHubSummary>(EMPTY_HUB_SUMMARY);
  private readonly _selectedWorkflow = signal<CollectionWorkflow | null>(null);
  private readonly _selectedTemplate = signal<MessageTemplate | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Filters
  private readonly _templateFilter = signal<TemplateFilterTab>('all');
  private readonly _templateSearch = signal<string>('');
  private readonly _workflowFilter = signal<WorkflowFilterTab>('all');
  private readonly _activityFilter = signal<ActivityFilterTab>('all');
  private readonly _hubSearch = signal<string>('');

  // ============== Public Readonly ==============
  readonly templates = this._templates.asReadonly();
  readonly workflows = this._workflows.asReadonly();
  readonly activity = this._activity.asReadonly();
  readonly hubSummary = this._hubSummary.asReadonly();
  readonly selectedWorkflow = this._selectedWorkflow.asReadonly();
  readonly selectedTemplate = this._selectedTemplate.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly templateFilter = this._templateFilter.asReadonly();
  readonly templateSearch = this._templateSearch.asReadonly();
  readonly workflowFilter = this._workflowFilter.asReadonly();
  readonly activityFilter = this._activityFilter.asReadonly();
  readonly hubSearch = this._hubSearch.asReadonly();

  // ============== Computed ==============
  readonly kpis = computed<CommunicationHubKpis>(() => this._hubSummary().kpis);
  readonly channels = computed<ChannelSummary[]>(() => this._hubSummary().channels);

  readonly filteredTemplates = computed(() => {
    let result = [...this._templates()];
    const tab = this._templateFilter();
    const search = this._templateSearch();

    if (tab !== 'all') {
      result = result.filter(t => t.channel === tab);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(s) ||
        t.body.toLowerCase().includes(s)
      );
    }
    return result;
  });

  readonly templateCounts = computed(() => {
    const all = this._templates();
    return {
      all: all.length,
      email: all.filter(t => t.channel === 'email').length,
      whatsapp: all.filter(t => t.channel === 'whatsapp').length,
      sms: all.filter(t => t.channel === 'sms').length,
      call: all.filter(t => t.channel === 'call').length,
    };
  });

  readonly filteredWorkflows = computed(() => {
    let result = [...this._workflows()];
    const tab = this._workflowFilter();

    if (tab !== 'all') {
      result = result.filter(w => w.status === tab);
    }
    return result;
  });

  readonly workflowCounts = computed(() => {
    const all = this._workflows();
    return {
      all: all.length,
      active: all.filter(w => w.status === 'active').length,
      draft: all.filter(w => w.status === 'draft').length,
      paused: all.filter(w => w.status === 'paused').length,
      archived: all.filter(w => w.status === 'archived').length,
    };
  });

  readonly filteredActivity = computed(() => {
    const tab = this._activityFilter();
    if (tab === 'all') return this._activity();
    return this._activity().filter(a => a.channel === tab);
  });

  // ============== Actions ==============

  setTemplateFilter(tab: TemplateFilterTab): void {
    this._templateFilter.set(tab);
  }

  setTemplateSearch(search: string): void {
    this._templateSearch.set(search);
  }

  setWorkflowFilter(tab: WorkflowFilterTab): void {
    this._workflowFilter.set(tab);
  }

  setActivityFilter(tab: ActivityFilterTab): void {
    this._activityFilter.set(tab);
  }

  setHubSearch(search: string): void {
    this._hubSearch.set(search);
  }

  selectWorkflow(workflow: CollectionWorkflow | null): void {
    this._selectedWorkflow.set(workflow);
  }

  selectTemplate(template: MessageTemplate | null): void {
    this._selectedTemplate.set(template);
  }

  async loadHubData(): Promise<void> {
    if (!this.isBrowser) return;
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const [summary, logsResponse] = await Promise.all([
        firstValueFrom(this.api.getHubSummary()),
        firstValueFrom(this.api.getLogs({ page: 1, size: 10 })),
      ]);
      this._hubSummary.set(this.mapHubSummaryFromApi(summary));
      this._activity.set(logsResponse.items.map(log => this.mapActivityFromLog(log)));
    } catch (error) {
      console.error('Error loading hub data:', error);
      this._error.set('Error al cargar datos del hub');
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadTemplates(): Promise<void> {
    if (!this.isBrowser) return;
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(
        this.api.getTemplates({ page: 1, size: 50 })
      );
      this._templates.set(response.items.map(t => this.mapTemplateFromApi(t)));
    } catch (error) {
      console.error('Error loading templates:', error);
      this._error.set('Error al cargar plantillas');
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadWorkflows(): Promise<void> {
    if (!this.isBrowser) return;
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(
        this.api.getWorkflows({ page: 1, size: 50 })
      );
      this._workflows.set(response.items.map(w => this.mapWorkflowFromApi(w)));
    } catch (error) {
      console.error('Error loading workflows:', error);
      this._error.set('Error al cargar workflows');
    } finally {
      this._isLoading.set(false);
    }
  }

  async createTemplate(data: CreateMessageTemplateRequest): Promise<MessageTemplate> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(this.api.createTemplate(data));
      const newTemplate = this.mapTemplateFromApi(response);
      this._templates.update(tpls => [newTemplate, ...tpls]);
      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      this._error.set('Error al crear la plantilla');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateTemplate(id: string, data: Partial<CreateMessageTemplateRequest>): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.updateTemplate(id, data));
      const updated = this.mapTemplateFromApi(response);
      this._templates.update(tpls => tpls.map(t => t.id === id ? updated : t));
      if (this._selectedTemplate()?.id === id) {
        this._selectedTemplate.set(updated);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      this._error.set('Error al actualizar la plantilla');
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteTemplate(templateId));
      this._templates.update(tpls => tpls.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      this._error.set('Error al eliminar la plantilla');
      throw error;
    }
  }

  async createWorkflow(data: CreateCollectionWorkflowRequest): Promise<CollectionWorkflow> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(this.api.createWorkflow(data));
      const newWorkflow = this.mapWorkflowFromApi(response);
      this._workflows.update(wfs => [newWorkflow, ...wfs]);
      return newWorkflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      this._error.set('Error al crear el workflow');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateWorkflow(workflowId: string, data: UpdateWorkflowRequest): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.updateWorkflow(workflowId, data));
      const updated = this.mapWorkflowFromApi(response);
      this._workflows.update(wfs => wfs.map(w => w.id === workflowId ? updated : w));
      if (this._selectedWorkflow()?.id === workflowId) {
        this._selectedWorkflow.set(updated);
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      this._error.set('Error al actualizar el workflow');
      throw error;
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteWorkflow(workflowId));
      this._workflows.update(wfs => wfs.filter(w => w.id !== workflowId));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      this._error.set('Error al eliminar el workflow');
      throw error;
    }
  }

  getWorkflowById(id: string): CollectionWorkflow | undefined {
    return this._workflows().find(w => w.id === id);
  }

  getTemplateById(id: string): MessageTemplate | undefined {
    return this._templates().find(t => t.id === id);
  }

  updateWorkflowStep(workflowId: string, step: WorkflowStep): void {
    this._workflows.update(workflows =>
      workflows.map(w => {
        if (w.id !== workflowId) return w;
        return {
          ...w,
          steps: w.steps.map(s => s.id === step.id ? step : s),
        };
      })
    );
    const sel = this._selectedWorkflow();
    if (sel?.id === workflowId) {
      this._selectedWorkflow.set({
        ...sel,
        steps: sel.steps.map(s => s.id === step.id ? step : s),
      });
    }
  }

  addWorkflowStep(workflowId: string, step: WorkflowStep): void {
    this._workflows.update(workflows =>
      workflows.map(w => {
        if (w.id !== workflowId) return w;
        return { ...w, steps: [...w.steps, step] };
      })
    );
  }

  removeWorkflowStep(workflowId: string, stepId: string): void {
    this._workflows.update(workflows =>
      workflows.map(w => {
        if (w.id !== workflowId) return w;
        return {
          ...w,
          steps: w.steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, stepOrder: i + 1 })),
        };
      })
    );
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(date);
  }

  // ============== Private Mappers ==============

  private mapTemplateFromApi(api: MessageTemplateApiResponse): MessageTemplate {
    return {
      id: api.id,
      organizationId: api.organizationId,
      name: api.name,
      channel: api.channel,
      subject: api.subject ?? undefined,
      body: api.body,
      variables: api.variables ?? undefined,
      status: api.status,
      language: api.language,
      timesUsed: api.timesUsed,
      openRate: api.openRate ?? undefined,
      clickRate: api.clickRate ?? undefined,
      replyRate: api.replyRate ?? undefined,
      conversionRate: api.conversionRate ?? undefined,
      createdAt: new Date(api.createdAt),
      updatedAt: new Date(api.updatedAt),
    };
  }

  private mapWorkflowStepFromApi(api: WorkflowStepApiResponse): WorkflowStep {
    return {
      id: api.id,
      workflowId: api.workflowId,
      stepOrder: api.stepOrder,
      name: api.name,
      channel: api.channel,
      templateId: api.templateId ?? undefined,
      delayDays: api.delayDays,
      delayHours: api.delayHours,
      sendTime: api.sendTime ?? undefined,
      conditionType: api.conditionType as WorkflowStep['conditionType'],
      fallbackChannel: api.fallbackChannel ?? undefined,
      aiEnabled: api.aiEnabled,
      aiInstructions: api.aiInstructions ?? undefined,
      config: api.config ?? undefined,
      createdAt: new Date(api.createdAt),
    };
  }

  private mapWorkflowFromApi(api: CollectionWorkflowApiResponse): CollectionWorkflow {
    return {
      id: api.id,
      organizationId: api.organizationId,
      name: api.name,
      description: api.description ?? undefined,
      status: api.status,
      triggerDescription: api.triggerDescription ?? undefined,
      settings: api.settings ?? undefined,
      totalExecutions: api.totalExecutions,
      successRate: api.successRate ?? undefined,
      steps: (api.steps ?? []).map(s => this.mapWorkflowStepFromApi(s)),
      createdAt: new Date(api.createdAt),
      updatedAt: new Date(api.updatedAt),
    };
  }

  private mapHubSummaryFromApi(api: CommunicationHubSummaryApiResponse): CommunicationHubSummary {
    return {
      kpis: {
        sentToday: api.kpis.sentToday,
        sentTodayChange: api.kpis.sentTodayChange,
        openRate: api.kpis.openRate,
        openRateChange: api.kpis.openRateChange,
        replyRate: api.kpis.replyRate,
        replyRateChange: api.kpis.replyRateChange,
        paymentsPostContact: api.kpis.paymentsPostContact,
        paymentsPostContactChange: api.kpis.paymentsPostContactChange,
      },
      channels: api.channels.map(c => ({
        channel: c.channel,
        status: c.status,
        sentToday: c.sentToday,
        description: c.description,
      })),
    };
  }

  private mapActivityFromLog(api: CommunicationLogApiResponse): ActivityItem {
    const channelLabels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      email: 'Email',
      sms: 'SMS',
      call: 'Llamada',
      ai_voice: 'IA Voice',
    };
    const channelLabel = channelLabels[api.channel] ?? api.channel;
    const direction = api.direction === 'inbound' ? 'Recibido' : 'Enviado';

    return {
      id: api.id,
      channel: api.channel,
      title: `${channelLabel} ${direction}`,
      description: api.body ?? api.subject ?? api.recipientAddress ?? 'Sin descripción',
      status: api.status as ActivityItem['status'],
      timestamp: new Date(api.sentAt ?? api.createdAt),
      debtorName: api.debtorId,
    };
  }
}
