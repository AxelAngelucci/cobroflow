// API Response Types - matching backend responses (snake_case)

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface StageActionApiResponse {
  id: string;
  stage_id: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  trigger_day: number;
  template_id: string | null;
  ai_enabled: boolean;
  created_at: string;
}

export interface CampaignStageApiResponse {
  id: string;
  campaign_id: string;
  name: string;
  day_start: number;
  day_end: number;
  tone_instructions: string | null;
  actions: StageActionApiResponse[];
  created_at: string;
}

export interface CampaignApiResponse {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  campaign_type: 'preventive' | 'friendly' | 'assertive' | 'legal' | null;
  is_active: boolean;
  strategy_config: Record<string, unknown> | null;
  workflow_id: string | null;
  stages: CampaignStageApiResponse[];
  created_at: string;
  updated_at: string;
}

export interface CampaignListItemApiResponse {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  campaign_type: 'preventive' | 'friendly' | 'assertive' | 'legal' | null;
  is_active: boolean;
  strategy_config: Record<string, unknown> | null;
  workflow_id: string | null;
  created_at: string;
  updated_at: string;
}

// Request types

export interface CreateStageActionRequest {
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  trigger_day: number;
  template_id?: string;
  ai_enabled?: boolean;
}

export interface CreateCampaignStageRequest {
  name: string;
  day_start: number;
  day_end: number;
  tone_instructions?: string;
  actions?: CreateStageActionRequest[];
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  campaign_type?: 'preventive' | 'friendly' | 'assertive' | 'legal';
  is_active?: boolean;
  strategy_config?: Record<string, unknown>;
  workflow_id?: string;
  stages?: CreateCampaignStageRequest[];
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  campaign_type?: 'preventive' | 'friendly' | 'assertive' | 'legal';
  is_active?: boolean;
  strategy_config?: Record<string, unknown>;
  workflow_id?: string;
}

export interface UpdateStageRequest {
  name?: string;
  day_start?: number;
  day_end?: number;
  tone_instructions?: string;
}

export interface UpdateActionRequest {
  channel?: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  trigger_day?: number;
  template_id?: string;
  ai_enabled?: boolean;
}

// Query params
export interface CampaignsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  is_active?: boolean;
}
