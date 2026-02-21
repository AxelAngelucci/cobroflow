from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.communication import (
    MessageTemplate, CollectionWorkflow, WorkflowStep,
    CommunicationLog, CommunicationEvent,
    TemplateStatus, WorkflowStatus, CommunicationStatus,
)
from app.models.campaign import ChannelType
from app.schemas.communication import (
    MessageTemplateCreate, MessageTemplateUpdate,
    CollectionWorkflowCreate, CollectionWorkflowUpdate,
    WorkflowStepCreate, WorkflowStepUpdate,
    CommunicationLogCreate, CommunicationLogUpdate,
    CommunicationEventCreate,
)


# ============== Message Templates ==============

def get_templates(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    channel: ChannelType | None = None,
    status: TemplateStatus | None = None,
) -> tuple[list[MessageTemplate], int]:
    stmt = select(MessageTemplate).where(
        MessageTemplate.organization_id == organization_id,
    )

    if search:
        stmt = stmt.where(MessageTemplate.name.ilike(f"%{search}%"))
    if channel:
        stmt = stmt.where(MessageTemplate.channel == channel)
    if status:
        stmt = stmt.where(MessageTemplate.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(MessageTemplate.created_at.desc()).offset(skip).limit(limit)
    templates = list(db.execute(stmt).scalars().all())

    return templates, total


def get_template_by_id(
    db: Session,
    template_id: UUID,
    organization_id: UUID,
) -> MessageTemplate | None:
    stmt = select(MessageTemplate).where(
        MessageTemplate.id == template_id,
        MessageTemplate.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_template(
    db: Session,
    template_data: MessageTemplateCreate,
    organization_id: UUID,
) -> MessageTemplate:
    template = MessageTemplate(
        organization_id=organization_id,
        **template_data.model_dump(),
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def update_template(
    db: Session,
    template: MessageTemplate,
    template_data: MessageTemplateUpdate,
) -> MessageTemplate:
    update_data = template_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template: MessageTemplate) -> None:
    db.delete(template)
    db.commit()


# ============== Collection Workflows ==============

def get_workflows(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    status: WorkflowStatus | None = None,
) -> tuple[list[CollectionWorkflow], int]:
    stmt = select(CollectionWorkflow).where(
        CollectionWorkflow.organization_id == organization_id,
    )

    if search:
        stmt = stmt.where(CollectionWorkflow.name.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(CollectionWorkflow.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = (
        stmt.options(joinedload(CollectionWorkflow.steps))
        .order_by(CollectionWorkflow.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    workflows = list(db.execute(stmt).unique().scalars().all())

    return workflows, total


def get_workflow_by_id(
    db: Session,
    workflow_id: UUID,
    organization_id: UUID,
) -> CollectionWorkflow | None:
    stmt = (
        select(CollectionWorkflow)
        .options(joinedload(CollectionWorkflow.steps))
        .where(
            CollectionWorkflow.id == workflow_id,
            CollectionWorkflow.organization_id == organization_id,
        )
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def create_workflow(
    db: Session,
    workflow_data: CollectionWorkflowCreate,
    organization_id: UUID,
) -> CollectionWorkflow:
    data = workflow_data.model_dump(exclude={"steps"})
    workflow = CollectionWorkflow(
        organization_id=organization_id,
        **data,
    )
    db.add(workflow)
    db.flush()

    for step_data in workflow_data.steps:
        step = WorkflowStep(
            workflow_id=workflow.id,
            **step_data.model_dump(),
        )
        db.add(step)

    db.commit()
    db.refresh(workflow)
    return get_workflow_by_id(db, workflow.id, organization_id)  # type: ignore


def update_workflow(
    db: Session,
    workflow: CollectionWorkflow,
    workflow_data: CollectionWorkflowUpdate,
) -> CollectionWorkflow:
    update_data = workflow_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)
    db.commit()
    db.refresh(workflow)
    return workflow


def delete_workflow(db: Session, workflow: CollectionWorkflow) -> None:
    db.delete(workflow)
    db.commit()


# ============== Workflow Steps ==============

def get_step_by_id(db: Session, step_id: UUID) -> WorkflowStep | None:
    stmt = select(WorkflowStep).where(WorkflowStep.id == step_id)
    return db.execute(stmt).scalar_one_or_none()


def create_step(
    db: Session,
    step_data: WorkflowStepCreate,
    workflow_id: UUID,
) -> WorkflowStep:
    step = WorkflowStep(
        workflow_id=workflow_id,
        **step_data.model_dump(),
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


def update_step(
    db: Session,
    step: WorkflowStep,
    step_data: WorkflowStepUpdate,
) -> WorkflowStep:
    update_data = step_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(step, field, value)
    db.commit()
    db.refresh(step)
    return step


def delete_step(db: Session, step: WorkflowStep) -> None:
    db.delete(step)
    db.commit()


# ============== Communication Logs ==============

def get_communication_logs(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    channel: ChannelType | None = None,
    status: CommunicationStatus | None = None,
    debtor_id: UUID | None = None,
    campaign_id: UUID | None = None,
    workflow_id: UUID | None = None,
) -> tuple[list[CommunicationLog], int]:
    stmt = select(CommunicationLog).where(
        CommunicationLog.organization_id == organization_id,
    )

    if channel:
        stmt = stmt.where(CommunicationLog.channel == channel)
    if status:
        stmt = stmt.where(CommunicationLog.status == status)
    if debtor_id:
        stmt = stmt.where(CommunicationLog.debtor_id == debtor_id)
    if campaign_id:
        stmt = stmt.where(CommunicationLog.campaign_id == campaign_id)
    if workflow_id:
        stmt = stmt.where(CommunicationLog.workflow_id == workflow_id)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(CommunicationLog.created_at.desc()).offset(skip).limit(limit)
    logs = list(db.execute(stmt).scalars().all())

    return logs, total


def get_communication_log_by_id(
    db: Session,
    log_id: UUID,
    organization_id: UUID,
) -> CommunicationLog | None:
    stmt = (
        select(CommunicationLog)
        .options(joinedload(CommunicationLog.events))
        .where(
            CommunicationLog.id == log_id,
            CommunicationLog.organization_id == organization_id,
        )
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def create_communication_log(
    db: Session,
    log_data: CommunicationLogCreate,
    organization_id: UUID,
) -> CommunicationLog:
    log = CommunicationLog(
        organization_id=organization_id,
        **log_data.model_dump(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def update_communication_log(
    db: Session,
    log: CommunicationLog,
    log_data: CommunicationLogUpdate,
) -> CommunicationLog:
    update_data = log_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return log


# ============== Communication Events ==============

def create_communication_event(
    db: Session,
    event_data: CommunicationEventCreate,
    communication_log_id: UUID,
) -> CommunicationEvent:
    event = CommunicationEvent(
        communication_log_id=communication_log_id,
        **event_data.model_dump(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
