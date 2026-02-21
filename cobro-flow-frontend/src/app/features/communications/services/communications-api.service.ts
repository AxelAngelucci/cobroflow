import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaginatedResponse,
  MessageTemplateApiResponse,
  CollectionWorkflowApiResponse,
  CommunicationLogApiResponse,
  CommunicationHubSummaryApiResponse,
  CreateMessageTemplateRequest,
  CreateCollectionWorkflowRequest,
  UpdateWorkflowRequest,
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class CommunicationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/communications`;

  // Templates
  getTemplates(params?: { page?: number; size?: number; search?: string; channel?: string; status?: string }): Observable<PaginatedResponse<MessageTemplateApiResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.size) httpParams = httpParams.set('size', params.size);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.channel) httpParams = httpParams.set('channel', params.channel);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<PaginatedResponse<MessageTemplateApiResponse>>(`${this.baseUrl}/templates/`, { params: httpParams });
  }

  createTemplate(data: CreateMessageTemplateRequest): Observable<MessageTemplateApiResponse> {
    return this.http.post<MessageTemplateApiResponse>(`${this.baseUrl}/templates/`, data);
  }

  updateTemplate(id: string, data: Partial<CreateMessageTemplateRequest>): Observable<MessageTemplateApiResponse> {
    return this.http.patch<MessageTemplateApiResponse>(`${this.baseUrl}/templates/${id}`, data);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/templates/${id}`);
  }

  // Workflows
  getWorkflows(params?: { page?: number; size?: number; search?: string; status?: string }): Observable<PaginatedResponse<CollectionWorkflowApiResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.size) httpParams = httpParams.set('size', params.size);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<PaginatedResponse<CollectionWorkflowApiResponse>>(`${this.baseUrl}/workflows/`, { params: httpParams });
  }

  getWorkflow(id: string): Observable<CollectionWorkflowApiResponse> {
    return this.http.get<CollectionWorkflowApiResponse>(`${this.baseUrl}/workflows/${id}`);
  }

  createWorkflow(data: CreateCollectionWorkflowRequest): Observable<CollectionWorkflowApiResponse> {
    return this.http.post<CollectionWorkflowApiResponse>(`${this.baseUrl}/workflows/`, data);
  }

  updateWorkflow(id: string, data: UpdateWorkflowRequest): Observable<CollectionWorkflowApiResponse> {
    return this.http.patch<CollectionWorkflowApiResponse>(`${this.baseUrl}/workflows/${id}`, data);
  }

  deleteWorkflow(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/workflows/${id}`);
  }

  // Logs
  getLogs(params?: { page?: number; size?: number; channel?: string; status?: string }): Observable<PaginatedResponse<CommunicationLogApiResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.size) httpParams = httpParams.set('size', params.size);
    if (params?.channel) httpParams = httpParams.set('channel', params.channel);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<PaginatedResponse<CommunicationLogApiResponse>>(`${this.baseUrl}/logs/`, { params: httpParams });
  }

  // Hub
  getHubSummary(): Observable<CommunicationHubSummaryApiResponse> {
    return this.http.get<CommunicationHubSummaryApiResponse>(`${this.baseUrl}/hub/summary`);
  }
}
