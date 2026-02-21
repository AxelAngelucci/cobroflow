from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.campaign import ChannelType
from app.models.communication import (
    TemplateStatus, WorkflowStatus, StepConditionType,
    CommunicationDirection, CommunicationStatus, CommunicationEventType,
)


# ============== Message Templates ==============

class MessageTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    channel: ChannelType
    subject: str | None = Field(None, max_length=500)
    body: str = Field(..., min_length=1)
    variables: list[str] | None = None
    status: TemplateStatus = TemplateStatus.DRAFT
    language: str = Field("es", max_length=5)


class MessageTemplateCreate(MessageTemplateBase):
    pass


class MessageTemplateUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    channel: ChannelType | None = None
    subject: str | None = Field(None, max_length=500)
    body: str | None = Field(None, min_length=1)
    variables: list[str] | None = None
    status: TemplateStatus | None = None
    language: str | None = Field(None, max_length=5)


class MessageTemplateResponse(MessageTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    times_used: int = 0
    open_rate: Decimal | None = None
    click_rate: Decimal | None = None
    reply_rate: Decimal | None = None
    conversion_rate: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class MessageTemplateListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    channel: ChannelType
    subject: str | None = None
    body: str
    variables: list[str] | None = None
    status: TemplateStatus
    language: str
    times_used: int = 0
    open_rate: Decimal | None = None
    click_rate: Decimal | None = None
    reply_rate: Decimal | None = None
    conversion_rate: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class MessageTemplateListResponse(BaseModel):
    items: list[MessageTemplateListItem]
    total: int
    page: int
    size: int


# ============== Workflow Steps ==============

class WorkflowStepBase(BaseModel):
    step_order: int = Field(..., ge=1)
    name: str = Field(..., min_length=1, max_length=255)
    channel: ChannelType
    template_id: UUID | None = None
    delay_days: int = Field(0, ge=0)
    delay_hours: int = Field(0, ge=0)
    send_time: str | None = Field(None, max_length=5)
    condition_type: StepConditionType = StepConditionType.NONE
    fallback_channel: str | None = Field(None, max_length=20)
    ai_enabled: bool = False
    ai_instructions: str | None = None
    config: dict | None = None


class WorkflowStepCreate(WorkflowStepBase):
    pass


class WorkflowStepUpdate(BaseModel):
    step_order: int | None = Field(None, ge=1)
    name: str | None = Field(None, min_length=1, max_length=255)
    channel: ChannelType | None = None
    template_id: UUID | None = None
    delay_days: int | None = Field(None, ge=0)
    delay_hours: int | None = Field(None, ge=0)
    send_time: str | None = Field(None, max_length=5)
    condition_type: StepConditionType | None = None
    fallback_channel: str | None = Field(None, max_length=20)
    ai_enabled: bool | None = None
    ai_instructions: str | None = None
    config: dict | None = None


class WorkflowStepResponse(WorkflowStepBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    created_at: datetime


# ============== Collection Workflows ==============

class CollectionWorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    status: WorkflowStatus = WorkflowStatus.DRAFT
    trigger_description: str | None = Field(None, max_length=500)
    settings: dict | None = None


class CollectionWorkflowCreate(CollectionWorkflowBase):
    steps: list[WorkflowStepCreate] = []


class CollectionWorkflowUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    status: WorkflowStatus | None = None
    trigger_description: str | None = Field(None, max_length=500)
    settings: dict | None = None


class CollectionWorkflowResponse(CollectionWorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    total_executions: int = 0
    success_rate: Decimal | None = None
    steps: list[WorkflowStepResponse] = []
    created_at: datetime
    updated_at: datetime


class CollectionWorkflowListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    description: str | None = None
    status: WorkflowStatus
    trigger_description: str | None = None
    total_executions: int = 0
    success_rate: Decimal | None = None
    steps: list[WorkflowStepResponse] = []
    created_at: datetime
    updated_at: datetime


class CollectionWorkflowListResponse(BaseModel):
    items: list[CollectionWorkflowListItem]
    total: int
    page: int
    size: int


# ============== Communication Events ==============

class CommunicationEventBase(BaseModel):
    event_type: CommunicationEventType
    occurred_at: datetime
    data: dict | None = None
    source: str | None = Field(None, max_length=100)


class CommunicationEventCreate(CommunicationEventBase):
    pass


class CommunicationEventResponse(CommunicationEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    communication_log_id: UUID


# ============== Communication Logs ==============

class CommunicationLogBase(BaseModel):
    debtor_id: UUID
    invoice_id: UUID | None = None
    campaign_id: UUID | None = None
    workflow_id: UUID | None = None
    workflow_step_id: UUID | None = None
    template_id: UUID | None = None
    sent_by_user_id: UUID | None = None
    channel: ChannelType
    direction: CommunicationDirection = CommunicationDirection.OUTBOUND
    status: CommunicationStatus = CommunicationStatus.SCHEDULED
    subject: str | None = Field(None, max_length=500)
    body: str | None = None
    recipient_address: str | None = Field(None, max_length=255)


class CommunicationLogCreate(CommunicationLogBase):
    pass


class CommunicationLogUpdate(BaseModel):
    status: CommunicationStatus | None = None
    sent_at: datetime | None = None
    delivered_at: datetime | None = None
    opened_at: datetime | None = None
    clicked_at: datetime | None = None
    responded_at: datetime | None = None
    failed_at: datetime | None = None
    response_body: str | None = None
    error_message: str | None = None
    error_code: str | None = Field(None, max_length=50)
    external_message_id: str | None = Field(None, max_length=500)
    provider: str | None = Field(None, max_length=50)
    cost: Decimal | None = None


class CommunicationLogResponse(CommunicationLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    external_message_id: str | None = None
    provider: str | None = None
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    delivered_at: datetime | None = None
    opened_at: datetime | None = None
    clicked_at: datetime | None = None
    responded_at: datetime | None = None
    failed_at: datetime | None = None
    response_body: str | None = None
    call_duration_seconds: int | None = None
    call_outcome: str | None = None
    error_message: str | None = None
    error_code: str | None = None
    cost: Decimal | None = None
    events: list[CommunicationEventResponse] = []
    created_at: datetime


class CommunicationLogListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    debtor_id: UUID
    campaign_id: UUID | None = None
    channel: ChannelType
    direction: CommunicationDirection
    status: CommunicationStatus
    subject: str | None = None
    recipient_address: str | None = None
    sent_at: datetime | None = None
    created_at: datetime


class CommunicationLogListResponse(BaseModel):
    items: list[CommunicationLogListItem]
    total: int
    page: int
    size: int


# ============== Hub Summary ==============

class CommunicationHubKpis(BaseModel):
    sent_today: int = 0
    sent_today_change: float = 0
    open_rate: float = 0
    open_rate_change: float = 0
    reply_rate: float = 0
    reply_rate_change: float = 0
    payments_post_contact: int = 0
    payments_post_contact_change: float = 0


class ChannelSummary(BaseModel):
    channel: ChannelType
    status: str = "active"
    sent_today: int = 0
    description: str = ""


class CommunicationHubSummary(BaseModel):
    kpis: CommunicationHubKpis
    channels: list[ChannelSummary] = []
