from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.crud import communication as comm_crud
from app.db.session import get_db
from app.models.campaign import ChannelType
from app.models.communication import (
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
    # Return mock summary for now - will be computed from real data later
    return CommunicationHubSummary(
        kpis=CommunicationHubKpis(
            sent_today=1247,
            sent_today_change=18.0,
            open_rate=68.5,
            open_rate_change=5.2,
            reply_rate=32.1,
            reply_rate_change=-2.1,
            payments_post_contact=89,
            payments_post_contact_change=24.0,
        ),
        channels=[
            ChannelSummary(channel=ChannelType.EMAIL, status="active", sent_today=523, description="Operativo"),
            ChannelSummary(channel=ChannelType.WHATSAPP, status="active", sent_today=412, description="Operativo"),
            ChannelSummary(channel=ChannelType.CALL, status="manual", sent_today=89, description="Manual"),
            ChannelSummary(channel=ChannelType.SMS, status="inactive", sent_today=0, description="No configurado"),
        ],
    )
