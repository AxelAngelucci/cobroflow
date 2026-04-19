"""Message dispatch service.

Encapsulates the full lifecycle of generating and sending a campaign message:
  1. Load debtor, campaign, stage, and agent personality from the DB.
  2. Build context dicts for VertexAI.
  3. Call ``VertexAIGenerator.generate_campaign_message()``.
  4. Persist the ``CommunicationLog``.
  5. Dispatch through the appropriate channel provider (Twilio / SendGrid).
  6. Update the log with the provider SID or mark it FAILED.

The worker endpoint is reduced to: parse payload → call ``dispatch_message()``
→ return result.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_agent import AIAgentConfig, AIAgentPersonality
from app.models.campaign import Campaign, CampaignStage
from app.models.communication import CommunicationLog, CommunicationStatus
from app.models.debtor import Debtor
from app.models.invoice import Invoice
from app.services.sendgrid_service import send_email
from app.services.twilio_service import send_sms_message, send_whatsapp_message
from app.services.vertex_ai import VertexAIGenerator

logger = logging.getLogger(__name__)


def dispatch_message(
    db: Session,
    organization_id: UUID,
    campaign_id: UUID,
    stage_id: UUID,
    action_id: UUID,
    debtor_id: UUID,
    channel: str = "email",
    ai_enabled: bool = True,
    tone_instructions: str = "",
) -> dict:
    """Generate a personalized collection message and send it through the channel.

    Returns a dict with keys: ``status``, ``communication_log_id``,
    ``message_preview``, and optionally ``error``.
    """
    # Load stage
    stage = db.execute(
        select(CampaignStage).where(CampaignStage.id == stage_id)
    ).scalar_one_or_none()
    stage_name = stage.name if stage else "Unknown"

    # Load debtor
    debtor = db.execute(
        select(Debtor).where(
            Debtor.id == debtor_id,
            Debtor.organization_id == organization_id,
        )
    ).scalar_one_or_none()
    if not debtor:
        return {"status": "error", "error": f"Debtor {debtor_id} not found"}

    # Load campaign
    campaign = db.execute(
        select(Campaign).where(Campaign.id == campaign_id)
    ).scalar_one_or_none()
    if not campaign:
        return {"status": "error", "error": f"Campaign {campaign_id} not found"}

    # Load debtor's pending/overdue invoices
    invoices = list(
        db.execute(
            select(Invoice).where(
                Invoice.debtor_id == debtor_id,
                Invoice.organization_id == organization_id,
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
            AIAgentConfig.organization_id == organization_id,
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

    # Build context dicts
    campaign_context = {
        "campaign_name": campaign.name,
        "campaign_type": campaign.campaign_type.value if campaign.campaign_type else "friendly",
        "stage_name": stage_name,
        "tone_instructions": tone_instructions,
        "ai_enabled": ai_enabled,
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
        organization_id=str(organization_id),
        campaign_context=campaign_context,
        debtor_context=debtor_context,
        agent_personality=personality_dict,
        channel=channel,
    )

    # Persist communication log
    comm_log = CommunicationLog(
        organization_id=organization_id,
        debtor_id=debtor_id,
        campaign_id=campaign_id,
        channel=channel,
        direction="outbound",
        status="sent",
        subject=result.get("subject"),
        body=result["message"],
        recipient_address=_get_recipient_address(debtor, channel),
        provider="vertex_ai",
        sent_at=datetime.now(timezone.utc),
    )
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

    # Dispatch through channel provider
    sid = _dispatch_channel(
        channel=channel,
        recipient=_get_recipient_address(debtor, channel),
        body=result["message"],
        subject=result.get("subject"),
    )
    if sid:
        comm_log.external_message_id = sid
        comm_log.provider = "twilio" if channel in ("whatsapp", "sms") else "sendgrid"
    elif channel in ("whatsapp", "sms", "email"):
        comm_log.status = CommunicationStatus.FAILED
        comm_log.failed_at = datetime.now(timezone.utc)
        comm_log.error_message = "Provider send failed — check logs for details"
    db.commit()

    logger.info(
        "Message dispatched: debtor=%s channel=%s log_id=%s sid=%s",
        debtor_id,
        channel,
        comm_log.id,
        sid,
    )

    return {
        "status": "sent",
        "communication_log_id": str(comm_log.id),
        "message_preview": result["message"][:200],
    }


def _dispatch_channel(
    channel: str,
    recipient: str | None,
    body: str,
    subject: str | None = None,
) -> str | None:
    """Send the message through the appropriate provider. Returns provider SID or None."""
    if not recipient:
        logger.warning("No recipient address for channel %s — skipping send", channel)
        return None
    if channel in ("whatsapp", "sms") and settings.TEST_RECIPIENT_PHONE:
        recipient = settings.TEST_RECIPIENT_PHONE
        logger.info("TEST_RECIPIENT_PHONE override active — sending to %s", recipient)
    if channel == "whatsapp":
        return send_whatsapp_message(to=recipient, body=body)
    if channel == "sms":
        return send_sms_message(to=recipient, body=body)
    if channel == "email":
        return send_email(to=recipient, subject=subject or "Aviso de cobranza", body=body)
    logger.info("Channel %s not yet connected to a provider — message logged only", channel)
    return None


def _get_recipient_address(debtor: Debtor, channel: str) -> str | None:
    """Return the appropriate contact address for the given channel."""
    if channel in ("whatsapp", "sms", "call", "ai_voice"):
        return debtor.phone
    if channel == "email":
        return debtor.email
    return None
