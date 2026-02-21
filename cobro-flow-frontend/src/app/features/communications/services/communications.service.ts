import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  MessageTemplate, CollectionWorkflow, ActivityItem,
  CommunicationHubSummary, CommunicationHubKpis, ChannelSummary,
  TemplateFilterTab, WorkflowFilterTab, ActivityFilterTab,
  WorkflowStep,
} from '../models/communications.models';
import {
  MOCK_TEMPLATES, MOCK_WORKFLOWS, MOCK_ACTIVITY, MOCK_HUB_SUMMARY,
} from '../data/communications.mock-data';

@Injectable({
  providedIn: 'root'
})
export class CommunicationsService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // ============== State Signals ==============
  private readonly _templates = signal<MessageTemplate[]>([]);
  private readonly _workflows = signal<CollectionWorkflow[]>([]);
  private readonly _activity = signal<ActivityItem[]>([]);
  private readonly _hubSummary = signal<CommunicationHubSummary>(MOCK_HUB_SUMMARY);
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
      await new Promise(resolve => setTimeout(resolve, 300));
      this._activity.set(MOCK_ACTIVITY);
      this._hubSummary.set(MOCK_HUB_SUMMARY);
    } catch {
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
      await new Promise(resolve => setTimeout(resolve, 300));
      this._templates.set(MOCK_TEMPLATES);
    } catch {
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
      await new Promise(resolve => setTimeout(resolve, 300));
      this._workflows.set(MOCK_WORKFLOWS);
    } catch {
      this._error.set('Error al cargar workflows');
    } finally {
      this._isLoading.set(false);
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

  deleteWorkflow(workflowId: string): void {
    this._workflows.update(wfs => wfs.filter(w => w.id !== workflowId));
  }

  deleteTemplate(templateId: string): void {
    this._templates.update(tpls => tpls.filter(t => t.id !== templateId));
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
}
