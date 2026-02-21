from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, joinedload

from app.models.ai_agent import (
    AIAgentConfig, AIAgentPersonality, AIConversation, AIConversationMessage,
    AITrainingDocument, AIBusinessRule, AIConversationExample,
    AITrainingSession, AIAgentAnalytics, AIAgentEscalationRule,
    AIAgentChannelConfig, AIAgentOperatingHours,
    ConversationStatus, TrainingSessionStatus,
)
from app.schemas.ai_agent import (
    AIAgentConfigBase, AIAgentConfigUpdate,
    AIAgentPersonalityCreate, AIAgentPersonalityUpdate,
    AIConversationCreate, AIConversationUpdate,
    AIConversationMessageCreate,
    AITrainingDocumentCreate, AITrainingDocumentUpdate,
    AIBusinessRuleCreate, AIBusinessRuleUpdate, AIBusinessRuleReorderRequest,
    AIConversationExampleCreate, AIConversationExampleUpdate,
    AITrainingSessionCreate, AITrainingSessionUpdate,
    AIAgentEscalationRuleCreate, AIAgentEscalationRuleUpdate,
    AIAgentChannelConfigCreate, AIAgentChannelConfigUpdate,
    AIAgentOperatingHoursCreate,
)


# ============== Agent Config ==============

