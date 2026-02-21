from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.ai_agent import (
    AgentStatus, AgentTone, ConversationStatus, MessageRole,
    MessageSentiment, TrainingDocStatus, TrainingSessionStatus,
    RulePriority, EscalationReason,
)
from app.models.campaign import ChannelType


# ============== AI Agent Config ==============

class AIAgentConfigBase(BaseModel):
    name: str = Field(default="Agente IA CobroFlow", max_length=255)
    status: AgentStatus = AgentStatus.PAUSED
    model_provider: str = Field(default="openai", max_length=50)
    model_name: str = Field(default="gpt-4o", max_length=100)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1, le=128000)
    auto_respond: bool = True
    require_approval: bool = False
    max_retries: int = Field(default=3, ge=0)
    retry_delay_minutes: int = Field(default=30, ge=1)
    settings: dict | None = None


class AIAgentConfigUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    status: AgentStatus | None = None
    model_provider: str | None = Field(None, max_length=50)
    model_name: str | None = Field(None, max_length=100)
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=1, le=128000)
    auto_respond: bool | None = None
    require_approval: bool | None = None
    max_retries: int | None = Field(None, ge=0)
    retry_delay_minutes: int | None = Field(None, ge=1)
    settings: dict | None = None


class AIAgentConfigResponse(AIAgentConfigBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime


# ============== Personality ==============

class AIAgentPersonalityBase(BaseModel):
    tone: AgentTone = AgentTone.PROFESSIONAL
    greeting_template: str | None = None
    farewell_template: str | None = None
    system_prompt: str | None = None
    language: str = Field(default="es", max_length=5)
    formality_level: int = Field(default=3, ge=1, le=5)
    empathy_level: int = Field(default=3, ge=1, le=5)
    forbidden_topics: list[str] | None = None
    custom_instructions: str | None = None


class AIAgentPersonalityCreate(AIAgentPersonalityBase):
    pass


class AIAgentPersonalityUpdate(BaseModel):
    tone: AgentTone | None = None
    greeting_template: str | None = None
    farewell_template: str | None = None
    system_prompt: str | None = None
    language: str | None = Field(None, max_length=5)
    formality_level: int | None = Field(None, ge=1, le=5)
    empathy_level: int | None = Field(None, ge=1, le=5)
    forbidden_topics: list[str] | None = None
    custom_instructions: str | None = None


class AIAgentPersonalityResponse(AIAgentPersonalityBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agent_config_id: UUID
    created_at: datetime
    updated_at: datetime


# ============== Conversations ==============

class AIConversationBase(BaseModel):
    debtor_id: UUID
    channel: ChannelType
    status: ConversationStatus = ConversationStatus.ACTIVE


class AIConversationCreate(BaseModel):
    debtor_id: UUID
    channel: ChannelType
    agent_config_id: UUID | None = None


class AIConversationUpdate(BaseModel):
    status: ConversationStatus | None = None
    overall_sentiment: MessageSentiment | None = None
    escalated_to_user_id: UUID | None = None
    escalation_reason: EscalationReason | None = None
    resolution_summary: str | None = None


class AIConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    debtor_id: UUID
    agent_config_id: UUID
    channel: ChannelType
    status: ConversationStatus
    overall_sentiment: MessageSentiment | None = None
    escalated_to_user_id: UUID | None = None
    escalation_reason: EscalationReason | None = None
    resolution_summary: str | None = None
    total_messages: int
    first_response_time_ms: int | None = None
    resolution_time_ms: int | None = None
    started_at: datetime
    resolved_at: datetime | None = None
    created_at: datetime


class AIConversationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    debtor_id: UUID
    channel: ChannelType
    status: ConversationStatus
    overall_sentiment: MessageSentiment | None = None
    total_messages: int
    started_at: datetime
    created_at: datetime


class AIConversationListResponse(BaseModel):
    items: list[AIConversationListItem]
    total: int
    page: int
    size: int


# ============== Messages ==============

class AIConversationMessageCreate(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1)
    sentiment: MessageSentiment | None = None
    confidence_score: float | None = Field(None, ge=0.0, le=1.0)
    tokens_used: int | None = None
    cost: float | None = None
    metadata_: dict | None = Field(None, alias="metadata")


class AIConversationMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    sentiment: MessageSentiment | None = None
    confidence_score: float | None = None
    tokens_used: int | None = None
    cost: float | None = None
    metadata_: dict | None = Field(None, alias="metadata")
    created_at: datetime


# ============== Training Documents ==============

class AITrainingDocumentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    file_type: str | None = Field(None, max_length=50)
    content_text: str | None = None


class AITrainingDocumentCreate(AITrainingDocumentBase):
    file_path: str | None = None
    file_size_bytes: int | None = None


class AITrainingDocumentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=500)
    status: TrainingDocStatus | None = None
    content_text: str | None = None
    error_message: str | None = None


class AITrainingDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    agent_config_id: UUID
    name: str
    file_path: str | None = None
    file_type: str | None = None
    file_size_bytes: int | None = None
    content_text: str | None = None
    embedding_id: str | None = None
    status: TrainingDocStatus
    chunk_count: int
    error_message: str | None = None
    uploaded_by_user_id: UUID | None = None
    processed_at: datetime | None = None
    created_at: datetime


class AITrainingDocumentListResponse(BaseModel):
    items: list[AITrainingDocumentResponse]
    total: int
    page: int
    size: int


# ============== Business Rules ==============

class AIBusinessRuleBase(BaseModel):
    rule_text: str = Field(..., min_length=1)
    priority: RulePriority = RulePriority.MEDIUM
    is_active: bool = True
    sort_order: int = Field(default=0, ge=0)


class AIBusinessRuleCreate(AIBusinessRuleBase):
    pass


class AIBusinessRuleUpdate(BaseModel):
    rule_text: str | None = Field(None, min_length=1)
    priority: RulePriority | None = None
    is_active: bool | None = None
    sort_order: int | None = Field(None, ge=0)


class AIBusinessRuleResponse(AIBusinessRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    agent_config_id: UUID
    created_at: datetime
    updated_at: datetime


class AIBusinessRuleListResponse(BaseModel):
    items: list[AIBusinessRuleResponse]
    total: int
    page: int
    size: int


class AIBusinessRuleReorderItem(BaseModel):
    id: UUID
    sort_order: int = Field(..., ge=0)


class AIBusinessRuleReorderRequest(BaseModel):
    rules: list[AIBusinessRuleReorderItem]


# ============== Conversation Examples ==============

class AIConversationExampleBase(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    category: str | None = Field(None, max_length=100)
    is_active: bool = True


class AIConversationExampleCreate(AIConversationExampleBase):
    pass


class AIConversationExampleUpdate(BaseModel):
    question: str | None = Field(None, min_length=1)
    answer: str | None = Field(None, min_length=1)
    category: str | None = Field(None, max_length=100)
    is_active: bool | None = None


class AIConversationExampleResponse(AIConversationExampleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    agent_config_id: UUID
    created_at: datetime
    updated_at: datetime


class AIConversationExampleListResponse(BaseModel):
    items: list[AIConversationExampleResponse]
    total: int
    page: int
    size: int


# ============== Training Sessions ==============

class AITrainingSessionCreate(BaseModel):
    description: str | None = None


class AITrainingSessionUpdate(BaseModel):
    status: TrainingSessionStatus | None = None
    documents_processed: int | None = None
    rules_applied: int | None = None
    examples_added: int | None = None
    accuracy_before: float | None = None
    accuracy_after: float | None = None
    error_message: str | None = None


class AITrainingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    agent_config_id: UUID
    status: TrainingSessionStatus
    description: str | None = None
    documents_processed: int
    rules_applied: int
    examples_added: int
    accuracy_before: float | None = None
    accuracy_after: float | None = None
    error_message: str | None = None
    started_at: datetime
    completed_at: datetime | None = None
    created_at: datetime


class AITrainingSessionListResponse(BaseModel):
    items: list[AITrainingSessionResponse]
    total: int
    page: int
    size: int


# ============== Analytics ==============

class AIAgentAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    date: datetime
    channel: ChannelType | None = None
    total_conversations: int
    resolved_conversations: int
    escalated_conversations: int
    total_messages_sent: int
    total_messages_received: int
    avg_response_time_ms: int | None = None
    avg_resolution_time_ms: int | None = None
    positive_sentiment_count: int
    neutral_sentiment_count: int
    negative_sentiment_count: int
    payments_collected_count: int
    payments_collected_amount: float
    payment_promises_count: int
    total_tokens_used: int
    total_cost: float
    satisfaction_score: float | None = None
    created_at: datetime


class AIAgentAnalyticsListResponse(BaseModel):
    items: list[AIAgentAnalyticsResponse]
    total: int
    page: int
    size: int


class AIAgentDashboardKpis(BaseModel):
    total_conversations: int = 0
    active_conversations: int = 0
    resolved_conversations: int = 0
    escalated_conversations: int = 0
    avg_response_time_ms: int | None = None
    avg_resolution_time_ms: int | None = None
    resolution_rate: float = 0.0
    escalation_rate: float = 0.0
    positive_sentiment_pct: float = 0.0
    neutral_sentiment_pct: float = 0.0
    negative_sentiment_pct: float = 0.0
    total_messages: int = 0
    total_tokens_used: int = 0
    total_cost: float = 0.0
    payments_collected_count: int = 0
    payments_collected_amount: float = 0.0
    satisfaction_score: float | None = None


# ============== Escalation Rules ==============

class AIAgentEscalationRuleBase(BaseModel):
    reason: EscalationReason
    condition_config: dict | None = None
    assign_to_user_id: UUID | None = None
    is_active: bool = True
    priority: int = Field(default=0, ge=0)


class AIAgentEscalationRuleCreate(AIAgentEscalationRuleBase):
    pass


class AIAgentEscalationRuleUpdate(BaseModel):
    reason: EscalationReason | None = None
    condition_config: dict | None = None
    assign_to_user_id: UUID | None = None
    is_active: bool | None = None
    priority: int | None = Field(None, ge=0)


class AIAgentEscalationRuleResponse(AIAgentEscalationRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agent_config_id: UUID
    created_at: datetime


# ============== Channel Config ==============

class AIAgentChannelConfigBase(BaseModel):
    channel: ChannelType
    is_enabled: bool = True
    max_messages_per_conversation: int = Field(default=50, ge=1)
    greeting_message: str | None = None
    settings: dict | None = None


class AIAgentChannelConfigCreate(AIAgentChannelConfigBase):
    pass


class AIAgentChannelConfigUpdate(BaseModel):
    is_enabled: bool | None = None
    max_messages_per_conversation: int | None = Field(None, ge=1)
    greeting_message: str | None = None
    settings: dict | None = None


class AIAgentChannelConfigResponse(AIAgentChannelConfigBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agent_config_id: UUID
    created_at: datetime
    updated_at: datetime


# ============== Operating Hours ==============

class AIAgentOperatingHoursBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    is_active: bool = True
    start_time: str = Field(default="09:00", max_length=5)
    end_time: str = Field(default="18:00", max_length=5)
    timezone: str = Field(default="America/Mexico_City", max_length=50)


class AIAgentOperatingHoursCreate(AIAgentOperatingHoursBase):
    pass


class AIAgentOperatingHoursResponse(AIAgentOperatingHoursBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agent_config_id: UUID
    created_at: datetime
