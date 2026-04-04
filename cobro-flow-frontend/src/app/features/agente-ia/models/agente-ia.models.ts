// ============== Enums / Types ==============

export type AgentStatus = 'active' | 'paused' | 'training' | 'error';
export type AgentTone = 'professional' | 'friendly' | 'firm' | 'empathetic';
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'expired';
export type MessageRole = 'agent' | 'client' | 'system' | 'operator';
export type MessageSentiment = 'positive' | 'neutral' | 'negative';
export type TrainingDocStatus = 'pending' | 'processing' | 'processed' | 'failed';
export type TrainingSessionStatus = 'running' | 'completed' | 'failed';
export type RulePriority = 'high' | 'medium' | 'low';
export type EscalationReason = 'negative_sentiment' | 'high_debt' | 'repeated_failure' | 'client_request' | 'agent_uncertainty' | 'custom';
export type ChannelType = 'whatsapp' | 'email' | 'sms' | 'call' | 'ai_voice';

// ============== Domain Models (camelCase) ==============

export interface AgentConfig {
  id: string;
  organizationId: string;
  name: string;
  status: AgentStatus;
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  autoRespond: boolean;
  requireApproval: boolean;
  maxRetries: number;
  retryDelayMinutes: number;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPersonality {
  id: string;
  agentConfigId: string;
  tone: AgentTone;
  greetingTemplate: string | null;
  farewellTemplate: string | null;
  systemPrompt: string | null;
  language: string;
  formalityLevel: number;
  empathyLevel: number;
  forbiddenTopics: string[] | null;
  customInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  organizationId: string;
  debtorId: string;
  agentConfigId: string;
  channel: ChannelType;
  status: ConversationStatus;
  overallSentiment: MessageSentiment | null;
  escalatedToUserId: string | null;
  escalationReason: EscalationReason | null;
  resolutionSummary: string | null;
  totalMessages: number;
  firstResponseTimeMs: number | null;
  resolutionTimeMs: number | null;
  startedAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface ConversationListItem {
  id: string;
  organizationId: string;
  debtorId: string;
  channel: ChannelType;
  status: ConversationStatus;
  overallSentiment: MessageSentiment | null;
  totalMessages: number;
  startedAt: Date;
  createdAt: Date;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sentiment: MessageSentiment | null;
  confidenceScore: number | null;
  tokensUsed: number | null;
  cost: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface TrainingDocument {
  id: string;
  organizationId: string;
  agentConfigId: string;
  name: string;
  filePath: string | null;
  fileType: string | null;
  fileSizeBytes: number | null;
  contentText: string | null;
  embeddingId: string | null;
  status: TrainingDocStatus;
  chunkCount: number;
  errorMessage: string | null;
  uploadedByUserId: string | null;
  processedAt: Date | null;
  createdAt: Date;
}

export interface BusinessRule {
  id: string;
  organizationId: string;
  agentConfigId: string;
  ruleText: string;
  priority: RulePriority;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationExample {
  id: string;
  organizationId: string;
  agentConfigId: string;
  question: string;
  answer: string;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSession {
  id: string;
  organizationId: string;
  agentConfigId: string;
  status: TrainingSessionStatus;
  description: string | null;
  documentsProcessed: number;
  rulesApplied: number;
  examplesAdded: number;
  accuracyBefore: number | null;
  accuracyAfter: number | null;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

export interface AgentAnalytics {
  id: string;
  organizationId: string;
  date: Date;
  channel: ChannelType | null;
  totalConversations: number;
  resolvedConversations: number;
  escalatedConversations: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  avgResponseTimeMs: number | null;
  avgResolutionTimeMs: number | null;
  positiveSentimentCount: number;
  neutralSentimentCount: number;
  negativeSentimentCount: number;
  paymentsCollectedCount: number;
  paymentsCollectedAmount: number;
  paymentPromisesCount: number;
  totalTokensUsed: number;
  totalCost: number;
  satisfactionScore: number | null;
  createdAt: Date;
}

export interface DashboardKpis {
  totalConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  escalatedConversations: number;
  avgResponseTimeMs: number | null;
  avgResolutionTimeMs: number | null;
  resolutionRate: number;
  escalationRate: number;
  positiveSentimentPct: number;
  neutralSentimentPct: number;
  negativeSentimentPct: number;
  totalMessages: number;
  totalTokensUsed: number;
  totalCost: number;
  paymentsCollectedCount: number;
  paymentsCollectedAmount: number;
  satisfactionScore: number | null;
}

export interface EscalationRule {
  id: string;
  agentConfigId: string;
  reason: EscalationReason;
  conditionConfig: Record<string, unknown> | null;
  assignToUserId: string | null;
  isActive: boolean;
  priority: number;
  createdAt: Date;
}

export interface ChannelConfig {
  id: string;
  agentConfigId: string;
  channel: ChannelType;
  isEnabled: boolean;
  maxMessagesPerConversation: number;
  greetingMessage: string | null;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  id: string;
  agentConfigId: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  createdAt: Date;
}

// ============== Paginated Response ==============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ============== Label Maps ==============

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  training: 'Entrenando',
  error: 'Error'
};

export const AGENT_TONE_LABELS: Record<AgentTone, string> = {
  professional: 'Profesional',
  friendly: 'Amigable',
  firm: 'Firme',
  empathetic: 'Empático'
};

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  active: 'Activa',
  resolved: 'Resuelta',
  escalated: 'Escalada',
  expired: 'Expirada'
};

export const MESSAGE_ROLE_LABELS: Record<MessageRole, string> = {
  agent: 'Agente',
  client: 'Cliente',
  system: 'Sistema',
  operator: 'Operador'
};

export const SENTIMENT_LABELS: Record<MessageSentiment, string> = {
  positive: 'Positivo',
  neutral: 'Neutral',
  negative: 'Negativo'
};

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  call: 'Llamada',
  ai_voice: 'IA Voice'
};

export const RULE_PRIORITY_LABELS: Record<RulePriority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
};

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  negative_sentiment: 'Sentimiento negativo',
  high_debt: 'Deuda alta',
  repeated_failure: 'Falla repetida',
  client_request: 'Solicitud del cliente',
  agent_uncertainty: 'Incertidumbre del agente',
  custom: 'Personalizado'
};

export const DAY_LABELS: Record<number, string> = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo'
};

