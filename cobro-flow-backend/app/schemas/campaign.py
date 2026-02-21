from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.campaign import CampaignType, ChannelType


# ============== Stage Actions ==============

class StageActionBase(BaseModel):
    """Base schema for stage action."""
    channel: ChannelType
    trigger_day: int = Field(..., ge=0)
    template_id: UUID | None = None
    ai_enabled: bool = False


class StageActionCreate(StageActionBase):
    """Schema for creating a stage action."""
    pass


class StageActionUpdate(BaseModel):
    """Schema for updating a stage action."""
    channel: ChannelType | None = None
    trigger_day: int | None = Field(None, ge=0)
    template_id: UUID | None = None
    ai_enabled: bool | None = None


class StageActionResponse(StageActionBase):
    """Schema for stage action response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    stage_id: UUID
    created_at: datetime


# ============== Campaign Stages ==============

class CampaignStageBase(BaseModel):
    """Base schema for campaign stage."""
    name: str = Field(..., min_length=1, max_length=100)
    day_start: int = Field(..., ge=0)
    day_end: int = Field(..., ge=0)
    tone_instructions: str | None = None


class CampaignStageCreate(CampaignStageBase):
    """Schema for creating a campaign stage."""
    actions: list[StageActionCreate] = []


class CampaignStageUpdate(BaseModel):
    """Schema for updating a campaign stage."""
    name: str | None = Field(None, min_length=1, max_length=100)
    day_start: int | None = Field(None, ge=0)
    day_end: int | None = Field(None, ge=0)
    tone_instructions: str | None = None


class CampaignStageResponse(CampaignStageBase):
    """Schema for campaign stage response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    campaign_id: UUID
    actions: list[StageActionResponse] = []
    created_at: datetime


# ============== Campaigns ==============

class CampaignBase(BaseModel):
    """Base schema for campaign."""
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    campaign_type: CampaignType | None = None
    is_active: bool = True
    strategy_config: dict | None = None
    workflow_id: UUID | None = None


class CampaignCreate(CampaignBase):
    """Schema for creating a campaign."""
    stages: list[CampaignStageCreate] = []


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign."""
    name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None
    campaign_type: CampaignType | None = None
    is_active: bool | None = None
    strategy_config: dict | None = None
    workflow_id: UUID | None = None


class CampaignResponse(CampaignBase):
    """Schema for campaign response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    stages: list[CampaignStageResponse] = []
    created_at: datetime
    updated_at: datetime


class CampaignListItem(BaseModel):
    """Schema for campaign in list (without stages)."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    description: str | None = None
    campaign_type: CampaignType | None = None
    is_active: bool
    strategy_config: dict | None = None
    workflow_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class CampaignListResponse(BaseModel):
    """Schema for paginated campaign list."""
    items: list[CampaignListItem]
    total: int
    page: int
    size: int
