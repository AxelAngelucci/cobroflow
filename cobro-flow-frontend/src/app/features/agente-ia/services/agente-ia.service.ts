import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AgenteIaApiService } from './agente-ia-api.service';
import {
  AgentConfig, AgentPersonality, ConversationListItem, Conversation,
  ConversationMessage, TrainingDocument, BusinessRule, ConversationExample,
  TrainingSession, AgentAnalytics, DashboardKpis, EscalationRule,
  ChannelConfig, OperatingHours, ConversationStatus, ChannelType,
} from '../models/agente-ia.models';

@Injectable({
  providedIn: 'root'
})
export class AgenteIaService {
  private readonly api = inject(AgenteIaApiService);

  // ── State signals ──
  private readonly _config = signal<AgentConfig | null>(null);
  private readonly _personality = signal<AgentPersonality | null>(null);
  private readonly _conversations = signal<ConversationListItem[]>([]);
  private readonly _conversationsTotal = signal(0);
  private readonly _selectedConversation = signal<Conversation | null>(null);
  private readonly _messages = signal<ConversationMessage[]>([]);
  private readonly _trainingDocuments = signal<TrainingDocument[]>([]);
  private readonly _trainingDocsTotal = signal(0);
  private readonly _businessRules = signal<BusinessRule[]>([]);
  private readonly _businessRulesTotal = signal(0);
  private readonly _conversationExamples = signal<ConversationExample[]>([]);
  private readonly _examplesTotal = signal(0);
  private readonly _trainingSessions = signal<TrainingSession[]>([]);
  private readonly _sessionsTotal = signal(0);
  private readonly _analytics = signal<AgentAnalytics[]>([]);
  private readonly _dashboardKpis = signal<DashboardKpis | null>(null);
  private readonly _escalationRules = signal<EscalationRule[]>([]);
  private readonly _channelConfigs = signal<ChannelConfig[]>([]);
  private readonly _operatingHours = signal<OperatingHours[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // ── Public readonly ──
  readonly config = this._config.asReadonly();
  readonly personality = this._personality.asReadonly();
  readonly conversations = this._conversations.asReadonly();
  readonly conversationsTotal = this._conversationsTotal.asReadonly();
  readonly selectedConversation = this._selectedConversation.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly trainingDocuments = this._trainingDocuments.asReadonly();
  readonly trainingDocsTotal = this._trainingDocsTotal.asReadonly();
  readonly businessRules = this._businessRules.asReadonly();
  readonly businessRulesTotal = this._businessRulesTotal.asReadonly();
  readonly conversationExamples = this._conversationExamples.asReadonly();
  readonly examplesTotal = this._examplesTotal.asReadonly();
  readonly trainingSessions = this._trainingSessions.asReadonly();
  readonly sessionsTotal = this._sessionsTotal.asReadonly();
  readonly analytics = this._analytics.asReadonly();
  readonly dashboardKpis = this._dashboardKpis.asReadonly();
  readonly escalationRules = this._escalationRules.asReadonly();
  readonly channelConfigs = this._channelConfigs.asReadonly();
  readonly operatingHours = this._operatingHours.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAgentActive = computed(() => this._config()?.status === 'active');

  // ── Config ──

  async loadConfig(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const data = await firstValueFrom(this.api.getConfig());
      this._config.set(data);
    } catch (e: any) {
      if (e?.status === 404) {
        try {
          const created = await firstValueFrom(this.api.createConfig());
          this._config.set(created);
        } catch {
          this._error.set('Error al crear configuración inicial');
        }
      } else {
        this._error.set('Error al cargar configuración');
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateConfig(configId: string, data: Partial<AgentConfig>): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.updateConfig(configId, data));
      this._config.set(updated);
    } catch {
      this._error.set('Error al actualizar configuración');
    }
  }

  // ── Personality ──