export const DOC_STATUS_LABELS: Record<TrainingDocStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  processed: 'Procesado',
  failed: 'Fallido'
};

export const SESSION_STATUS_LABELS: Record<TrainingSessionStatus, string> = {
  running: 'En curso',
  completed: 'Completado',
  failed: 'Fallido'
};

// ============== AI Training - Request/Response Models ==============

/** Response from POST /ai-training/upload */
export interface DocumentUploadResponse {
  id: string;
  name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  status: string;
  message: string;
}

/** Request body for POST /ai-training/process */
export interface ProcessDocumentRequest {
  document_id: string;
}

/** Response from POST /ai-training/process */
export interface ProcessDocumentResponse {
  document_id: string;
  status: string;
  chunks_created: number;
  message: string;
}

/** Response from POST /ai-training/process-all */
export interface ProcessAllResponse {
  documents_processed: number;
  total_chunks_created: number;
  errors: string[];
}

/** Request body for POST /ai-training/rules */
export interface BusinessRuleCreateRequest {
  rule_text: string;
  priority: RulePriority;
  is_active?: boolean;
  sort_order?: number;
}

/** Request body for POST /ai-training/examples */
export interface ConversationExampleCreateRequest {
  question: string;
  answer: string;
  category?: string;
  is_active?: boolean;
}

// ============== Campaign Worker Models ==============

/** Response from POST /workers/campaigns/evaluate */
export interface CampaignEvaluationResult {
  campaigns_evaluated: number;
  tasks_enqueued: number;
  errors: string[];
}

/** Payload sent to POST /workers/messages/send */
export interface MessageTaskPayload {
  organization_id: string;
  campaign_id: string;
  debtor_id: string;
  action_id: string;
  stage_name: string;
  tone_instructions: string;
  channel: string;
}

/** Response from POST /workers/messages/send */
export interface MessageTaskResult {
  status: string;
  communication_log_id: string | null;
  message_preview: string | null;
  error: string | null;
}
