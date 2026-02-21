"""Message sending worker – receives tasks from the 'message-sending' queue.

Endpoint: POST /workers/messages/send

Receives a payload with organization_id, debtor_id, action_id.
Generates a personalized message via VertexAIGenerator, logs it to
communication_logs, and simulates sending through the channel.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.ai_agent import AIAgentConfig, AIAgentPersonality
from app.models.campaign import Campaign, CampaignStage, StageAction
from app.models.communication import CommunicationLog
from app.models.debtor import Debtor
from app.models.invoice import Invoice
from app.services.vertex_ai import VertexAIGenerator

logger = logging.getLogger(__name__)

router = APIRouter()


class MessageTaskPayload(BaseModel):
    organization_id: str
    campaign_id: str
    stage_id: str
    action_id: str
    debtor_id: str
    channel: str = "email"
    ai_enabled: bool = True
    tone_instructions: str = ""


class MessageTaskResult(BaseModel):
    status: str
    communication_log_id: str | None = None
    message_preview: str | None = None
    error: str | None = None


@router.post("/messages/send", response_model=MessageTaskResult)
def send_message(
    payload: MessageTaskPayload,
    db: Annotated[Session, Depends(get_db)],
) -> MessageTaskResult:
    """Generate and send a personalized collection message."""
    try:
        org_id = UUID(payload.organization_id)
        debtor_id = UUID(payload.debtor_id)
        campaign_id = UUID(payload.campaign_id)
        stage_id = UUID(payload.stage_id)
        action_id = UUID(payload.action_id)

        # Load stage
        stage = db.execute(
            select(CampaignStage).where(CampaignStage.id == stage_id)
        ).scalar_one_or_none()
        stage_name = stage.name if stage else "Unknown"

        # Load debtor
        debtor = db.execute(
            select(Debtor).where(
                Debtor.id == debtor_id,
                Debtor.organization_id == org_id,
            )
        ).scalar_one_or_none()
        if not debtor:
            return MessageTaskResult(status="error", error=f"Debtor {debtor_id} not found")

        # Load campaign
        campaign = db.execute(
            select(Campaign).where(Campaign.id == campaign_id)
        ).scalar_one_or_none()
        if not campaign:
            return MessageTaskResult(status="error", error=f"Campaign {campaign_id} not found")

        # Load debtor's overdue invoices
        invoices = list(
            db.execute(
                select(Invoice).where(
                    Invoice.debtor_id == debtor_id,
                    Invoice.organization_id == org_id,
                    Invoice.status.in_(["pending", "overdue"]),
                    Invoice.balance > 0,
                )
            ).scalars().all()
        )

        total_debt = sum(float(inv.balance) for inv in invoices)
        max_overdue = 0
        if invoices:
            today = datetime.now(timezone.utc).date()
            max_overdue = max(
                (today - inv.due_date).days
                for inv in invoices
                if inv.due_date < today
            )

        # Load agent personality
        agent_config = db.execute(
            select(AIAgentConfig).where(
                AIAgentConfig.organization_id == org_id,
            )
        ).scalar_one_or_none()

        personality_dict: dict | None = None
        if agent_config:
            personality = db.execute(
                select(AIAgentPersonality).where(
                    AIAgentPersonality.agent_config_id == agent_config.id,
                )
            ).scalar_one_or_none()
            if personality:
                personality_dict = {
                    "tone": personality.tone.value if personality.tone else "professional",
                    "formality_level": personality.formality_level,
                    "empathy_level": personality.empathy_level,
                    "language": personality.language,
                    "custom_instructions": personality.custom_instructions,
                    "forbidden_topics": personality.forbidden_topics,
                }

        # Build contexts
        campaign_context = {
            "campaign_name": campaign.name,
            "campaign_type": campaign.campaign_type.value if campaign.campaign_type else "friendly",
            "stage_name": stage_name,
            "tone_instructions": payload.tone_instructions,
            "ai_enabled": payload.ai_enabled,
        }

        debtor_context = {
            "name": debtor.name,
            "total_debt": total_debt,
            "currency": "ARS",
            "days_overdue": max_overdue,
            "risk_score": debtor.risk_score or 50,
            "pending_invoices": len(invoices),
        }

        # Generate message via Vertex AI
        generator = VertexAIGenerator(db=db)
        result = generator.generate_campaign_message(
            organization_id=payload.organization_id,
            campaign_context=campaign_context,
            debtor_context=debtor_context,
            agent_personality=personality_dict,
            channel=payload.channel,
        )

        # Create communication log entry
        comm_log = CommunicationLog(
            organization_id=org_id,
            debtor_id=debtor_id,
            campaign_id=campaign_id,
            channel=payload.channel,
            direction="outbound",
            status="sent",
            subject=result.get("subject"),
            body=result["message"],
            recipient_address=_get_recipient_address(debtor, payload.channel),
            provider="vertex_ai",
            sent_at=datetime.now(timezone.utc),
        )
        # Set metadata via the mapped attribute
        comm_log.metadata_ = {
            "ai_generated": True,
            "model": settings.VERTEX_FLASH_MODEL,
            "tokens_used": result.get("tokens_used", 0),
            "action_id": str(action_id),
            "stage_id": str(stage_id),
            "stage_name": stage_name,
        }
        db.add(comm_log)
        db.commit()
        db.refresh(comm_log)

        # TODO: Send via actual channel provider (Twilio, SendGrid, etc.)
        logger.info(
            "Message sent: debtor=%s channel=%s log_id=%s",
            debtor_id, payload.channel, comm_log.id,
        )

        return MessageTaskResult(
            status="sent",
            communication_log_id=str(comm_log.id),
            message_preview=result["message"][:200],
        )

    except Exception as e:
        logger.exception("Failed to send message: %s", e)
        return MessageTaskResult(status="error", error=str(e))


def _get_recipient_address(debtor: Debtor, channel: str) -> str | None:
    """Get the appropriate contact address for the channel."""
    if channel in ("whatsapp", "sms", "call", "ai_voice"):
        return debtor.phone
    if channel == "email":
        return debtor.email
    return None
