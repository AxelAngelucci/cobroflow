"""Campaign evaluation worker – triggered by Cloud Scheduler / Cloud Tasks.

Endpoint: POST /api/v1/workers/campaigns/evaluate

Evaluates all active campaigns, finds matching debtors based on
strategy_config filters, determines the current stage, and enqueues
individual message-sending tasks into the 'message-sending' Cloud Tasks queue.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func, and_, cast, Integer
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.campaign import Campaign, CampaignStage, StageAction
from app.models.debtor import Debtor
from app.models.invoice import Invoice, InvoiceStatus
from app.models.communication import CommunicationLog

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class DebtorMatch(BaseModel):
    debtor_id: str
    debtor_name: str
    days_overdue: int
    total_debt: float
    stage_name: str | None
    actions_due: int


class CampaignEvaluation(BaseModel):
    campaign_id: str
    campaign_name: str
    matched_debtors: int
    tasks_enqueued: int
    debtors: list[DebtorMatch]
    skipped_already_contacted: int
    error: str | None = None


class EvaluationResult(BaseModel):
    campaigns_evaluated: int
    total_matched_debtors: int
    total_tasks_enqueued: int
    campaigns: list[CampaignEvaluation]
    errors: list[str]


# ---------------------------------------------------------------------------
# Helpers to normalize strategy_config keys (camelCase → snake_case)
# ---------------------------------------------------------------------------

def _normalize_audience(raw: dict) -> dict:
    """Accept both camelCase (from frontend) and snake_case keys."""
    return {
        "min_days_overdue": raw.get("min_days_overdue") or raw.get("minDaysOverdue") or 1,
        "max_days_overdue": raw.get("max_days_overdue") or raw.get("maxDaysOverdue") or 365,
        "min_debt_amount": raw.get("min_debt_amount") or raw.get("minAmount") or 0,
        "risk_score_min": raw.get("risk_score_min") or raw.get("riskScoreMin"),
        "risk_score_max": raw.get("risk_score_max") or raw.get("riskScoreMax"),
        "tags": raw.get("tags") or [],
    }


def _normalize_schedule(raw: dict) -> dict:
    return {
        "active_days": raw.get("active_days") or raw.get("activeDays") or [1, 2, 3, 4, 5],
        "send_time": raw.get("send_time") or raw.get("sendTime"),
        "start_date": raw.get("start_date") or raw.get("startDate"),
        "pause_on_payment": raw.get("pause_on_payment", raw.get("pauseOnPayment", True)),
    }


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.post("/campaigns/evaluate", response_model=EvaluationResult)
def evaluate_campaigns(
    db: Annotated[Session, Depends(get_db)],
) -> EvaluationResult:
    """Evaluate all active campaigns and enqueue message tasks.

    For each active campaign:
    1. Read strategy_config audience filters
    2. Query debtors + invoices matching those filters
    3. Determine the campaign stage based on days overdue
    4. Enqueue message tasks for actions due today
    """
    stmt = (
        select(Campaign)
        .options(
            joinedload(Campaign.stages).joinedload(CampaignStage.actions),
        )
        .where(Campaign.is_active.is_(True))
    )
    campaigns = list(db.execute(stmt).unique().scalars().all())

    campaign_results: list[CampaignEvaluation] = []
    total_matched = 0
    total_enqueued = 0
    errors: list[str] = []

    for campaign in campaigns:
        try:
            evaluation = _process_campaign(db, campaign)
            campaign_results.append(evaluation)
            total_matched += evaluation.matched_debtors
            total_enqueued += evaluation.tasks_enqueued
        except Exception as e:
            msg = f"Campaign {campaign.id} ({campaign.name}): {e}"
            logger.exception(msg)
            errors.append(msg)
            campaign_results.append(
                CampaignEvaluation(
                    campaign_id=str(campaign.id),
                    campaign_name=campaign.name,
                    matched_debtors=0,
                    tasks_enqueued=0,
                    debtors=[],
                    skipped_already_contacted=0,
                    error=str(e),
                )
            )

    return EvaluationResult(
        campaigns_evaluated=len(campaigns),
        total_matched_debtors=total_matched,
        total_tasks_enqueued=total_enqueued,
        campaigns=campaign_results,
        errors=errors,
    )


# ---------------------------------------------------------------------------
# Campaign processing
# ---------------------------------------------------------------------------

def _process_campaign(db: Session, campaign: Campaign) -> CampaignEvaluation:
    """Process a single campaign: find matching debtors and enqueue tasks."""
    strategy = campaign.strategy_config or {}
    audience = _normalize_audience(strategy.get("audience", {}))
    schedule = _normalize_schedule(strategy.get("schedule", {}))

    # Check schedule – is today an active day?
    today = date.today()
    active_days = schedule["active_days"]
    if today.isoweekday() not in active_days:
        logger.info("Campaign %s: today is not an active day", campaign.id)
        return CampaignEvaluation(
            campaign_id=str(campaign.id),
            campaign_name=campaign.name,
            matched_debtors=0,
            tasks_enqueued=0,
            debtors=[],
            skipped_already_contacted=0,
        )

    # Find debtors matching audience filters
    matching_debtors = _find_matching_debtors(
        db=db,
        organization_id=campaign.organization_id,
        audience=audience,
    )

    debtor_matches: list[DebtorMatch] = []
    enqueued = 0
    skipped_contacted = 0

    for debtor, days_overdue, total_debt in matching_debtors:
        stage = _determine_stage(campaign.stages, days_overdue)
        if stage is None:
            continue

        actions_due = _get_due_actions(stage, days_overdue)

        # Check if already contacted today
        if _already_contacted_today(db, campaign.id, debtor.id):
            skipped_contacted += 1
            continue

        actions_enqueued = 0
        for action in actions_due:
            try:
                _enqueue_message_task(
                    organization_id=str(campaign.organization_id),
                    campaign_id=str(campaign.id),
                    stage_id=str(stage.id),
                    action_id=str(action.id),
                    debtor_id=str(debtor.id),
                    channel=action.channel.value,
                    ai_enabled=action.ai_enabled,
                    tone_instructions=stage.tone_instructions or "",
                )
                actions_enqueued += 1
                enqueued += 1
            except Exception as e:
                logger.error(
                    "Failed to enqueue task for debtor %s action %s: %s",
                    debtor.id, action.id, e,
                )

        debtor_matches.append(DebtorMatch(
            debtor_id=str(debtor.id),
            debtor_name=debtor.name,
            days_overdue=days_overdue,
            total_debt=float(total_debt),
            stage_name=stage.name,
            actions_due=actions_enqueued,
        ))

    logger.info("Campaign %s: matched %d debtors, enqueued %d tasks",
                campaign.id, len(debtor_matches), enqueued)

    return CampaignEvaluation(
        campaign_id=str(campaign.id),
        campaign_name=campaign.name,
        matched_debtors=len(debtor_matches),
        tasks_enqueued=enqueued,
        debtors=debtor_matches,
        skipped_already_contacted=skipped_contacted,
    )


# ---------------------------------------------------------------------------
# Debtor matching – translates strategy_config → SQLAlchemy query
# ---------------------------------------------------------------------------

def _find_matching_debtors(
    db: Session,
    organization_id: UUID,
    audience: dict,
) -> list[tuple[Debtor, int, float]]:
    """Find debtors with overdue invoices matching audience criteria.

    Translates audience rules like:
      - "Solo deudores con más de $10.000 de deuda"  → total_debt >= 10000
      - "Entre 1 y 30 días de mora"                   → days_overdue BETWEEN 1 AND 30
      - "Que no tengan riesgo altísimo"                → risk_score <= risk_score_max
      - "Con tag 'VIP'"                                → debtor.tags @> ARRAY['VIP']

    Returns list of (Debtor, days_overdue, total_debt) tuples.
    """
    today = date.today()

    # Subquery: aggregate overdue invoices per debtor
    overdue_sub = (
        select(
            Invoice.debtor_id,
            func.max(
                cast(func.extract("day", func.now() - Invoice.due_date), Integer)
            ).label("days_overdue"),
            func.sum(Invoice.balance).label("total_debt"),
        )
        .where(
            Invoice.organization_id == organization_id,
            Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]),
            Invoice.due_date < today,
            Invoice.balance > 0,
        )
        .group_by(Invoice.debtor_id)
        .subquery()
    )

    # Main query: join debtors with their overdue aggregates
    stmt = (
        select(Debtor, overdue_sub.c.days_overdue, overdue_sub.c.total_debt)
        .join(overdue_sub, Debtor.id == overdue_sub.c.debtor_id)
        .where(Debtor.organization_id == organization_id)
    )

    # --- Apply audience filters ---

    # Days overdue range
    min_days = audience.get("min_days_overdue", 1)
    max_days = audience.get("max_days_overdue", 365)
    stmt = stmt.where(
        overdue_sub.c.days_overdue >= min_days,
        overdue_sub.c.days_overdue <= max_days,
    )

    # Minimum debt amount
    min_debt = audience.get("min_debt_amount", 0)
    if min_debt and min_debt > 0:
        stmt = stmt.where(overdue_sub.c.total_debt >= min_debt)

    # Risk score range
    if audience.get("risk_score_min") is not None:
        stmt = stmt.where(Debtor.risk_score >= audience["risk_score_min"])
    if audience.get("risk_score_max") is not None:
        stmt = stmt.where(Debtor.risk_score <= audience["risk_score_max"])

    # Tags filter (debtor must have ALL specified tags)
    tags = audience.get("tags", [])
    if tags:
        stmt = stmt.where(Debtor.tags.contains(tags))

    results = db.execute(stmt).all()
    return [(row[0], int(row[1]), float(row[2])) for row in results]


# ---------------------------------------------------------------------------
# Stage & action resolution
# ---------------------------------------------------------------------------

def _determine_stage(
    stages: list[CampaignStage],
    days_overdue: int,
) -> CampaignStage | None:
    """Find the campaign stage that covers the given days overdue."""
    for stage in sorted(stages, key=lambda s: s.day_start):
        if stage.day_start <= days_overdue <= stage.day_end:
            return stage
    return None


def _get_due_actions(stage: CampaignStage, days_overdue: int) -> list[StageAction]:
    """Get actions whose trigger_day matches the current days overdue."""
    return [a for a in stage.actions if a.trigger_day == days_overdue]


# ---------------------------------------------------------------------------
# Duplicate contact check
# ---------------------------------------------------------------------------

def _already_contacted_today(
    db: Session,
    campaign_id: UUID,
    debtor_id: UUID,
) -> bool:
    """Check if we already sent a message to this debtor today for this campaign."""
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    stmt = select(func.count()).where(
        CommunicationLog.campaign_id == campaign_id,
        CommunicationLog.debtor_id == debtor_id,
        CommunicationLog.created_at >= today_start,
    )
    count = db.execute(stmt).scalar() or 0
    return count > 0


# ---------------------------------------------------------------------------
# Cloud Tasks enqueuing
# ---------------------------------------------------------------------------

def _enqueue_message_task(
    organization_id: str,
    campaign_id: str,
    stage_id: str,
    action_id: str,
    debtor_id: str,
    channel: str,
    ai_enabled: bool,
    tone_instructions: str,
) -> None:
    """Create a Cloud Tasks task for the message-sending queue.

    If Cloud Tasks is not configured (dev environment), logs the task
    payload instead of enqueuing.
    """
    payload = {
        "organization_id": organization_id,
        "campaign_id": campaign_id,
        "stage_id": stage_id,
        "action_id": action_id,
        "debtor_id": debtor_id,
        "channel": channel,
        "ai_enabled": ai_enabled,
        "tone_instructions": tone_instructions,
    }

    if not settings.GCP_PROJECT_ID:
        logger.info("Cloud Tasks not configured – task payload: %s", payload)
        return

    try:
        from google.cloud import tasks_v2

        client = tasks_v2.CloudTasksClient()

        parent = client.queue_path(
            settings.GCP_PROJECT_ID,
            settings.GCP_LOCATION,
            settings.CLOUD_TASKS_QUEUE_MESSAGES,
        )

        service_url = settings.CLOUD_RUN_SERVICE_URL.rstrip("/")
        task = tasks_v2.Task(
            http_request=tasks_v2.HttpRequest(
                http_method=tasks_v2.HttpMethod.POST,
                url=f"{service_url}/api/v1/workers/messages/send",
                headers={"Content-Type": "application/json"},
                body=json.dumps(payload).encode(),
                oidc_token=tasks_v2.OidcToken(
                    service_account_email=settings.CLOUD_TASKS_SERVICE_ACCOUNT,
                ),
            ),
        )

        client.create_task(parent=parent, task=task)
        logger.info("Enqueued message task: debtor=%s channel=%s", debtor_id, channel)
    except ImportError:
        logger.warning("google-cloud-tasks not installed – skipping enqueue")
    except Exception as e:
        logger.error("Failed to enqueue Cloud Task: %s", e)
        raise
