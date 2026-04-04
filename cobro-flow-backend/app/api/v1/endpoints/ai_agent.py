import logging
from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.crud import ai_agent as ai_crud
from app.crud import communication as comm_crud
from app.db.session import get_db
from app.models.ai_agent import AgentStatus, MessageRole, MessageSentiment
from app.models.communication import CommunicationDirection, CommunicationStatus
from app.models.debtor import Debtor
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.communication import CommunicationLogCreate
from app.schemas.ai_agent import (
    AIAgentConfigBase, AIAgentConfigResponse, AIAgentConfigUpdate,
    AIAgentPersonalityResponse, AIAgentPersonalityCreate, AIAgentPersonalityUpdate,
    AIConversationResponse, AIConversationCreate, AIConversationUpdate,
    AIConversationListResponse,
    AIConversationMessageResponse, AIConversationMessageCreate, AIConversationReply,
    AITrainingDocumentResponse, AITrainingDocumentCreate, AITrainingDocumentUpdate,
    AITrainingDocumentListResponse,
    AIBusinessRuleResponse, AIBusinessRuleCreate, AIBusinessRuleUpdate,
    AIBusinessRuleListResponse, AIBusinessRuleReorderRequest,
    AIConversationExampleResponse, AIConversationExampleCreate, AIConversationExampleUpdate,
    AIConversationExampleListResponse,
    AITrainingSessionResponse, AITrainingSessionCreate, AITrainingSessionUpdate,
    AITrainingSessionListResponse,
    AIAgentAnalyticsListResponse, AIAgentDashboardKpis,
    AIAgentEscalationRuleResponse, AIAgentEscalationRuleCreate, AIAgentEscalationRuleUpdate,
    AIAgentChannelConfigResponse, AIAgentChannelConfigCreate, AIAgentChannelConfigUpdate,
    AIAgentOperatingHoursResponse, AIAgentOperatingHoursCreate,
)
from app.core.config import settings
from app.models.campaign import ChannelType
from app.services.analytics_service import get_analytics_dashboard as analytics_get_dashboard
from app.services.twilio_service import send_whatsapp_message
from app.services.vertex_ai import VertexAIGenerator

logger = logging.getLogger(__name__)

router = APIRouter()


def _require_org(current_user) -> UUID:
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    return current_user.organization_id


def _require_agent_config(db: Session, organization_id: UUID):
    config = ai_crud.get_agent_config_simple(db, organization_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not configured for this organization",
        )
    return config


# ============== CONFIG ==============