  async loadPersonality(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getPersonality());
      this._personality.set(data);
    } catch (e: any) {
      if (e?.status !== 404) this._error.set('Error al cargar personalidad');
    }
  }

  async savePersonality(data: any): Promise<void> {
    try {
      const existing = this._personality();
      let result;
      if (existing) {
        result = await firstValueFrom(this.api.updatePersonality(existing.id, data));
      } else {
        result = await firstValueFrom(this.api.createPersonality(data));
      }
      this._personality.set(result);
    } catch {
      this._error.set('Error al guardar personalidad');
    }
  }

  // ── Conversations ──

  async loadConversations(params?: { page?: number; size?: number; status?: string; channel?: string }): Promise<void> {
    this._isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.getConversations(params));
      this._conversations.set(res.items);
      this._conversationsTotal.set(res.total);
    } catch {
      this._error.set('Error al cargar conversaciones');
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadConversation(id: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getConversation(id));
      this._selectedConversation.set(data);
    } catch {
      this._error.set('Error al cargar conversación');
    }
  }

  async updateConversation(id: string, data: any): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.updateConversation(id, data));
      this._selectedConversation.set(updated);
    } catch {
      this._error.set('Error al actualizar conversación');
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteConversation(id));
      this._conversations.update(list => list.filter(c => c.id !== id));
      if (this._selectedConversation()?.id === id) this._selectedConversation.set(null);
    } catch {
      this._error.set('Error al eliminar conversación');
    }
  }

  // ── Messages ──

  async loadMessages(conversationId: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getMessages(conversationId));
      this._messages.set(data);
    } catch {
      this._error.set('Error al cargar mensajes');
    }
  }

  async sendMessage(conversationId: string, data: any): Promise<void> {
    try {
      const msg = await firstValueFrom(this.api.createMessage(conversationId, data));
      this._messages.update(list => [...list, msg]);
    } catch {
      this._error.set('Error al enviar mensaje');
    }
  }

  // ── Training Documents ──

  async loadTrainingDocuments(params?: { page?: number; size?: number; status?: string }): Promise<void> {
    this._isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.getTrainingDocuments(params));
      this._trainingDocuments.set(res.items);
      this._trainingDocsTotal.set(res.total);
    } catch {
      this._error.set('Error al cargar documentos');
    } finally {
      this._isLoading.set(false);
    }
  }

  async createTrainingDocument(data: any): Promise<void> {
    try {
      const doc = await firstValueFrom(this.api.createTrainingDocument(data));
      this._trainingDocuments.update(list => [doc, ...list]);
    } catch {
      this._error.set('Error al crear documento');
    }
  }

  async deleteTrainingDocument(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteTrainingDocument(id));
      this._trainingDocuments.update(list => list.filter(d => d.id !== id));
    } catch {
      this._error.set('Error al eliminar documento');
    }
  }

  // ── Business Rules ──

  async loadBusinessRules(params?: { page?: number; size?: number }): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getBusinessRules(params));
      this._businessRules.set(res.items);
      this._businessRulesTotal.set(res.total);
    } catch {
      this._error.set('Error al cargar reglas');
    }
  }

  async createBusinessRule(data: any): Promise<void> {
    try {
      const rule = await firstValueFrom(this.api.createBusinessRule(data));
      this._businessRules.update(list => [...list, rule]);
    } catch {
      this._error.set('Error al crear regla');
    }
  }

  async updateBusinessRule(id: string, data: any): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.updateBusinessRule(id, data));
      this._businessRules.update(list => list.map(r => r.id === id ? updated : r));
    } catch {
      this._error.set('Error al actualizar regla');
    }
  }

  async deleteBusinessRule(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteBusinessRule(id));
      this._businessRules.update(list => list.filter(r => r.id !== id));
    } catch {
      this._error.set('Error al eliminar regla');
    }
  }

  async reorderBusinessRules(rules: { id: string; sort_order: number }[]): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.reorderBusinessRules(rules));
      this._businessRules.set(updated);
    } catch {
      this._error.set('Error al reordenar reglas');
    }
  }

  // ── Examples ──

  async loadConversationExamples(params?: { page?: number; size?: number; category?: string }): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getConversationExamples(params));
      this._conversationExamples.set(res.items);
      this._examplesTotal.set(res.total);
    } catch {
      this._error.set('Error al cargar ejemplos');
    }
  }

  async createConversationExample(data: any): Promise<void> {
    try {
      const ex = await firstValueFrom(this.api.createConversationExample(data));
      this._conversationExamples.update(list => [ex, ...list]);
    } catch {
      this._error.set('Error al crear ejemplo');
    }
  }

  async updateConversationExample(id: string, data: any): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.updateConversationExample(id, data));
      this._conversationExamples.update(list => list.map(e => e.id === id ? updated : e));
    } catch {
      this._error.set('Error al actualizar ejemplo');
    }
  }

  async deleteConversationExample(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteConversationExample(id));
      this._conversationExamples.update(list => list.filter(e => e.id !== id));
    } catch {
      this._error.set('Error al eliminar ejemplo');
    }
  }

  // ── Training Sessions ──

  async loadTrainingSessions(params?: { page?: number; size?: number }): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getTrainingSessions(params));
      this._trainingSessions.set(res.items);
      this._sessionsTotal.set(res.total);
    } catch {
      this._error.set('Error al cargar sesiones');
    }
  }

  async startTrainingSession(description?: string): Promise<void> {
    this._error.set(null);
    if (!this._config()) {
      await this.loadConfig();
    }
    try {
      const session = await firstValueFrom(this.api.createTrainingSession({ description }));
      this._trainingSessions.update(list => [session, ...list]);
    } catch (e: any) {
      const detail = e?.error?.detail || 'Error al iniciar entrenamiento';
      this._error.set(detail);
    }
  }

  // ── Analytics ──

  async loadAnalytics(params?: { page?: number; size?: number; date_from?: string; date_to?: string; channel?: string }): Promise<void> {
    this._isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.getAnalytics(params));
      this._analytics.set(res.items);
    } catch {
      this._error.set('Error al cargar analytics');
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadDashboardKpis(params?: { date_from?: string; date_to?: string }): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getAnalyticsDashboard(params));
      this._dashboardKpis.set(data);
    } catch {
      this._error.set('Error al cargar KPIs');
    }
  }

  // ── Escalation Rules ──

  async loadEscalationRules(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getEscalationRules());
      this._escalationRules.set(data);
    } catch {
      this._error.set('Error al cargar reglas de escalación');
    }
  }

  async createEscalationRule(data: any): Promise<void> {
    try {
      const rule = await firstValueFrom(this.api.createEscalationRule(data));
      this._escalationRules.update(list => [...list, rule]);
    } catch {
      this._error.set('Error al crear regla de escalación');
    }
  }

  async updateEscalationRule(id: string, data: any): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.updateEscalationRule(id, data));
      this._escalationRules.update(list => list.map(r => r.id === id ? updated : r));
    } catch {
      this._error.set('Error al actualizar regla de escalación');
    }
  }

  async deleteEscalationRule(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteEscalationRule(id));
      this._escalationRules.update(list => list.filter(r => r.id !== id));
    } catch {
      this._error.set('Error al eliminar regla de escalación');
    }
  }

  // ── Channel Config ──

  async loadChannelConfigs(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getChannelConfigs());
      this._channelConfigs.set(data);
    } catch {
      this._error.set('Error al cargar configuración de canales');
    }
  }

  async createChannelConfig(data: any): Promise<void> {
    try {
      const config = await firstValueFrom(this.api.createChannelConfig(data));
      this._channelConfigs.update(list => [...list, config]);
    } catch {
      this._error.set('Error al crear configuración de canal');
    }
  }

  async updateChannelConfig(id: string, data: any): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.updateChannelConfig(id, data));
      this._channelConfigs.update(list => list.map(c => c.id === id ? updated : c));
    } catch {
      this._error.set('Error al actualizar configuración de canal');
    }
  }

  async deleteChannelConfig(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteChannelConfig(id));
      this._channelConfigs.update(list => list.filter(c => c.id !== id));
    } catch {
      this._error.set('Error al eliminar configuración de canal');
    }
  }

  // ── Operating Hours ──

  async loadOperatingHours(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getOperatingHours());
      this._operatingHours.set(data);
    } catch {
      this._error.set('Error al cargar horarios');
    }
  }

  async createOperatingHours(data: any): Promise<void> {
    try {
      const hours = await firstValueFrom(this.api.createOperatingHours(data));
      this._operatingHours.update(list => [...list, hours]);
    } catch {
      this._error.set('Error al crear horario');
    }
  }

  async deleteOperatingHours(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteOperatingHours(id));
      this._operatingHours.update(list => list.filter(h => h.id !== id));
    } catch {
      this._error.set('Error al eliminar horario');
    }
  }

  // ── Utility ──

  clearError(): void {
    this._error.set(null);
  }

  clearSelectedConversation(): void {
    this._selectedConversation.set(null);
    this._messages.set([]);
  }
}
