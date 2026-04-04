export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// NOTE: all snake_case fields are converted to camelCase by the camelCaseInterceptor

export interface MessageTemplateApiResponse {
  id: string;
  organizationId: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  subject: string | null;
  body: string;
  variables: string[] | null;
  status: 'draft' | 'active' | 'archived';
  language: string;
  timesUsed: number;
  openRate: number | null;
  clickRate: number | null;
  replyRate: number | null;
  conversionRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepApiResponse {
  id: string;
  workflowId: string;
  stepOrder: number;
  name: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  templateId: string | null;
  delayDays: number;
  delayHours: number;
  sendTime: string | null;
  conditionType: 'none' | 'previousNotOpened' | 'previousNotReplied' | 'previousBounced' | 'invoiceStillUnpaid';
  fallbackChannel: string | null;
  aiEnabled: boolean;
  aiInstructions: string | null;
  config: Record<string, unknown> | null;
  createdAt: string;
}

export interface CollectionWorkflowApiResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  triggerDescription: string | null;
  settings: Record<string, unknown> | null;
  totalExecutions: number;
  successRate: number | null;
  steps: WorkflowStepApiResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationLogApiResponse {
  id: string;
  organizationId: string;
  debtorId: string;
  campaignId: string | null;
  channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
  direction: 'outbound' | 'inbound';
  status: string;
  subject: string | null;
  body: string | null;
  recipientAddress: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface CommunicationHubSummaryApiResponse {
  kpis: {
    sentToday: number;
    sentTodayChange: number;
    openRate: number;
    openRateChange: number;
    replyRate: number;
    replyRateChange: number;
    paymentsPostContact: number;
    paymentsPostContactChange: number;
  };
  channels: {
    channel: 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
    status: string;
    sentToday: number;
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
