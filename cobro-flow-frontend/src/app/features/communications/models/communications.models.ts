export type ChannelType = 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';
export type TemplateStatus = 'draft' | 'active' | 'archived';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type StepConditionType = 'none' | 'previous_not_opened' | 'previous_not_replied' | 'previous_bounced' | 'invoice_still_unpaid';
export type CommunicationDirection = 'outbound' | 'inbound';
export type CommunicationStatus = 'scheduled' | 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed' | 'bounced' | 'cancelled';
export type CommunicationEventType = 'scheduled' | 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed' | 'unsubscribed' | 'complained' | 'payment_promise' | 'payment_made' | 'escalated' | 'cancelled';

export type TemplateFilterTab = 'all' | 'email' | 'whatsapp' | 'sms' | 'call';
export type WorkflowFilterTab = 'all' | 'active' | 'draft' | 'paused' | 'archived';
export type ActivityFilterTab = 'all' | 'email' | 'whatsapp' | 'call';

export interface MessageTemplate {
  id: string;
  organizationId: string;
  name: string;
  channel: ChannelType;
  subject?: string;
  body: string;
  variables?: string[];
  status: TemplateStatus;
  language: string;
  timesUsed: number;
  openRate?: number;
  clickRate?: number;
  replyRate?: number;
  conversionRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  name: string;
  channel: ChannelType;
  templateId?: string;
  delayDays: number;
  delayHours: number;
  sendTime?: string;
  conditionType: StepConditionType;
  fallbackChannel?: string;
  aiEnabled: boolean;
  aiInstructions?: string;
  config?: Record<string, unknown>;
  createdAt: Date;
}

export interface CollectionWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerDescription?: string;
  settings?: Record<string, unknown>;
  totalExecutions: number;
  successRate?: number;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationEvent {
  id: string;
  communicationLogId: string;
  eventType: CommunicationEventType;
  occurredAt: Date;
  data?: Record<string, unknown>;
  source?: string;
}

export interface CommunicationLog {
  id: string;
  organizationId: string;
  debtorId: string;
  invoiceId?: string;
  campaignId?: string;
  workflowId?: string;
  workflowStepId?: string;
  templateId?: string;
  sentByUserId?: string;
  channel: ChannelType;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  subject?: string;
  body?: string;
  recipientAddress?: string;
  sentAt?: Date;
  events: CommunicationEvent[];
  createdAt: Date;
}

export interface CommunicationHubKpis {
  sentToday: number;
  sentTodayChange: number;
  openRate: number;
  openRateChange: number;
  replyRate: number;
  replyRateChange: number;
  paymentsPostContact: number;
  paymentsPostContactChange: number;
}

export interface ChannelSummary {
  channel: ChannelType;
  status: string;
  sentToday: number;
  description: string;
}

export interface CommunicationHubSummary {
  kpis: CommunicationHubKpis;
  channels: ChannelSummary[];
}

export interface ActivityItem {
  id: string;
  channel: ChannelType;
  title: string;
  description: string;
  status: CommunicationStatus;
  timestamp: Date;
  debtorName: string;
}

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  call: 'Llamada',
  ai_voice: 'IA Voice'
};

export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  archived: 'Archivada'
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  archived: 'Archivado'
};

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
  scheduled: 'Programado',
  queued: 'En cola',
  sending: 'Enviando',
  sent: 'Enviado',
  delivered: 'Entregado',
  opened: 'Abierto',
  clicked: 'Clic',
  replied: 'Respondido',
  failed: 'Fallido',
  bounced: 'Rebotado',
  cancelled: 'Cancelado'
};

export const CONDITION_TYPE_LABELS: Record<StepConditionType, string> = {
  none: 'Sin condición',
  previous_not_opened: 'Si no fue abierto',
  previous_not_replied: 'Si no respondió',
  previous_bounced: 'Si rebotó',
  invoice_still_unpaid: 'Si factura sigue impaga'
};
