import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    String, DateTime, Integer, Boolean, Text, ForeignKey, Enum,
    Numeric, Index, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.campaign import ChannelType


class TemplateStatus(str, PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class WorkflowStatus(str, PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class StepConditionType(str, PyEnum):
    NONE = "none"
    PREVIOUS_NOT_OPENED = "previous_not_opened"
    PREVIOUS_NOT_REPLIED = "previous_not_replied"
    PREVIOUS_BOUNCED = "previous_bounced"
    INVOICE_STILL_UNPAID = "invoice_still_unpaid"


class CommunicationDirection(str, PyEnum):
    OUTBOUND = "outbound"
    INBOUND = "inbound"


class CommunicationStatus(str, PyEnum):
    SCHEDULED = "scheduled"
    QUEUED = "queued"
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    FAILED = "failed"
    BOUNCED = "bounced"
    CANCELLED = "cancelled"


class CommunicationEventType(str, PyEnum):
    SCHEDULED = "scheduled"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    BOUNCED = "bounced"
    FAILED = "failed"
    UNSUBSCRIBED = "unsubscribed"
    COMPLAINED = "complained"
    PAYMENT_PROMISE = "payment_promise"
    PAYMENT_MADE = "payment_made"
    ESCALATED = "escalated"
    CANCELLED = "cancelled"


class MessageTemplate(Base):
    """Message template model."""
    __tablename__ = "message_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, name="channel_type", create_type=False, values_callable=lambda e: [x.value for x in e]), nullable=False,
    )
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True,
    )
    status: Mapped[TemplateStatus] = mapped_column(
        Enum(TemplateStatus, name="template_status", create_type=True),
        default=TemplateStatus.DRAFT,
    )
    language: Mapped[str] = mapped_column(
        String(5), default="es", server_default="es",
    )
    times_used: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    open_rate: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True,
    )
    click_rate: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True,
    )
    reply_rate: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True,
    )
    conversion_rate: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True,
    )
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True,
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
        return f"<MessageTemplate(id={self.id}, name={self.name})>"


class CollectionWorkflow(Base):
    """Collection workflow model."""
    __tablename__ = "collection_workflows"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[WorkflowStatus] = mapped_column(
        Enum(WorkflowStatus, name="workflow_status", create_type=True),
        default=WorkflowStatus.DRAFT,
    )
    trigger_description: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
    )
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    total_executions: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    success_rate: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True,
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

    # Relationships
    steps: Mapped[list["WorkflowStep"]] = relationship(
        "WorkflowStep",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )

    def __repr__(self) -> str:
        return f"<CollectionWorkflow(id={self.id}, name={self.name})>"


class WorkflowStep(Base):
    """Workflow step model."""
    __tablename__ = "workflow_steps"
    __table_args__ = (
        UniqueConstraint("workflow_id", "step_order", name="uq_workflow_step_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("collection_workflows.id"), nullable=False,
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, name="channel_type", create_type=False, values_callable=lambda e: [x.value for x in e]), nullable=False,
    )
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("message_templates.id"), nullable=True,
    )
    delay_days: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    delay_hours: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0",
    )
    send_time: Mapped[str | None] = mapped_column(
        String(5), nullable=True,
    )
    condition_type: Mapped[StepConditionType] = mapped_column(
        Enum(StepConditionType, name="step_condition_type", create_type=True),
        default=StepConditionType.NONE,
    )
    fallback_channel: Mapped[str | None] = mapped_column(
        String(20), nullable=True,
    )
    ai_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false",
    )
    ai_instructions: Mapped[str | None] = mapped_column(
        Text, nullable=True,
    )
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    workflow: Mapped["CollectionWorkflow"] = relationship(
        "CollectionWorkflow", back_populates="steps",
    )

    def __repr__(self) -> str:
        return f"<WorkflowStep(id={self.id}, name={self.name})>"


class CommunicationLog(Base):
    """Communication log model - full audit trail."""
    __tablename__ = "communication_logs"
    __table_args__ = (
        Index("ix_comm_logs_org_created", "organization_id", "created_at"),
        Index("ix_comm_logs_org_debtor", "organization_id", "debtor_id"),
        Index("ix_comm_logs_org_campaign", "organization_id", "campaign_id"),
        Index("ix_comm_logs_org_channel_status", "organization_id", "channel", "status"),
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
    invoice_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True,
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=True,
    )
    workflow_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("collection_workflows.id"), nullable=True,
    )
    workflow_step_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workflow_steps.id"), nullable=True,
    )
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("message_templates.id"), nullable=True,
    )
    sent_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, name="channel_type", create_type=False, values_callable=lambda e: [x.value for x in e]), nullable=False,
    )
    direction: Mapped[CommunicationDirection] = mapped_column(
        Enum(CommunicationDirection, name="communication_direction", create_type=True),
        default=CommunicationDirection.OUTBOUND,
    )
    status: Mapped[CommunicationStatus] = mapped_column(
        Enum(CommunicationStatus, name="communication_status", create_type=True),
        default=CommunicationStatus.SCHEDULED,
    )
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    recipient_address: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    external_message_id: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
    )
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    opened_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    clicked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    failed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    call_duration_seconds: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )
    call_outcome: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cost: Mapped[float | None] = mapped_column(
        Numeric(10, 4), nullable=True,
    )
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    events: Mapped[list["CommunicationEvent"]] = relationship(
        "CommunicationEvent",
        back_populates="communication_log",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<CommunicationLog(id={self.id}, channel={self.channel})>"


class CommunicationEvent(Base):
    """Communication event model - individual events in a communication lifecycle."""
    __tablename__ = "communication_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    communication_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("communication_logs.id"), nullable=False,
    )
    event_type: Mapped[CommunicationEventType] = mapped_column(
        Enum(CommunicationEventType, name="communication_event_type", create_type=True),
        nullable=False,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )
    data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    communication_log: Mapped["CommunicationLog"] = relationship(
        "CommunicationLog", back_populates="events",
    )

    def __repr__(self) -> str:
        return f"<CommunicationEvent(id={self.id}, type={self.event_type})>"
