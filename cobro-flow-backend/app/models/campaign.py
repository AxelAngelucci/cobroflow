import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Integer, Boolean, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organization import Organization


class CampaignType(str, PyEnum):
    """Campaign type enum."""
    PREVENTIVE = "preventive"
    FRIENDLY = "friendly"
    ASSERTIVE = "assertive"
    LEGAL = "legal"


class ChannelType(str, PyEnum):
    """Communication channel type enum."""
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
    CALL = "call"
    AI_VOICE = "ai_voice"


class Campaign(Base):
    """Campaign model - represents a collection campaign."""
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    campaign_type: Mapped[CampaignType | None] = mapped_column(
        Enum(CampaignType, name="campaign_type", create_type=True),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
    )
    strategy_config: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Audience filters, scheduling, channel config, AI settings",
    )
    workflow_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("collection_workflows.id"),
        nullable=True,
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
    organization: Mapped["Organization"] = relationship("Organization")
    stages: Mapped[list["CampaignStage"]] = relationship(
        "CampaignStage",
        back_populates="campaign",
        cascade="all, delete-orphan",
        order_by="CampaignStage.day_start",
    )

    def __repr__(self) -> str:
        return f"<Campaign(id={self.id}, name={self.name})>"


class CampaignStage(Base):
    """Campaign stage model - represents escalation stages."""
    __tablename__ = "campaign_stages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    day_start: Mapped[int] = mapped_column(Integer, nullable=False)
    day_end: Mapped[int] = mapped_column(Integer, nullable=False)
    tone_instructions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="AI tone instructions for this stage",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    campaign: Mapped["Campaign"] = relationship(
        "Campaign",
        back_populates="stages",
    )
    actions: Mapped[list["StageAction"]] = relationship(
        "StageAction",
        back_populates="stage",
        cascade="all, delete-orphan",
        order_by="StageAction.trigger_day",
    )

    def __repr__(self) -> str:
        return f"<CampaignStage(id={self.id}, name={self.name})>"


class StageAction(Base):
    """Stage action model - specific actions within a campaign stage."""
    __tablename__ = "stage_actions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    stage_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_stages.id"),
        nullable=False,
    )
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, name="channel_type", create_type=True),
        nullable=False,
    )
    trigger_day: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Day within the stage to trigger this action",
    )
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("message_templates.id"),
        nullable=True,
    )
    ai_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    stage: Mapped["CampaignStage"] = relationship(
        "CampaignStage",
        back_populates="actions",
    )

    def __repr__(self) -> str:
        return f"<StageAction(id={self.id}, channel={self.channel})>"
