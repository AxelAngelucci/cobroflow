import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaginatedResponse,
  DocumentUploadResponse,
  ProcessDocumentRequest,
  ProcessDocumentResponse,
  ProcessAllResponse,
  BusinessRuleCreateRequest,
  BusinessRule,
  ConversationExampleCreateRequest,
  ConversationExample,
  TrainingDocument,
  CampaignEvaluationResult,
} from '../models/agente-ia.models';

@Injectable({
  providedIn: 'root'
})
export class AgenteIaApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ai-agent`;
  private readonly trainingUrl = `${environment.apiUrl}/ai-training`;

  // ============== CONFIG ==============

  getConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config`);
  }

  createConfig(data?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/config`, data || {});
  }

  updateConfig(configId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/config/${configId}`, data);
  }

  // ============== PERSONALITY ==============

  getPersonality(): Observable<any> {
    return this.http.get(`${this.apiUrl}/personality`);
  }

  createPersonality(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/personality`, data);
  }

  updatePersonality(personalityId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/personality/${personalityId}`, data);
  }

  // ============== CONVERSATIONS ==============

  getConversations(params?: { page?: number; size?: number; status?: string; channel?: string }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.channel) httpParams = httpParams.set('channel', params.channel);
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/conversations`, { params: httpParams });
  }

  getConversation(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/conversations/${id}`);
  }

  createConversation(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations`, data);
  }

  updateConversation(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/conversations/${id}`, data);
  }

  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversations/${id}`);
  }

  // ============== MESSAGES ==============

  getMessages(conversationId: string, skip = 0, limit = 50): Observable<any[]> {
    const params = new HttpParams().set('skip', skip.toString()).set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params });
  }

  createMessage(conversationId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/messages`, data);
  }

  // ============== TRAINING DOCUMENTS ==============

  getTrainingDocuments(params?: { page?: number; size?: number; status?: string }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/training/documents`, { params: httpParams });
  }

  createTrainingDocument(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/training/documents`, data);
  }

  updateTrainingDocument(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/training/documents/${id}`, data);
  }

  deleteTrainingDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/training/documents/${id}`);
  }

  // ============== BUSINESS RULES ==============

  getBusinessRules(params?: { page?: number; size?: number; is_active?: boolean }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.is_active !== undefined) httpParams = httpParams.set('is_active', params.is_active.toString());
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/training/rules`, { params: httpParams });
  }

  createBusinessRule(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/training/rules`, data);
  }

  updateBusinessRule(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/training/rules/${id}`, data);
  }

  deleteBusinessRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/training/rules/${id}`);
  }

  reorderBusinessRules(rules: { id: string; sort_order: number }[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/training/rules/reorder`, { rules });
  }

  // ============== CONVERSATION EXAMPLES ==============

  getConversationExamples(params?: { page?: number; size?: number; category?: string }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/training/examples`, { params: httpParams });
  }

  createConversationExample(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/training/examples`, data);
  }

  updateConversationExample(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/training/examples/${id}`, data);
  }

  deleteConversationExample(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/training/examples/${id}`);
  }

  // ============== TRAINING SESSIONS ==============

  getTrainingSessions(params?: { page?: number; size?: number }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/training/sessions`, { params: httpParams });
  }

  createTrainingSession(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/training/sessions`, data);
  }

  updateTrainingSession(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/training/sessions/${id}`, data);
  }

  // ============== ANALYTICS ==============

  getAnalytics(params?: { page?: number; size?: number; date_from?: string; date_to?: string; channel?: string }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.date_from) httpParams = httpParams.set('date_from', params.date_from);
    if (params?.date_to) httpParams = httpParams.set('date_to', params.date_to);
    if (params?.channel) httpParams = httpParams.set('channel', params.channel);
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/analytics`, { params: httpParams });
  }

  getAnalyticsDashboard(params?: { date_from?: string; date_to?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.date_from) httpParams = httpParams.set('date_from', params.date_from);
    if (params?.date_to) httpParams = httpParams.set('date_to', params.date_to);
    return this.http.get(`${this.apiUrl}/analytics/dashboard`, { params: httpParams });
  }

  // ============== ESCALATION RULES ==============

  getEscalationRules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/config/escalation-rules`);
  }

  createEscalationRule(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/config/escalation-rules`, data);
  }

  updateEscalationRule(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/config/escalation-rules/${id}`, data);
  }

  deleteEscalationRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/config/escalation-rules/${id}`);
  }

  // ============== CHANNEL CONFIG ==============

  getChannelConfigs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/config/channels`);
  }

  createChannelConfig(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/config/channels`, data);
  }

  updateChannelConfig(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/config/channels/${id}`, data);
  }

  deleteChannelConfig(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/config/channels/${id}`);
  }

  // ============== OPERATING HOURS ==============

  getOperatingHours(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/config/operating-hours`);
  }

  createOperatingHours(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/config/operating-hours`, data);
  }

  deleteOperatingHours(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/config/operating-hours/${id}`);
  }

  // ============== AI TRAINING - Document Upload ==============

  /**
   * Upload a training document (PDF, DOCX, CSV, TXT).
   *
   * Usage from a component:
   *   const formData = new FormData();
   *   formData.append('file', fileInput.files[0]);
   *   formData.append('name', 'My document name');  // optional
   *   this.api.uploadTrainingDocument(formData).subscribe(res => console.log(res));
   */
  uploadTrainingDocument(formData: FormData): Observable<DocumentUploadResponse> {
    return this.http.post<DocumentUploadResponse>(`${this.trainingUrl}/upload`, formData);
  }

  /**
   * Process (vectorize) a single pending document by ID.
   *
   * Usage: this.api.processDocument({ document_id: 'uuid-here' }).subscribe(...);
   */
  processDocument(data: ProcessDocumentRequest): Observable<ProcessDocumentResponse> {
    return this.http.post<ProcessDocumentResponse>(`${this.trainingUrl}/process`, data);
  }

  /**
   * Process all pending documents for the current organization.
   *
   * Usage: this.api.processAllDocuments().subscribe(...);
   */
  processAllDocuments(): Observable<ProcessAllResponse> {
    return this.http.post<ProcessAllResponse>(`${this.trainingUrl}/process-all`, {});
  }

  /**
   * List training documents from the /ai-training/documents endpoint.
   */
  getTrainingDocumentsV2(params?: { page?: number; size?: number; status?: string }): Observable<PaginatedResponse<TrainingDocument>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<PaginatedResponse<TrainingDocument>>(`${this.trainingUrl}/documents`, { params: httpParams });
  }

  // ============== AI TRAINING - Business Rules ==============

  /**
   * Add a business rule via /ai-training/rules.
   *
   * Usage: this.api.addTrainingRule({ rule_text: '...', priority: 'high' }).subscribe(...);
   */
  addTrainingRule(data: BusinessRuleCreateRequest): Observable<BusinessRule> {
    return this.http.post<BusinessRule>(`${this.trainingUrl}/rules`, data);
  }

  /**
   * List business rules via /ai-training/rules.
   */
  getTrainingRules(params?: { page?: number; size?: number }): Observable<PaginatedResponse<BusinessRule>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<PaginatedResponse<BusinessRule>>(`${this.trainingUrl}/rules`, { params: httpParams });
  }

  // ============== AI TRAINING - Q&A Examples ==============

  /**
   * Add a Q&A example via /ai-training/examples.
   *
   * Usage:
   *   this.api.addTrainingExample({
   *     question: '¿Cuándo vence mi factura?',
   *     answer: 'Su factura vence el día...',
   *     category: 'consulta_factura'
   *   }).subscribe(...);
   */
  addTrainingExample(data: ConversationExampleCreateRequest): Observable<ConversationExample> {
    return this.http.post<ConversationExample>(`${this.trainingUrl}/examples`, data);
  }

  /**
   * List Q&A examples via /ai-training/examples.
   */
  getTrainingExamples(params?: { page?: number; size?: number; category?: string }): Observable<PaginatedResponse<ConversationExample>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<PaginatedResponse<ConversationExample>>(`${this.trainingUrl}/examples`, { params: httpParams });
  }

  // ============== CAMPAIGN WORKER (admin/debug) ==============

  /**
   * Trigger campaign evaluation manually (admin use).
   * This calls the Cloud Tasks worker endpoint directly.
   *
   * Usage: this.api.triggerCampaignEvaluation().subscribe(...);
   */
  triggerCampaignEvaluation(): Observable<CampaignEvaluationResult> {
    return this.http.post<CampaignEvaluationResult>(`${environment.apiUrl.replace('/api/v1', '')}/workers/campaigns/evaluate`, {});
  }
}
