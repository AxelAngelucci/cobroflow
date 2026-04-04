from datetime import datetime, timezone, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.crud import communication as comm_crud
from app.db.session import get_db
from app.models.campaign import ChannelType
from app.models.communication import (
    CommunicationLog, CommunicationDirection,
    TemplateStatus, WorkflowStatus, CommunicationStatus,
)
from app.schemas.communication import (
    MessageTemplateCreate, MessageTemplateUpdate,
    MessageTemplateResponse, MessageTemplateListResponse,
    CollectionWorkflowCreate, CollectionWorkflowUpdate,
    CollectionWorkflowResponse, CollectionWorkflowListResponse,
    WorkflowStepCreate, WorkflowStepUpdate, WorkflowStepResponse,
    CommunicationLogCreate, CommunicationLogUpdate,
    CommunicationLogResponse, CommunicationLogListResponse,
    CommunicationEventCreate, CommunicationEventResponse,
    CommunicationHubSummary, CommunicationHubKpis, ChannelSummary,
)

router = APIRouter()


def _check_org(current_user: CurrentUser) -> UUID:
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    return current_user.organization_id


# ============== TEMPLATES ==============

@router.post("/templates/", response_model=MessageTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: MessageTemplateCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MessageTemplateResponse:
    org_id = _check_org(current_user)
    return comm_crud.create_template(db, template_data, org_id)


@router.get("/templates/", response_model=MessageTemplateListResponse)
def get_templates(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    channel: ChannelType | None = Query(None),
    template_status: TemplateStatus | None = Query(None, alias="status"),
) -> MessageTemplateListResponse:
    org_id = _check_org(current_user)
    skip = (page - 1) * size
    templates, total = comm_crud.get_templates(
        db, org_id, skip=skip, limit=size,
        search=search, channel=channel, status=template_status,
    )
    return MessageTemplateListResponse(items=templates, total=total, page=page, size=size)


@router.get("/templates/{template_id}", response_model=MessageTemplateResponse)
def get_template(
    template_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MessageTemplateResponse:
    org_id = _check_org(current_user)
    template = comm_crud.get_template_by_id(db, template_id, org_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.patch("/templates/{template_id}", response_model=MessageTemplateResponse)
def update_template(
    template_id: UUID,
    template_data: MessageTemplateUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> MessageTemplateResponse:
    org_id = _check_org(current_user)
    template = comm_crud.get_template_by_id(db, template_id, org_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return comm_crud.update_template(db, template, template_data)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _check_org(current_user)
    template = comm_crud.get_template_by_id(db, template_id, org_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    comm_crud.delete_template(db, template)


# ============== WORKFLOWS ==============

@router.post("/workflows/", response_model=CollectionWorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    workflow_data: CollectionWorkflowCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CollectionWorkflowResponse:
    org_id = _check_org(current_user)
    return comm_crud.create_workflow(db, workflow_data, org_id)


@router.get("/workflows/", response_model=CollectionWorkflowListResponse)
def get_workflows(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    workflow_status: WorkflowStatus | None = Query(None, alias="status"),
) -> CollectionWorkflowListResponse:
    org_id = _check_org(current_user)
    skip = (page - 1) * size
    workflows, total = comm_crud.get_workflows(
        db, org_id, skip=skip, limit=size,
        search=search, status=workflow_status,
    )
    return CollectionWorkflowListResponse(items=workflows, total=total, page=page, size=size)


@router.get("/workflows/{workflow_id}", response_model=CollectionWorkflowResponse)
def get_workflow(
    workflow_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CollectionWorkflowResponse:
    org_id = _check_org(current_user)
    workflow = comm_crud.get_workflow_by_id(db, workflow_id, org_id)
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return workflow


@router.patch("/workflows/{workflow_id}", response_model=CollectionWorkflowResponse)
def update_workflow(
    workflow_id: UUID,
    workflow_data: CollectionWorkflowUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CollectionWorkflowResponse:
    org_id = _check_org(current_user)
    workflow = comm_crud.get_workflow_by_id(db, workflow_id, org_id)
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return comm_crud.update_workflow(db, workflow, workflow_data)


@router.delete("/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    org_id = _check_org(current_user)
    workflow = comm_crud.get_workflow_by_id(db, workflow_id, org_id)
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    comm_crud.delete_workflow(db, workflow)


# ============== WORKFLOW STEPS ==============

@router.post("/workflows/{workflow_id}/steps", response_model=WorkflowStepResponse, status_code=status.HTTP_201_CREATED)
def create_step(
    workflow_id: UUID,
    step_data: WorkflowStepCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowStepResponse:
    org_id = _check_org(current_user)
    workflow = comm_crud.get_workflow_by_id(db, workflow_id, org_id)
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return comm_crud.create_step(db, step_data, workflow_id)


@router.patch("/steps/{step_id}", response_model=WorkflowStepResponse)
def update_step(
    step_id: UUID,
    step_data: WorkflowStepUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowStepResponse:
    _check_org(current_user)
    step = comm_crud.get_step_by_id(db, step_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    return comm_crud.update_step(db, step, step_data)


@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step(
    step_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    _check_org(current_user)
    step = comm_crud.get_step_by_id(db, step_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    comm_crud.delete_step(db, step)


# ============== COMMUNICATION LOGS ==============

@router.post("/logs/", response_model=CommunicationLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    log_data: CommunicationLogCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommunicationLogResponse:
    org_id = _check_org(current_user)
    return comm_crud.create_communication_log(db, log_data, org_id)


@router.get("/logs/", response_model=CommunicationLogListResponse)
def get_logs(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    channel: ChannelType | None = Query(None),
    log_status: CommunicationStatus | None = Query(None, alias="status"),
    debtor_id: UUID | None = Query(None),
    campaign_id: UUID | None = Query(None),
    workflow_id: UUID | None = Query(None),
) -> CommunicationLogListResponse:
    org_id = _check_org(current_user)
    skip = (page - 1) * size
    logs, total = comm_crud.get_communication_logs(
        db, org_id, skip=skip, limit=size,
        channel=channel, status=log_status,
        debtor_id=debtor_id, campaign_id=campaign_id, workflow_id=workflow_id,
    )
    return CommunicationLogListResponse(items=logs, total=total, page=page, size=size)


@router.get("/logs/{log_id}", response_model=CommunicationLogResponse)
def get_log(
    log_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommunicationLogResponse:
    org_id = _check_org(current_user)
    log = comm_crud.get_communication_log_by_id(db, log_id, org_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Communication log not found")
    return log


@router.patch("/logs/{log_id}", response_model=CommunicationLogResponse)
def update_log(
    log_id: UUID,
    log_data: CommunicationLogUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommunicationLogResponse:
    org_id = _check_org(current_user)
    log = comm_crud.get_communication_log_by_id(db, log_id, org_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Communication log not found")
    return comm_crud.update_communication_log(db, log, log_data)


# ============== COMMUNICATION EVENTS ==============

@router.post("/logs/{log_id}/events", response_model=CommunicationEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    log_id: UUID,
    event_data: CommunicationEventCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommunicationEventResponse:
    org_id = _check_org(current_user)
    log = comm_crud.get_communication_log_by_id(db, log_id, org_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Communication log not found")
    return comm_crud.create_communication_event(db, event_data, log_id)


# ============== HUB SUMMARY ==============

@router.get("/hub/summary", response_model=CommunicationHubSummary)
def get_hub_summary(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommunicationHubSummary:
    _check_org(current_user)
    org_id = current_user.organization_id

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    def _query_period(start: datetime, end: datetime):
        """Returns (sent, opened, replied) counts for outbound logs in a time window."""
        rows = db.execute(
            db.query(
                func.count().label("sent"),
                func.sum(case((CommunicationLog.opened_at.isnot(None), 1), else_=0)).label("opened"),
                func.sum(case((CommunicationLog.responded_at.isnot(None), 1), else_=0)).label("replied"),
            )
            .filter(
                CommunicationLog.organization_id == org_id,
                CommunicationLog.direction == CommunicationDirection.OUTBOUND,
                CommunicationLog.created_at >= start,
                CommunicationLog.created_at < end,
            )
            .statement
        ).fetchone()
        sent = rows.sent or 0
        opened = rows.opened or 0
        replied = rows.replied or 0
        open_rate = round((opened / sent * 100), 1) if sent > 0 else 0.0
        reply_rate = round((replied / sent * 100), 1) if sent > 0 else 0.0
        return sent, open_rate, reply_rate

    sent_today, open_rate_today, reply_rate_today = _query_period(today_start, now)
    sent_yesterday, open_rate_yesterday, reply_rate_yesterday = _query_period(yesterday_start, today_start)

    def _pct_change(current: float, previous: float) -> float:
        if previous == 0:
            return 0.0
        return round((current - previous) / previous * 100, 1)

    sent_change = _pct_change(sent_today, sent_yesterday)
    open_change = _pct_change(open_rate_today, open_rate_yesterday)
    reply_change = _pct_change(reply_rate_today, reply_rate_yesterday)

    # Per-channel breakdown for today
    channel_rows = db.execute(
        db.query(
            CommunicationLog.channel,
            func.count().label("cnt"),
        )
        .filter(
            CommunicationLog.organization_id == org_id,
            CommunicationLog.direction == CommunicationDirection.OUTBOUND,
            CommunicationLog.created_at >= today_start,
        )
        .group_by(CommunicationLog.channel)
        .statement
    ).fetchall()

    channel_counts: dict[str, int] = {row.channel: row.cnt for row in channel_rows}

    channel_meta = {
        ChannelType.WHATSAPP: ("active", "Operativo"),
        ChannelType.EMAIL: ("active", "Operativo"),
        ChannelType.CALL: ("manual", "Manual"),
        ChannelType.SMS: ("inactive", "No configurado"),
    }

    channels = [
        ChannelSummary(
            channel=ch,
            status=meta[0],
            sent_today=channel_counts.get(ch.value, 0),
            description=meta[1],
        )
        for ch, meta in channel_meta.items()
    ]

    return CommunicationHubSummary(
        kpis=CommunicationHubKpis(
            sent_today=sent_today,
            sent_today_change=sent_change,
            open_rate=open_rate_today,
            open_rate_change=open_change,
            reply_rate=reply_rate_today,
            reply_rate_change=reply_change,
            payments_post_contact=0,
            payments_post_contact_change=0.0,
        ),
        channels=channels,
    )
