"""Analytics business logic service.

Encapsulates the dashboard KPI aggregation pipeline for the AI Agent module,
separating metric computation from the raw data access in the CRUD layer.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.ai_agent import AIAgentAnalytics, AIConversation, ConversationStatus


def get_analytics_dashboard(
    db: Session,
    organization_id: UUID,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict:
    """Aggregate AI agent analytics rows into a single KPI dashboard dict.

    Applies optional date range filters, then computes rates, averages, and
    totals across all matching ``AIAgentAnalytics`` records for the organization.
    """
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

    # Active conversations queried live from the conversations table
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
            if satisfaction_scores
            else None
        ),
    }