def get_agent_config(db: Session, organization_id: UUID) -> AIAgentConfig | None:
    stmt = (
        select(AIAgentConfig)
        .options(
            joinedload(AIAgentConfig.personality),
            joinedload(AIAgentConfig.channel_configs),
            joinedload(AIAgentConfig.operating_hours),
            joinedload(AIAgentConfig.escalation_rules),
        )
        .where(AIAgentConfig.organization_id == organization_id)
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def get_agent_config_simple(db: Session, organization_id: UUID) -> AIAgentConfig | None:
    stmt = select(AIAgentConfig).where(
        AIAgentConfig.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_agent_config(
    db: Session,
    organization_id: UUID,
    data: AIAgentConfigBase,
) -> AIAgentConfig:
    config = AIAgentConfig(
        organization_id=organization_id,
        **data.model_dump(),
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def update_agent_config(
    db: Session,
    config: AIAgentConfig,
    data: AIAgentConfigUpdate,
) -> AIAgentConfig:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


# ============== Personality ==============

def get_personality(db: Session, organization_id: UUID) -> AIAgentPersonality | None:
    stmt = (
        select(AIAgentPersonality)
        .join(AIAgentConfig)
        .where(AIAgentConfig.organization_id == organization_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def create_personality(
    db: Session,
    data: AIAgentPersonalityCreate,
    agent_config_id: UUID,
) -> AIAgentPersonality:
    personality = AIAgentPersonality(
        agent_config_id=agent_config_id,
        **data.model_dump(),
    )
    db.add(personality)
    db.commit()
    db.refresh(personality)
    return personality


def update_personality(
    db: Session,
    personality: AIAgentPersonality,
    data: AIAgentPersonalityUpdate,
) -> AIAgentPersonality:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(personality, field, value)
    db.commit()
    db.refresh(personality)
    return personality


# ============== Conversations ==============

def get_conversations(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
    channel: str | None = None,
    search: str | None = None,
) -> tuple[list[AIConversation], int]:
    stmt = select(AIConversation).where(
        AIConversation.organization_id == organization_id,
    )

    if status:
        stmt = stmt.where(AIConversation.status == status)
    if channel:
        stmt = stmt.where(AIConversation.channel == channel)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(AIConversation.created_at.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def get_conversation_by_id(
    db: Session,
    conversation_id: UUID,
    organization_id: UUID,
) -> AIConversation | None:
    stmt = (
        select(AIConversation)
        .options(joinedload(AIConversation.messages))
        .where(
            AIConversation.id == conversation_id,
            AIConversation.organization_id == organization_id,
        )
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def create_conversation(
    db: Session,
    data: AIConversationCreate,
    organization_id: UUID,
    agent_config_id: UUID,
) -> AIConversation:
    conversation = AIConversation(
        organization_id=organization_id,
        agent_config_id=agent_config_id,
        debtor_id=data.debtor_id,
        channel=data.channel,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def update_conversation(
    db: Session,
    conversation: AIConversation,
    data: AIConversationUpdate,
) -> AIConversation:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(conversation, field, value)
    if data.status and data.status == ConversationStatus.RESOLVED:
        conversation.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)
    return conversation


def delete_conversation(db: Session, conversation: AIConversation) -> None:
    db.delete(conversation)
    db.commit()


# ============== Messages ==============

def get_messages(
    db: Session,
    conversation_id: UUID,
    skip: int = 0,
    limit: int = 50,
) -> list[AIConversationMessage]:
    stmt = (
        select(AIConversationMessage)
        .where(AIConversationMessage.conversation_id == conversation_id)
        .order_by(AIConversationMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def create_message(
    db: Session,
    data: AIConversationMessageCreate,
    conversation_id: UUID,
) -> AIConversationMessage:
    msg_data = data.model_dump(by_alias=False, exclude_unset=True)
    message = AIConversationMessage(
        conversation_id=conversation_id,
        **msg_data,
    )
    db.add(message)

    # Update conversation message count
    stmt = select(AIConversation).where(AIConversation.id == conversation_id)
    conversation = db.execute(stmt).scalar_one_or_none()
    if conversation:
        conversation.total_messages = (conversation.total_messages or 0) + 1

    db.commit()
    db.refresh(message)
    return message


# ============== Training Documents ==============

def get_training_documents(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
) -> tuple[list[AITrainingDocument], int]:
    stmt = select(AITrainingDocument).where(
        AITrainingDocument.organization_id == organization_id,
    )
    if status:
        stmt = stmt.where(AITrainingDocument.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(AITrainingDocument.created_at.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def get_training_document_by_id(
    db: Session,
    document_id: UUID,
    organization_id: UUID,
) -> AITrainingDocument | None:
    stmt = select(AITrainingDocument).where(
        AITrainingDocument.id == document_id,
        AITrainingDocument.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_training_document(
    db: Session,
    data: AITrainingDocumentCreate,
    organization_id: UUID,
    agent_config_id: UUID,
    user_id: UUID | None = None,
) -> AITrainingDocument:
    doc = AITrainingDocument(
        organization_id=organization_id,
        agent_config_id=agent_config_id,
        uploaded_by_user_id=user_id,
        **data.model_dump(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def update_training_document(
    db: Session,
    document: AITrainingDocument,
    data: AITrainingDocumentUpdate,
) -> AITrainingDocument:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)
    db.commit()
    db.refresh(document)
    return document


def delete_training_document(db: Session, document: AITrainingDocument) -> None:
    db.delete(document)
    db.commit()


# ============== Business Rules ==============

def get_business_rules(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 50,
    is_active: bool | None = None,
) -> tuple[list[AIBusinessRule], int]:
    stmt = select(AIBusinessRule).where(
        AIBusinessRule.organization_id == organization_id,
    )
    if is_active is not None:
        stmt = stmt.where(AIBusinessRule.is_active == is_active)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(AIBusinessRule.sort_order.asc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def get_business_rule_by_id(
    db: Session,
    rule_id: UUID,
    organization_id: UUID,
) -> AIBusinessRule | None:
    stmt = select(AIBusinessRule).where(
        AIBusinessRule.id == rule_id,
        AIBusinessRule.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_business_rule(
    db: Session,
    data: AIBusinessRuleCreate,
    organization_id: UUID,
    agent_config_id: UUID,
) -> AIBusinessRule:
    rule = AIBusinessRule(
        organization_id=organization_id,
        agent_config_id=agent_config_id,
        **data.model_dump(),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def update_business_rule(
    db: Session,
    rule: AIBusinessRule,
    data: AIBusinessRuleUpdate,
) -> AIBusinessRule:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


def delete_business_rule(db: Session, rule: AIBusinessRule) -> None:
    db.delete(rule)
    db.commit()


def reorder_business_rules(
    db: Session,
    data: AIBusinessRuleReorderRequest,
    organization_id: UUID,
) -> list[AIBusinessRule]:
    for item in data.rules:
        stmt = select(AIBusinessRule).where(
            AIBusinessRule.id == item.id,
            AIBusinessRule.organization_id == organization_id,
        )
        rule = db.execute(stmt).scalar_one_or_none()
        if rule:
            rule.sort_order = item.sort_order
    db.commit()

    rules, _ = get_business_rules(db, organization_id, limit=100)
    return rules


# ============== Conversation Examples ==============

def get_conversation_examples(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    category: str | None = None,
) -> tuple[list[AIConversationExample], int]:
    stmt = select(AIConversationExample).where(
        AIConversationExample.organization_id == organization_id,
    )
    if category:
        stmt = stmt.where(AIConversationExample.category == category)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(AIConversationExample.created_at.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def get_conversation_example_by_id(
    db: Session,
    example_id: UUID,
    organization_id: UUID,
) -> AIConversationExample | None:
    stmt = select(AIConversationExample).where(
        AIConversationExample.id == example_id,
        AIConversationExample.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_conversation_example(
    db: Session,
    data: AIConversationExampleCreate,
    organization_id: UUID,
    agent_config_id: UUID,
) -> AIConversationExample:
    example = AIConversationExample(
        organization_id=organization_id,
        agent_config_id=agent_config_id,
        **data.model_dump(),
    )
    db.add(example)
    db.commit()
    db.refresh(example)
    return example


def update_conversation_example(
    db: Session,
    example: AIConversationExample,
    data: AIConversationExampleUpdate,
) -> AIConversationExample:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(example, field, value)
    db.commit()
    db.refresh(example)
    return example


def delete_conversation_example(db: Session, example: AIConversationExample) -> None:
    db.delete(example)
    db.commit()


# ============== Training Sessions ==============

def get_training_sessions(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[AITrainingSession], int]:
    stmt = select(AITrainingSession).where(
        AITrainingSession.organization_id == organization_id,
    )
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(AITrainingSession.created_at.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def create_training_session(
    db: Session,
    data: AITrainingSessionCreate,
    organization_id: UUID,
    agent_config_id: UUID,
) -> AITrainingSession:
    session_obj = AITrainingSession(
        organization_id=organization_id,
        agent_config_id=agent_config_id,
        description=data.description,
        status=TrainingSessionStatus.RUNNING,
    )
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj


def update_training_session(
    db: Session,
    session_obj: AITrainingSession,
    data: AITrainingSessionUpdate,
) -> AITrainingSession:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session_obj, field, value)
    if data.status and data.status in (
        TrainingSessionStatus.COMPLETED, TrainingSessionStatus.FAILED
    ):
        session_obj.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session_obj)
    return session_obj


def get_training_session_by_id(
    db: Session,
    session_id: UUID,
    organization_id: UUID,
) -> AITrainingSession | None:
    stmt = select(AITrainingSession).where(
        AITrainingSession.id == session_id,
        AITrainingSession.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


# ============== Analytics ==============

def get_analytics(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 30,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    channel: str | None = None,
) -> tuple[list[AIAgentAnalytics], int]:
    stmt = select(AIAgentAnalytics).where(
        AIAgentAnalytics.organization_id == organization_id,
    )
    if date_from:
        stmt = stmt.where(AIAgentAnalytics.date >= date_from)
    if date_to:
        stmt = stmt.where(AIAgentAnalytics.date <= date_to)
    if channel:
        stmt = stmt.where(AIAgentAnalytics.channel == channel)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(AIAgentAnalytics.date.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def get_analytics_dashboard(
    db: Session,
    organization_id: UUID,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict:
    stmt = select(AIAgentAnalytics).where(
        AIAgentAnalytics.organization_id == organization_id,
    )
    if date_from:
        stmt = stmt.where(AIAgentAnalytics.date >= date_from)
    if date_to:
        stmt = stmt.where(AIAgentAnalytics.date <= date_to)

    rows = list(db.execute(stmt).scalars().all())

    total_conversations = sum(r.total_conversations for r in rows)
    resolved = sum(r.resolved_conversations for r in rows)
    escalated = sum(r.escalated_conversations for r in rows)
    total_messages = sum(r.total_messages_sent + r.total_messages_received for r in rows)
    positive = sum(r.positive_sentiment_count for r in rows)
    neutral = sum(r.neutral_sentiment_count for r in rows)
    negative = sum(r.negative_sentiment_count for r in rows)
    total_sentiment = positive + neutral + negative or 1
    total_tokens = sum(r.total_tokens_used for r in rows)
    total_cost = sum(float(r.total_cost) for r in rows)
    payments_count = sum(r.payments_collected_count for r in rows)
    payments_amount = sum(float(r.payments_collected_amount) for r in rows)

    response_times = [r.avg_response_time_ms for r in rows if r.avg_response_time_ms]
    resolution_times = [r.avg_resolution_time_ms for r in rows if r.avg_resolution_time_ms]
    satisfaction_scores = [r.satisfaction_score for r in rows if r.satisfaction_score]

    # Active conversations from the conversations table
    active_stmt = select(func.count()).where(
        AIConversation.organization_id == organization_id,
        AIConversation.status == ConversationStatus.ACTIVE,
    )
    active_conversations = db.execute(active_stmt).scalar() or 0

    return {
        "total_conversations": total_conversations,
        "active_conversations": active_conversations,
        "resolved_conversations": resolved,
        "escalated_conversations": escalated,
        "avg_response_time_ms": (
            int(sum(response_times) / len(response_times)) if response_times else None
        ),
        "avg_resolution_time_ms": (
            int(sum(resolution_times) / len(resolution_times)) if resolution_times else None
        ),
        "resolution_rate": round(resolved / total_conversations * 100, 1) if total_conversations else 0.0,
        "escalation_rate": round(escalated / total_conversations * 100, 1) if total_conversations else 0.0,
        "positive_sentiment_pct": round(positive / total_sentiment * 100, 1),
        "neutral_sentiment_pct": round(neutral / total_sentiment * 100, 1),
        "negative_sentiment_pct": round(negative / total_sentiment * 100, 1),
        "total_messages": total_messages,
        "total_tokens_used": total_tokens,
        "total_cost": round(total_cost, 4),
        "payments_collected_count": payments_count,
        "payments_collected_amount": round(payments_amount, 2),
        "satisfaction_score": (
            round(sum(satisfaction_scores) / len(satisfaction_scores), 2)
            if satisfaction_scores else None
        ),
    }


# ============== Escalation Rules ==============

def get_escalation_rules(
    db: Session,
    agent_config_id: UUID,
) -> list[AIAgentEscalationRule]:
    stmt = (
        select(AIAgentEscalationRule)
        .where(AIAgentEscalationRule.agent_config_id == agent_config_id)
        .order_by(AIAgentEscalationRule.priority.asc())
    )
    return list(db.execute(stmt).scalars().all())


def get_escalation_rule_by_id(
    db: Session,
    rule_id: UUID,
    agent_config_id: UUID,
) -> AIAgentEscalationRule | None:
    stmt = select(AIAgentEscalationRule).where(
        AIAgentEscalationRule.id == rule_id,
        AIAgentEscalationRule.agent_config_id == agent_config_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_escalation_rule(
    db: Session,
    data: AIAgentEscalationRuleCreate,
    agent_config_id: UUID,
) -> AIAgentEscalationRule:
    rule = AIAgentEscalationRule(
        agent_config_id=agent_config_id,
        **data.model_dump(),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def update_escalation_rule(
    db: Session,
    rule: AIAgentEscalationRule,
    data: AIAgentEscalationRuleUpdate,
) -> AIAgentEscalationRule:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


def delete_escalation_rule(db: Session, rule: AIAgentEscalationRule) -> None:
    db.delete(rule)
    db.commit()


# ============== Channel Config ==============

def get_channel_configs(
    db: Session,
    agent_config_id: UUID,
) -> list[AIAgentChannelConfig]:
    stmt = (
        select(AIAgentChannelConfig)
        .where(AIAgentChannelConfig.agent_config_id == agent_config_id)
        .order_by(AIAgentChannelConfig.created_at.asc())
    )
    return list(db.execute(stmt).scalars().all())


def get_channel_config_by_id(
    db: Session,
    config_id: UUID,
    agent_config_id: UUID,
) -> AIAgentChannelConfig | None:
    stmt = select(AIAgentChannelConfig).where(
        AIAgentChannelConfig.id == config_id,
        AIAgentChannelConfig.agent_config_id == agent_config_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_channel_config(
    db: Session,
    data: AIAgentChannelConfigCreate,
    agent_config_id: UUID,
) -> AIAgentChannelConfig:
    config = AIAgentChannelConfig(
        agent_config_id=agent_config_id,
        **data.model_dump(),
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def update_channel_config(
    db: Session,
    config: AIAgentChannelConfig,
    data: AIAgentChannelConfigUpdate,
) -> AIAgentChannelConfig:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


def delete_channel_config(db: Session, config: AIAgentChannelConfig) -> None:
    db.delete(config)
    db.commit()


# ============== Operating Hours ==============

def get_operating_hours(
    db: Session,
    agent_config_id: UUID,
) -> list[AIAgentOperatingHours]:
    stmt = (
        select(AIAgentOperatingHours)
        .where(AIAgentOperatingHours.agent_config_id == agent_config_id)
        .order_by(AIAgentOperatingHours.day_of_week.asc())
    )
    return list(db.execute(stmt).scalars().all())


def create_operating_hours(
    db: Session,
    data: AIAgentOperatingHoursCreate,
    agent_config_id: UUID,
) -> AIAgentOperatingHours:
    hours = AIAgentOperatingHours(
        agent_config_id=agent_config_id,
        **data.model_dump(),
    )
    db.add(hours)
    db.commit()
    db.refresh(hours)
    return hours


def delete_operating_hours(db: Session, hours: AIAgentOperatingHours) -> None:
    db.delete(hours)
    db.commit()


def get_operating_hours_by_id(
    db: Session,
    hours_id: UUID,
    agent_config_id: UUID,
) -> AIAgentOperatingHours | None:
    stmt = select(AIAgentOperatingHours).where(
        AIAgentOperatingHours.id == hours_id,
        AIAgentOperatingHours.agent_config_id == agent_config_id,
    )
    return db.execute(stmt).scalar_one_or_none()
