import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    String, DateTime, Integer, Boolean, Text, ForeignKey, Enum,
    Numeric, Float, Index, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.db.base import Base
from app.models.campaign import ChannelType


# ── Enums ──────────────────────────────────────────────────────────────

class AgentStatus(str, PyEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    TRAINING = "training"
    ERROR = "error"


class AgentTone(str, PyEnum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    FIRM = "firm"
    EMPATHETIC = "empathetic"


class ConversationStatus(str, PyEnum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    EXPIRED = "expired"


class MessageRole(str, PyEnum):
    AGENT = "agent"
    CLIENT = "client"
    SYSTEM = "system"


class MessageSentiment(str, PyEnum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class TrainingDocStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class TrainingSessionStatus(str, PyEnum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class RulePriority(str, PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class EscalationReason(str, PyEnum):
    NEGATIVE_SENTIMENT = "negative_sentiment"
    HIGH_DEBT = "high_debt"
    REPEATED_FAILURE = "repeated_failure"
    CLIENT_REQUEST = "client_request"
    AGENT_UNCERTAINTY = "agent_uncertainty"
    CUSTOM = "custom"


# ── Agent Configuration ────────────────────────────────────────────────

class AIAgentConfig(Base):
    """AI Agent configuration per organization."""
    __tablename__ = "ai_agent_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, unique=True,
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, server_default="Agente IA CobroFlow",
    )
    status: Mapped[AgentStatus] = mapped_column(
        Enum(AgentStatus, name="agent_status", create_type=True, values_callable=lambda e: [x.value for x in e]),
        default=AgentStatus.PAUSED,
    )
    model_provider: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default="openai",
    )
    model_name: Mapped[str] = mapped_column(
        String(100), nullable=False, server_default="gpt-4o",
    )
    temperature: Mapped[float] = mapped_column(
        Float, default=0.7, server_default="0.7",
    )
    max_tokens: Mapped[int] = mapped_column(
        Integer, default=2048, server_default="2048",
    )
    auto_respond: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true",
    )
    require_approval: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false",
    )
    max_retries: Mapped[int] = mapped_column(
        Integer, default=3, server_default="3",
    )
    retry_delay_minutes: Mapped[int] = mapped_column(
        Integer, default=30, server_default="30",
    )
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    personality: Mapped["AIAgentPersonality | None"] = relationship(
        "AIAgentPersonality", back_populates="agent_config", uselist=False,
    )
    channel_configs: Mapped[list["AIAgentChannelConfig"]] = relationship(
        "AIAgentChannelConfig", back_populates="agent_config",
        cascade="all, delete-orphan",
    )
    operating_hours: Mapped[list["AIAgentOperatingHours"]] = relationship(
        "AIAgentOperatingHours", back_populates="agent_config",
        cascade="all, delete-orphan",
    )
    escalation_rules: Mapped[list["AIAgentEscalationRule"]] = relationship(
        "AIAgentEscalationRule", back_populates="agent_config",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<AIAgentConfig(id={self.id}, name={self.name})>"


# ── Agent Personality ──────────────────────────────────────────────────

class AIAgentPersonality(Base):
    """AI Agent personality configuration."""
    __tablename__ = "ai_agent_personalities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False, unique=True,
    )
    tone: Mapped[AgentTone] = mapped_column(
        Enum(AgentTone, name="agent_tone", create_type=True, values_callable=lambda e: [x.value for x in e]),
        default=AgentTone.PROFESSIONAL,
    )
    greeting_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    farewell_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(
        String(5), default="es", server_default="es",
    )
    formality_level: Mapped[int] = mapped_column(
        Integer, default=3, server_default="3",
    )
    empathy_level: Mapped[int] = mapped_column(
        Integer, default=3, server_default="3",
    )
    forbidden_topics: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True,
    )
    custom_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    agent_config: Mapped["AIAgentConfig"] = relationship(
        "AIAgentConfig", back_populates="personality",
    )

    def __repr__(self) -> str:
        return f"<AIAgentPersonality(id={self.id}, tone={self.tone})>"


# ── Conversations ──────────────────────────────────────────────────────

class AIConversation(Base):
    """AI Agent conversation with a debtor."""
    __tablename__ = "ai_conversations"
    __table_args__ = (
        Index("ix_ai_conv_org_status", "organization_id", "status"),
        Index("ix_ai_conv_org_debtor", "organization_id", "debtor_id"),
        Index("ix_ai_conv_org_created", "organization_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    debtor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("debtors.id"), nullable=False,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, name="channel_type", create_type=False, values_callable=lambda e: [x.value for x in e]), nullable=False,
    )
    status: Mapped[ConversationStatus] = mapped_column(
        Enum(ConversationStatus, name="conversation_status", create_type=True, values_callable=lambda e: [x.value for x in e]),
        default=ConversationStatus.ACTIVE,
    )
    overall_sentiment: Mapped[MessageSentiment | None] = mapped_column(
        Enum(MessageSentiment, name="message_sentiment", create_type=True, values_callable=lambda e: [x.value for x in e]),
        nullable=True,
    )
    escalated_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )
    escalation_reason: Mapped[EscalationReason | None] = mapped_column(
        Enum(EscalationReason, name="escalation_reason", create_type=True, values_callable=lambda e: [x.value for x in e]),
        nullable=True,
    )
    resolution_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_messages: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    first_response_time_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )
    resolution_time_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    messages: Mapped[list["AIConversationMessage"]] = relationship(
        "AIConversationMessage", back_populates="conversation",
        cascade="all, delete-orphan", order_by="AIConversationMessage.created_at",
    )

    def __repr__(self) -> str:
        return f"<AIConversation(id={self.id}, status={self.status})>"


