from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.crud import ai_agent as ai_crud
from app.db.session import get_db
from app.schemas.ai_agent import (
    AIAgentConfigBase, AIAgentConfigResponse, AIAgentConfigUpdate,
    AIAgentPersonalityResponse, AIAgentPersonalityCreate, AIAgentPersonalityUpdate,
    AIConversationResponse, AIConversationCreate, AIConversationUpdate,
    AIConversationListResponse,
    AIConversationMessageResponse, AIConversationMessageCreate,
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
    response_model=AIConversationMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    conversation_id: UUID,
    data: AIConversationMessageCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AIConversationMessageResponse:
    org_id = _require_org(current_user)
    conversation = ai_crud.get_conversation_by_id(db, conversation_id, org_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ai_crud.create_message(db, data, conversation_id)


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
    kpis = ai_crud.get_analytics_dashboard(db, org_id, date_from=date_from, date_to=date_to)
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
