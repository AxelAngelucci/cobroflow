import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaginatedResponse,
  CampaignApiResponse,
  CampaignListItemApiResponse,
  CampaignStageApiResponse,
  StageActionApiResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateCampaignStageRequest,
  UpdateStageRequest,
  CreateStageActionRequest,
  UpdateActionRequest,
  CampaignsQueryParams
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class CampaignsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/campaigns`;

  // ============================================
  // CAMPAIGNS ENDPOINTS
  // ============================================

  getCampaigns(params?: CampaignsQueryParams): Observable<PaginatedResponse<CampaignListItemApiResponse>> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.is_active !== undefined) {
      httpParams = httpParams.set('is_active', params.is_active.toString());
    }

    return this.http.get<PaginatedResponse<CampaignListItemApiResponse>>(`${this.apiUrl}/`, { params: httpParams });
  }

  getCampaign(campaignId: string): Observable<CampaignApiResponse> {
    return this.http.get<CampaignApiResponse>(`${this.apiUrl}/${campaignId}`);
  }

  createCampaign(data: CreateCampaignRequest): Observable<CampaignApiResponse> {
    return this.http.post<CampaignApiResponse>(`${this.apiUrl}/`, data);
  }

  updateCampaign(campaignId: string, data: UpdateCampaignRequest): Observable<CampaignApiResponse> {
    return this.http.patch<CampaignApiResponse>(`${this.apiUrl}/${campaignId}`, data);
  }

  deleteCampaign(campaignId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${campaignId}`);
  }

  // ============================================
  // STAGES ENDPOINTS
  // ============================================

  createStage(campaignId: string, data: CreateCampaignStageRequest): Observable<CampaignStageApiResponse> {
    return this.http.post<CampaignStageApiResponse>(`${this.apiUrl}/${campaignId}/stages`, data);
  }

  updateStage(stageId: string, data: UpdateStageRequest): Observable<CampaignStageApiResponse> {
    return this.http.patch<CampaignStageApiResponse>(`${this.apiUrl}/stages/${stageId}`, data);
  }

  deleteStage(stageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/stages/${stageId}`);
  }

  // ============================================
  // ACTIONS ENDPOINTS
  // ============================================

  createAction(stageId: string, data: CreateStageActionRequest): Observable<StageActionApiResponse> {
    return this.http.post<StageActionApiResponse>(`${this.apiUrl}/stages/${stageId}/actions`, data);
  }

  updateAction(actionId: string, data: UpdateActionRequest): Observable<StageActionApiResponse> {
    return this.http.patch<StageActionApiResponse>(`${this.apiUrl}/actions/${actionId}`, data);
  }

  deleteAction(actionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/actions/${actionId}`);
  }
}
