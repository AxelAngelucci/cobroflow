import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface KpiApiResponse {
  id: string;
  label: string;
  value: string;
  change: number;
  change_positive: boolean;
}

export interface ChartDataApiResponse {
  month: string;
  billed: number;
  collected: number;
}

export interface ChannelEffectivenessApiResponse {
  channel: string;
  percentage: number;
  count: number;
}

export interface AttentionItemApiResponse {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  client_id: string;
}

export interface ActivityItemApiResponse {
  id: string;
  client_name: string;
  action: string;
  channel: string;
  timestamp: string;
  status: string;
}

export interface DashboardSummaryApiResponse {
  kpis: KpiApiResponse[];
  chart_data: ChartDataApiResponse[];
  channel_effectiveness: ChannelEffectivenessApiResponse[];
  attention_items: AttentionItemApiResponse[];
  activity_items: ActivityItemApiResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<DashboardSummaryApiResponse> {
    return this.http.get<DashboardSummaryApiResponse>(`${this.apiUrl}/summary`);
  }
}
