"""Twilio webhook endpoints for incoming WhatsApp/SMS messages."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Form, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ai_agent import AIConversation, AgentStatus, ConversationStatus, MessageRole
from app.models.campaign import ChannelType
from app.models.debtor import Debtor
from app.models.communication import CommunicationLog, CommunicationDirection, CommunicationStatus
from app.api.v1.endpoints.ai_agent import _generate_and_save_agent_response
from app.services.twilio_service import send_whatsapp_message
from app.schemas.ai_agent import AIConversationMessageCreate
from app.schemas.communication import CommunicationLogCreate
from app.crud import ai_agent as ai_crud
from app.crud import communication as comm_crud
from fastapi import Depends

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/whatsapp", include_in_schema=True)
async def whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Twilio calls this endpoint when a WhatsApp user sends a message.
    Saves the incoming message and triggers AI auto-response.
    """
    # Twilio sends the number as "whatsapp:+549..."
    phone = From.replace("whatsapp:", "").strip()
    message_body = Body.strip()

    logger.info("Incoming WhatsApp from %s: %s", phone, message_body[:80])

    # Find the most recent active conversation for this phone number.
    # We join Debtor to avoid the multi-org collision: if two debtors share
    # the same phone across different orgs, we pick the one with the newest
    # active conversation — that's the one the real person is replying to.
    conversation = db.execute(
        select(AIConversation)
        .join(Debtor, Debtor.id == AIConversation.debtor_id)
        .where(
            Debtor.phone == phone,
            AIConversation.status == ConversationStatus.ACTIVE,
        )
        .order_by(AIConversation.created_at.desc())
        .limit(1)
    ).scalars().first()

    if not conversation:
        logger.warning("No active conversation found for phone %s", phone)
        return _twiml_response("")

    debtor = db.get(Debtor, conversation.debtor_id)

    # Save client message
    client_msg = ai_crud.create_message(
        db,
        AIConversationMessageCreate(role=MessageRole.CLIENT, content=message_body),
        conversation.id,
    )
    logger.info("Saved client message %s", client_msg.id)

    # Log inbound message to communication_logs for the activity feed
    try:
        comm_crud.create_communication_log(
            db=db,
            log_data=CommunicationLogCreate(
                debtor_id=conversation.debtor_id,
                channel=ChannelType.WHATSAPP,
                direction=CommunicationDirection.INBOUND,
                status=CommunicationStatus.DELIVERED,
                body=message_body,
                recipient_address=phone,
            ),
            organization_id=conversation.organization_id,
        )
    except Exception:
        logger.exception("Failed to create inbound communication log for conversation %s", conversation.id)

    # Mark the most recent outbound log for this debtor as responded
    try:
        last_outbound = db.execute(
            select(CommunicationLog)
            .where(
                CommunicationLog.organization_id == conversation.organization_id,
                CommunicationLog.debtor_id == conversation.debtor_id,
                CommunicationLog.direction == CommunicationDirection.OUTBOUND,
                CommunicationLog.responded_at.is_(None),
            )
            .order_by(CommunicationLog.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        if last_outbound:
            last_outbound.responded_at = datetime.now(timezone.utc)
            db.commit()
    except Exception:
        logger.exception("Failed to mark responded_at for conversation %s", conversation.id)

    # Auto-respond if agent config allows
    agent_config = ai_crud.get_agent_config_simple(db, conversation.organization_id)
    if agent_config and agent_config.auto_respond and agent_config.status == AgentStatus.ACTIVE:
        try:
            agent_msg = _generate_and_save_agent_response(
                db=db,
                conversation=conversation,
                org_id=str(conversation.organization_id),
            )
            send_whatsapp_message(to=phone, body=agent_msg.content)
            logger.info("Sent AI reply to %s", phone)

            # Log outbound AI reply
            try:
                comm_crud.create_communication_log(
                    db=db,
                    log_data=CommunicationLogCreate(
                        debtor_id=conversation.debtor_id,
                        channel=ChannelType.WHATSAPP,
                        direction=CommunicationDirection.OUTBOUND,
                        status=CommunicationStatus.SENT,
                        body=agent_msg.content,
                        recipient_address=phone,
                    ),
                    organization_id=conversation.organization_id,
                )
            except Exception:
                logger.exception("Failed to create outbound communication log for conversation %s", conversation.id)
        except Exception:
            logger.exception("Failed to generate/send AI reply for conversation %s", conversation.id)

    # Return empty TwiML — we already sent the reply via API, no need for Twilio to send it
    return _twiml_response("")


def _twiml_response(message: str) -> Response:
    body = f"<Response><Message>{message}</Message></Response>" if message else "<Response/>"
    return Response(content=body, media_type="text/xml")