@router.get("/config", response_model=AIAgentConfigResponse)
def get_config(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentConfigResponse:
    org_id = _require_org(current_user)
    config = ai_crud.get_agent_config(db, org_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not configured",
        )
    return config


@router.post("/config", response_model=AIAgentConfigResponse, status_code=status.HTTP_201_CREATED)
def create_config(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    data: AIAgentConfigBase | None = None,
) -> AIAgentConfigResponse:
    org_id = _require_org(current_user)
    existing = ai_crud.get_agent_config_simple(db, org_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="AI Agent already configured for this organization",
        )
    if data is None:
        data = AIAgentConfigBase()
    return ai_crud.create_agent_config(db, org_id, data)


@router.patch("/config/{config_id}", response_model=AIAgentConfigResponse)
def update_config(
    config_id: UUID,
    data: AIAgentConfigUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentConfigResponse:
    org_id = _require_org(current_user)
    config = ai_crud.get_agent_config_simple(db, org_id)
    if not config or config.id != config_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config not found",
        )
    return ai_crud.update_agent_config(db, config, data)


# ============== PERSONALITY ==============

@router.get("/personality", response_model=AIAgentPersonalityResponse)
def get_personality(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentPersonalityResponse:
    org_id = _require_org(current_user)
    personality = ai_crud.get_personality(db, org_id)
    if not personality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personality not configured",
        )
    return personality


@router.post(
    "/personality",
    response_model=AIAgentPersonalityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_personality(
    data: AIAgentPersonalityCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentPersonalityResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)

    existing = ai_crud.get_personality(db, org_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Personality already exists, use PATCH to update",
        )
    return ai_crud.create_personality(db, data, config.id)


@router.patch("/personality/{personality_id}", response_model=AIAgentPersonalityResponse)
def update_personality(
    personality_id: UUID,
    data: AIAgentPersonalityUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentPersonalityResponse:
    org_id = _require_org(current_user)
    personality = ai_crud.get_personality(db, org_id)
    if not personality or personality.id != personality_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personality not found",
        )
    return ai_crud.update_personality(db, personality, data)


# ============== CONVERSATIONS ==============

@router.get("/conversations", response_model=AIConversationListResponse)
def get_conversations(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    channel: str | None = Query(None),
) -> AIConversationListResponse:
    org_id = _require_org(current_user)
    skip = (page - 1) * size
    items, total = ai_crud.get_conversations(
        db, org_id, skip=skip, limit=size,
        status=status_filter, channel=channel,
    )
    return AIConversationListResponse(items=items, total=total, page=page, size=size)


@router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
def get_conversation(
    conversation_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIConversationResponse:
    org_id = _require_org(current_user)
    conversation = ai_crud.get_conversation_by_id(db, conversation_id, org_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conversation


@router.post(
    "/conversations",
    response_model=AIConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    data: AIConversationCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIConversationResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    agent_config_id = data.agent_config_id or config.id
    return ai_crud.create_conversation(db, data, org_id, agent_config_id)


@router.patch("/conversations/{conversation_id}", response_model=AIConversationResponse)
def update_conversation(
    conversation_id: UUID,
    data: AIConversationUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIConversationResponse:
    org_id = _require_org(current_user)
    conversation = ai_crud.get_conversation_by_id(db, conversation_id, org_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ai_crud.update_conversation(db, conversation, data)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _require_org(current_user)
    conversation = ai_crud.get_conversation_by_id(db, conversation_id, org_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    ai_crud.delete_conversation(db, conversation)


# ============== MESSAGES ==============

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[AIConversationMessageResponse],
)
def get_messages(
    conversation_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> list[AIConversationMessageResponse]:
    org_id = _require_org(current_user)
    conversation = ai_crud.get_conversation_by_id(db, conversation_id, org_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ai_crud.get_messages(db, conversation_id, skip=skip, limit=limit)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=AIConversationReply,
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    conversation_id: UUID,
    data: AIConversationMessageCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIConversationReply:
    org_id = _require_org(current_user)
    conversation = ai_crud.get_conversation_by_id(db, conversation_id, org_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # 1. Save the incoming message
    user_msg = ai_crud.create_message(db, data, conversation_id)

    # 2. Auto-respond only for client messages when agent is active
    agent_response = None
    if data.role == MessageRole.CLIENT:
        agent_config = ai_crud.get_agent_config_simple(db, org_id)
        if agent_config and agent_config.auto_respond and agent_config.status == AgentStatus.ACTIVE:
            try:
                agent_response = _generate_and_save_agent_response(
                    db=db,
                    conversation=conversation,
                    org_id=str(org_id),
                )
            except Exception:
                logger.exception(
                    "AI generation failed for conversation %s — returning user message only",
                    conversation_id,
                )

    # 3. Send via WhatsApp if channel matches
    #    - agent message sent by operator → send directly
    #    - client message with auto-respond → send AI reply
    msg_to_send = user_msg if data.role == MessageRole.AGENT else agent_response
    if msg_to_send and conversation.channel == ChannelType.WHATSAPP:
        debtor = db.execute(
            select(Debtor).where(Debtor.id == conversation.debtor_id)
        ).scalar_one_or_none()
        if debtor and debtor.phone:
            send_whatsapp_message(to=debtor.phone, body=msg_to_send.content)

    # 4. Create communication logs so the activity feed reflects this exchange
    try:
        # Log the client/agent message that arrived
        inbound = data.role == MessageRole.CLIENT
        comm_crud.create_communication_log(
            db=db,
            log_data=CommunicationLogCreate(
                debtor_id=conversation.debtor_id,
                channel=conversation.channel,
                direction=CommunicationDirection.INBOUND if inbound else CommunicationDirection.OUTBOUND,
                status=CommunicationStatus.DELIVERED if inbound else CommunicationStatus.SENT,
                body=data.content,
                recipient_address=None,
            ),
            organization_id=org_id,
        )
        # Log the AI agent response if one was generated
        if agent_response:
            comm_crud.create_communication_log(
                db=db,
                log_data=CommunicationLogCreate(
                    debtor_id=conversation.debtor_id,
                    channel=conversation.channel,
                    direction=CommunicationDirection.OUTBOUND,
                    status=CommunicationStatus.SENT,
                    body=agent_response.content,
                    recipient_address=None,
                ),
                organization_id=org_id,
            )
    except Exception:
        logger.exception("Failed to create communication log for conversation %s", conversation_id)

    return AIConversationReply(
        user_message=AIConversationMessageResponse.model_validate(user_msg),
        agent_response=AIConversationMessageResponse.model_validate(agent_response) if agent_response else None,
    )


def _mock_ai_response(debtor_context: dict, history: list[dict]) -> dict:
    """Return a hardcoded but contextual response — no AI API calls."""
    name = debtor_context.get("name", "Cliente")
    debt = debtor_context.get("total_debt", 0)
    days = debtor_context.get("days_overdue", 0)
    currency = debtor_context.get("currency", "ARS")

    last_user_msg = ""
    for msg in reversed(history):
        if msg.get("role") == "client":
            last_user_msg = msg.get("content", "").lower()
            break

    if any(w in last_user_msg for w in ["pagar", "pago", "abonar", "cuota"]):
        content = (
            f"Hola {name}, con gusto te ayudo con tu pago. "
            f"Tu saldo pendiente es de {currency} {debt:,.2f}. "
            "¿Preferís realizar el pago total o acordar un plan de cuotas?"
        )
    elif any(w in last_user_msg for w in ["plazo", "tiempo", "prórroga", "espera"]):
        content = (
            f"Entiendo tu situación, {name}. Podemos evaluar una extensión de plazo. "
            "¿Podés contarme brevemente cuál es tu situación actual?"
        )
    elif any(w in last_user_msg for w in ["no puedo", "no tengo", "difícil", "problema"]):
        content = (
            f"Gracias por comunicarte, {name}. Estamos aquí para ayudarte a encontrar una solución. "
            "Contanos tu situación y buscamos la mejor alternativa para vos."
        )
    else:
        content = (
            f"Hola {name}, te contactamos por tu deuda de {currency} {debt:,.2f} "
            f"con {days} días de vencimiento. ¿En qué podemos ayudarte hoy?"
        )

    return {"content": content, "sentiment": "neutral", "tokens_used": 0}


def _generate_and_save_agent_response(
    db: Session,
    conversation,
    org_id: str,
):
    """Call Vertex AI and persist the agent reply message. Returns the saved message."""
    # Build conversation history from existing messages
    history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in conversation.messages
    ]

    # Fetch debtor context (basic info + outstanding debt)
    debtor = db.execute(
        select(Debtor).where(Debtor.id == conversation.debtor_id)
    ).scalar_one_or_none()

    debtor_context: dict = {"name": "Cliente", "total_debt": 0, "days_overdue": 0, "currency": "ARS"}
    if debtor:
        debtor_context["name"] = debtor.name
        debtor_context["risk_score"] = debtor.risk_score or 50
        debtor_context["tags"] = debtor.tags or []

        # Aggregate outstanding invoices
        row = db.execute(
            select(
                func.coalesce(func.sum(Invoice.balance), 0).label("total_balance"),
                func.coalesce(
                    func.max(func.extract("day", func.now() - Invoice.due_date)), 0
                ).label("max_days_overdue"),
                Invoice.currency,
            )
            .where(
                Invoice.debtor_id == debtor.id,
                Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]),
            )
            .group_by(Invoice.currency)
            .limit(1)
        ).first()

        if row:
            debtor_context["total_debt"] = float(row.total_balance)
            debtor_context["days_overdue"] = int(row.max_days_overdue)
            debtor_context["currency"] = row.currency or "ARS"

    # Fetch agent personality
    personality_obj = ai_crud.get_personality(db, UUID(org_id))
    agent_personality = None
    if personality_obj:
        agent_personality = {
            "tone": personality_obj.tone.value,
            "formality_level": personality_obj.formality_level,
            "empathy_level": personality_obj.empathy_level,
            "language": personality_obj.language,
            "system_prompt": personality_obj.system_prompt,
            "custom_instructions": personality_obj.custom_instructions,
            "forbidden_topics": personality_obj.forbidden_topics,
        }

    # Call AI — real or mock
    if settings.AI_MOCK_MODE:
        result = _mock_ai_response(debtor_context, history)
    else:
        generator = VertexAIGenerator(db=db)
        result = generator.generate_conversation_response(
            organization_id=org_id,
            conversation_history=history,
            debtor_context=debtor_context,
            agent_personality=agent_personality,
            channel=conversation.channel.value,
        )

    # Map heuristic sentiment to enum
    sentiment_map = {
        "positive": MessageSentiment.POSITIVE,
        "neutral": MessageSentiment.NEUTRAL,
        "negative": MessageSentiment.NEGATIVE,
    }

    # Persist the agent message
    from app.schemas.ai_agent import AIConversationMessageCreate as MsgCreate
    agent_msg_data = MsgCreate(
        role=MessageRole.AGENT,
        content=result["content"],
        sentiment=sentiment_map.get(result.get("sentiment", "neutral"), MessageSentiment.NEUTRAL),
        tokens_used=result.get("tokens_used"),
    )
    return ai_crud.create_message(db, agent_msg_data, conversation.id)


# ============== TRAINING DOCUMENTS ==============

@router.get("/training/documents", response_model=AITrainingDocumentListResponse)
def get_training_documents(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
) -> AITrainingDocumentListResponse:
    org_id = _require_org(current_user)
    skip = (page - 1) * size
    items, total = ai_crud.get_training_documents(
        db, org_id, skip=skip, limit=size, status=status_filter,
    )
    return AITrainingDocumentListResponse(items=items, total=total, page=page, size=size)


@router.post(
    "/training/documents",
    response_model=AITrainingDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_training_document(
    data: AITrainingDocumentCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AITrainingDocumentResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_training_document(
        db, data, org_id, config.id, user_id=current_user.id,
    )


@router.patch("/training/documents/{document_id}", response_model=AITrainingDocumentResponse)
def update_training_document(
    document_id: UUID,
    data: AITrainingDocumentUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AITrainingDocumentResponse:
    org_id = _require_org(current_user)
    doc = ai_crud.get_training_document_by_id(db, document_id, org_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return ai_crud.update_training_document(db, doc, data)


@router.delete("/training/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _require_org(current_user)
    doc = ai_crud.get_training_document_by_id(db, document_id, org_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    ai_crud.delete_training_document(db, doc)


# ============== BUSINESS RULES ==============

@router.get("/training/rules", response_model=AIBusinessRuleListResponse)
def get_business_rules(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    is_active: bool | None = Query(None),
) -> AIBusinessRuleListResponse:
    org_id = _require_org(current_user)
    skip = (page - 1) * size
    items, total = ai_crud.get_business_rules(
        db, org_id, skip=skip, limit=size, is_active=is_active,
    )
    return AIBusinessRuleListResponse(items=items, total=total, page=page, size=size)


@router.post(
    "/training/rules",
    response_model=AIBusinessRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_business_rule(
    data: AIBusinessRuleCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIBusinessRuleResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_business_rule(db, data, org_id, config.id)


@router.patch("/training/rules/{rule_id}", response_model=AIBusinessRuleResponse)
def update_business_rule(
    rule_id: UUID,
    data: AIBusinessRuleUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIBusinessRuleResponse:
    org_id = _require_org(current_user)
    rule = ai_crud.get_business_rule_by_id(db, rule_id, org_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found",
        )
    return ai_crud.update_business_rule(db, rule, data)


@router.delete("/training/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_rule(
    rule_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _require_org(current_user)
    rule = ai_crud.get_business_rule_by_id(db, rule_id, org_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found",
        )
    ai_crud.delete_business_rule(db, rule)


@router.post("/training/rules/reorder", response_model=list[AIBusinessRuleResponse])
def reorder_business_rules(
    data: AIBusinessRuleReorderRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[AIBusinessRuleResponse]:
    org_id = _require_org(current_user)
    return ai_crud.reorder_business_rules(db, data, org_id)


# ============== CONVERSATION EXAMPLES ==============

@router.get("/training/examples", response_model=AIConversationExampleListResponse)
def get_conversation_examples(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
) -> AIConversationExampleListResponse:
    org_id = _require_org(current_user)
    skip = (page - 1) * size
    items, total = ai_crud.get_conversation_examples(
        db, org_id, skip=skip, limit=size, category=category,
    )
    return AIConversationExampleListResponse(items=items, total=total, page=page, size=size)


@router.post(
    "/training/examples",
    response_model=AIConversationExampleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation_example(
    data: AIConversationExampleCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIConversationExampleResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_conversation_example(db, data, org_id, config.id)


@router.patch("/training/examples/{example_id}", response_model=AIConversationExampleResponse)
def update_conversation_example(
    example_id: UUID,
    data: AIConversationExampleUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIConversationExampleResponse:
    org_id = _require_org(current_user)
    example = ai_crud.get_conversation_example_by_id(db, example_id, org_id)
    if not example:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Example not found",
        )
    return ai_crud.update_conversation_example(db, example, data)


@router.delete("/training/examples/{example_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation_example(
    example_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _require_org(current_user)
    example = ai_crud.get_conversation_example_by_id(db, example_id, org_id)
    if not example:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Example not found",
        )
    ai_crud.delete_conversation_example(db, example)


# ============== TRAINING SESSIONS ==============

@router.get("/training/sessions", response_model=AITrainingSessionListResponse)
def get_training_sessions(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> AITrainingSessionListResponse:
    org_id = _require_org(current_user)
    skip = (page - 1) * size
    items, total = ai_crud.get_training_sessions(db, org_id, skip=skip, limit=size)
    return AITrainingSessionListResponse(items=items, total=total, page=page, size=size)


@router.post(
    "/training/sessions",
    response_model=AITrainingSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_training_session(
    data: AITrainingSessionCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AITrainingSessionResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_training_session(db, data, org_id, config.id)


@router.patch("/training/sessions/{session_id}", response_model=AITrainingSessionResponse)
def update_training_session(
    session_id: UUID,
    data: AITrainingSessionUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AITrainingSessionResponse:
    org_id = _require_org(current_user)
    session_obj = ai_crud.get_training_session_by_id(db, session_id, org_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found",
        )
    return ai_crud.update_training_session(db, session_obj, data)


# ============== ANALYTICS ==============

@router.get("/analytics", response_model=AIAgentAnalyticsListResponse)
def get_analytics(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(30, ge=1, le=365),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    channel: str | None = Query(None),
) -> AIAgentAnalyticsListResponse:
    org_id = _require_org(current_user)
    skip = (page - 1) * size
    items, total = ai_crud.get_analytics(
        db, org_id, skip=skip, limit=size,
        date_from=date_from, date_to=date_to, channel=channel,
    )
    return AIAgentAnalyticsListResponse(items=items, total=total, page=page, size=size)


@router.get("/analytics/dashboard", response_model=AIAgentDashboardKpis)
def get_analytics_dashboard(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
) -> AIAgentDashboardKpis:
    org_id = _require_org(current_user)
    kpis = analytics_get_dashboard(db, org_id, date_from=date_from, date_to=date_to)
    return AIAgentDashboardKpis(**kpis)


# ============== ESCALATION RULES ==============

@router.get("/config/escalation-rules", response_model=list[AIAgentEscalationRuleResponse])
def get_escalation_rules(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[AIAgentEscalationRuleResponse]:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.get_escalation_rules(db, config.id)


@router.post(
    "/config/escalation-rules",
    response_model=AIAgentEscalationRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_escalation_rule(
    data: AIAgentEscalationRuleCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentEscalationRuleResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_escalation_rule(db, data, config.id)


@router.patch(
    "/config/escalation-rules/{rule_id}",
    response_model=AIAgentEscalationRuleResponse,
)
def update_escalation_rule(
    rule_id: UUID,
    data: AIAgentEscalationRuleUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentEscalationRuleResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    rule = ai_crud.get_escalation_rule_by_id(db, rule_id, config.id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation rule not found",
        )
    return ai_crud.update_escalation_rule(db, rule, data)


@router.delete(
    "/config/escalation-rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_escalation_rule(
    rule_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    rule = ai_crud.get_escalation_rule_by_id(db, rule_id, config.id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation rule not found",
        )
    ai_crud.delete_escalation_rule(db, rule)


# ============== CHANNEL CONFIG ==============

@router.get("/config/channels", response_model=list[AIAgentChannelConfigResponse])
def get_channel_configs(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[AIAgentChannelConfigResponse]:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.get_channel_configs(db, config.id)


@router.post(
    "/config/channels",
    response_model=AIAgentChannelConfigResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_channel_config(
    data: AIAgentChannelConfigCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentChannelConfigResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_channel_config(db, data, config.id)


@router.patch(
    "/config/channels/{channel_config_id}",
    response_model=AIAgentChannelConfigResponse,
)
def update_channel_config(
    channel_config_id: UUID,
    data: AIAgentChannelConfigUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentChannelConfigResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    channel_config = ai_crud.get_channel_config_by_id(db, channel_config_id, config.id)
    if not channel_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel config not found",
        )
    return ai_crud.update_channel_config(db, channel_config, data)


@router.delete(
    "/config/channels/{channel_config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_channel_config(
    channel_config_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    channel_config = ai_crud.get_channel_config_by_id(db, channel_config_id, config.id)
    if not channel_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel config not found",
        )
    ai_crud.delete_channel_config(db, channel_config)


# ============== OPERATING HOURS ==============

@router.get("/config/operating-hours", response_model=list[AIAgentOperatingHoursResponse])
def get_operating_hours(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[AIAgentOperatingHoursResponse]:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.get_operating_hours(db, config.id)


@router.post(
    "/config/operating-hours",
    response_model=AIAgentOperatingHoursResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_operating_hours(
    data: AIAgentOperatingHoursCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIAgentOperatingHoursResponse:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_operating_hours(db, data, config.id)


@router.delete(
    "/config/operating-hours/{hours_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_operating_hours(
    hours_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    hours = ai_crud.get_operating_hours_by_id(db, hours_id, config.id)
    if not hours:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operating hours not found",
        )
    ai_crud.delete_operating_hours(db, hours)
