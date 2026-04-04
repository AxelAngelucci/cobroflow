"""Message sending worker – receives tasks from the 'message-sending' queue.

Endpoint: POST /workers/messages/send

Parses the incoming Cloud Tasks payload and delegates all business logic
(context loading, AI generation, logging, dispatch) to
``services.message_dispatch_service.dispatch_message``.
"""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.message_dispatch_service import dispatch_message

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
        result = dispatch_message(
            db=db,
            organization_id=UUID(payload.organization_id),
            campaign_id=UUID(payload.campaign_id),
            stage_id=UUID(payload.stage_id),
            action_id=UUID(payload.action_id),
            debtor_id=UUID(payload.debtor_id),
            channel=payload.channel,
            ai_enabled=payload.ai_enabled,
            tone_instructions=payload.tone_instructions,
        )
        return MessageTaskResult(**result)
    except Exception as e:
        logger.exception("Failed to send message: %s", e)
        return MessageTaskResult(status="error", error=str(e))
