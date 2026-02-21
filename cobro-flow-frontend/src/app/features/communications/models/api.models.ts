export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface MessageTemplateApiResponse {
  id: string;
  organization_id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  subject: string | null;
  body: string;
  variables: string[] | null;
  status: 'draft' | 'active' | 'archived';
  language: string;
  times_used: number;
  open_rate: number | null;
  click_rate: number | null;
  reply_rate: number | null;
  conversion_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepApiResponse {
  id: string;
  workflow_id: string;
  step_order: number;
  name: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  template_id: string | null;
  delay_days: number;
  delay_hours: number;
  send_time: string | null;
  condition_type: 'none' | 'previous_not_opened' | 'previous_not_replied' | 'previous_bounced' | 'invoice_still_unpaid';
  fallback_channel: string | null;
  ai_enabled: boolean;
  ai_instructions: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
}

export interface CollectionWorkflowApiResponse {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_description: string | null;
  settings: Record<string, unknown> | null;
  total_executions: number;
  success_rate: number | null;
  steps: WorkflowStepApiResponse[];
  created_at: string;
  updated_at: string;
}

export interface CommunicationLogApiResponse {
  id: string;
  organization_id: string;
  debtor_id: string;
  campaign_id: string | null;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  direction: 'outbound' | 'inbound';
  status: string;
  subject: string | null;
  recipient_address: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface CommunicationHubSummaryApiResponse {
  kpis: {
    sent_today: number;
    sent_today_change: number;
    open_rate: number;
    open_rate_change: number;
    reply_rate: number;
    reply_rate_change: number;
    payments_post_contact: number;
    payments_post_contact_change: number;
  };
  channels: {
    channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
    status: string;
    sent_today: number;
    description: string;
  }[];
}

// Request types

export interface CreateMessageTemplateRequest {
  name: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  subject?: string;
  body: string;
  variables?: string[];
  status?: 'draft' | 'active' | 'archived';
  language?: string;
}

export interface CreateWorkflowStepRequest {
  step_order: number;
  name: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  template_id?: string;
  delay_days?: number;
  delay_hours?: number;
  send_time?: string;
  condition_type?: string;
  fallback_channel?: string;
  ai_enabled?: boolean;
  ai_instructions?: string;
}

export interface CreateCollectionWorkflowRequest {
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  trigger_description?: string;
  settings?: Record<string, unknown>;
  steps?: CreateWorkflowStepRequest[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  trigger_description?: string;
  settings?: Record<string, unknown>;
}