# ── Conversation Messages ──────────────────────────────────────────────

class AIConversationMessage(Base):
    """Individual message in an AI conversation."""
    __tablename__ = "ai_conversation_messages"
    __table_args__ = (
        Index("ix_ai_msg_conv_created", "conversation_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_conversations.id"), nullable=False,
    )
    role: Mapped[MessageRole] = mapped_column(
        Enum(MessageRole, name="message_role", create_type=True, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[MessageSentiment | None] = mapped_column(
        Enum(MessageSentiment, name="message_sentiment", create_type=False, values_callable=lambda e: [x.value for x in e]),
        nullable=True,
    )
    confidence_score: Mapped[float | None] = mapped_column(
        Float, nullable=True,
    )
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost: Mapped[float | None] = mapped_column(
        Numeric(10, 6), nullable=True,
    )
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    conversation: Mapped["AIConversation"] = relationship(
        "AIConversation", back_populates="messages",
    )

    def __repr__(self) -> str:
        return f"<AIConversationMessage(id={self.id}, role={self.role})>"


# ── Training Documents ─────────────────────────────────────────────────

class AITrainingDocument(Base):
    """Training documents uploaded for AI agent knowledge base."""
    __tablename__ = "ai_training_documents"
    __table_args__ = (
        Index("ix_ai_doc_org_status", "organization_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_id: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
    )
    status: Mapped[TrainingDocStatus] = mapped_column(
        Enum(TrainingDocStatus, name="training_doc_status", create_type=True, values_callable=lambda e: [x.value for x in e]),
        default=TrainingDocStatus.PENDING,
    )
    chunk_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AITrainingDocument(id={self.id}, name={self.name})>"


# ── Business Rules ─────────────────────────────────────────────────────

class AIBusinessRule(Base):
    """Business rules that guide AI agent behavior."""
    __tablename__ = "ai_business_rules"
    __table_args__ = (
        Index("ix_ai_rule_org_active", "organization_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    rule_text: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[RulePriority] = mapped_column(
        Enum(RulePriority, name="rule_priority", create_type=True, values_callable=lambda e: [x.value for x in e]),
        default=RulePriority.MEDIUM,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true",
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AIBusinessRule(id={self.id}, priority={self.priority})>"


# ── Conversation Examples ──────────────────────────────────────────────

class AIConversationExample(Base):
    """Example Q&A pairs for agent training."""
    __tablename__ = "ai_conversation_examples"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AIConversationExample(id={self.id})>"


# ── Training Sessions ─────────────────────────────────────────────────

class AITrainingSession(Base):
    """Training session history."""
    __tablename__ = "ai_training_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    status: Mapped[TrainingSessionStatus] = mapped_column(
        Enum(TrainingSessionStatus, name="training_session_status", create_type=True, values_callable=lambda e: [x.value for x in e]),
        default=TrainingSessionStatus.RUNNING,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    documents_processed: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    rules_applied: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    examples_added: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    accuracy_before: Mapped[float | None] = mapped_column(Float, nullable=True)
    accuracy_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AITrainingSession(id={self.id}, status={self.status})>"


# ── Analytics (daily aggregation) ─────────────────────────────────────

class AIAgentAnalytics(Base):
    """Daily aggregated analytics for AI agent performance."""
    __tablename__ = "ai_agent_analytics"
    __table_args__ = (
        UniqueConstraint("organization_id", "date", "channel", name="uq_analytics_org_date_channel"),
        Index("ix_ai_analytics_org_date", "organization_id", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )
    channel: Mapped[ChannelType | None] = mapped_column(
        Enum(ChannelType, name="channel_type", create_type=False, values_callable=lambda e: [x.value for x in e]),
        nullable=True,
    )
    total_conversations: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    resolved_conversations: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    escalated_conversations: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    total_messages_sent: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    total_messages_received: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    avg_response_time_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )
    avg_resolution_time_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )
    positive_sentiment_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    neutral_sentiment_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    negative_sentiment_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    payments_collected_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    payments_collected_amount: Mapped[float] = mapped_column(
        Numeric(15, 2), default=0, server_default="0",
    )
    payment_promises_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    total_tokens_used: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    total_cost: Mapped[float] = mapped_column(
        Numeric(10, 4), default=0, server_default="0",
    )
    satisfaction_score: Mapped[float | None] = mapped_column(
        Float, nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AIAgentAnalytics(id={self.id}, date={self.date})>"


# ── Escalation Rules ──────────────────────────────────────────────────

class AIAgentEscalationRule(Base):
    """Rules for when to escalate conversations to human agents."""
    __tablename__ = "ai_agent_escalation_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    reason: Mapped[EscalationReason] = mapped_column(
        Enum(EscalationReason, name="escalation_reason", create_type=False, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    condition_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    assign_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true",
    )
    priority: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    agent_config: Mapped["AIAgentConfig"] = relationship(
        "AIAgentConfig", back_populates="escalation_rules",
    )

    def __repr__(self) -> str:
        return f"<AIAgentEscalationRule(id={self.id}, reason={self.reason})>"


# ── Channel Configuration ─────────────────────────────────────────────

class AIAgentChannelConfig(Base):
    """Per-channel configuration for the AI agent."""
    __tablename__ = "ai_agent_channel_configs"
    __table_args__ = (
        UniqueConstraint("agent_config_id", "channel", name="uq_agent_channel"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, name="channel_type", create_type=False, values_callable=lambda e: [x.value for x in e]), nullable=False,
    )
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true",
    )
    max_messages_per_conversation: Mapped[int] = mapped_column(
        Integer, default=50, server_default="50",
    )
    greeting_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    agent_config: Mapped["AIAgentConfig"] = relationship(
        "AIAgentConfig", back_populates="channel_configs",
    )

    def __repr__(self) -> str:
        return f"<AIAgentChannelConfig(id={self.id}, channel={self.channel})>"


# ── Operating Hours ────────────────────────────────────────────────────

class AIDocumentChunk(Base):
    """Stores original text for chunks vectorized in Vertex AI Vector Search."""
    __tablename__ = "ai_document_chunks"
    __table_args__ = (
        Index("ix_ai_chunk_org", "organization_id"),
        Index("ix_ai_chunk_vertex_dp", "vertex_datapoint_id"),
        Index("ix_ai_chunk_doc", "document_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_training_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    vertex_datapoint_id: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True,
    )
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True,
    )
    embedding_vector: Mapped[list[float] | None] = mapped_column(
        Vector(768), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    document: Mapped["AITrainingDocument"] = relationship(
        "AITrainingDocument", backref="chunks",
    )

    def __repr__(self) -> str:
        return f"<AIDocumentChunk(id={self.id}, dp={self.vertex_datapoint_id})>"


class AIAgentOperatingHours(Base):
    """Operating hours per day of week for the AI agent."""
    __tablename__ = "ai_agent_operating_hours"
    __table_args__ = (
        UniqueConstraint("agent_config_id", "day_of_week", name="uq_agent_day"),
        CheckConstraint("day_of_week >= 0 AND day_of_week <= 6", name="ck_day_of_week"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    agent_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_agent_configs.id"), nullable=False,
    )
    day_of_week: Mapped[int] = mapped_column(
        Integer, nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true",
    )
    start_time: Mapped[str] = mapped_column(
        String(5), nullable=False, server_default="09:00",
    )
    end_time: Mapped[str] = mapped_column(
        String(5), nullable=False, server_default="18:00",
    )
    timezone: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default="America/Mexico_City",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    agent_config: Mapped["AIAgentConfig"] = relationship(
        "AIAgentConfig", back_populates="operating_hours",
    )

    def __repr__(self) -> str:
        return f"<AIAgentOperatingHours(id={self.id}, day={self.day_of_week})>"
