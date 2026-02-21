from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.crud import campaign as campaign_crud
from app.db.session import get_db
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
    CampaignStageCreate,
    CampaignStageUpdate,
    CampaignStageResponse,
    StageActionCreate,
    StageActionUpdate,
    StageActionResponse,
)

router = APIRouter()


# ============== CAMPAIGNS ==============

@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_data: CampaignCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CampaignResponse:
    """Create a new campaign with optional stages and actions."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    campaign = campaign_crud.create_campaign(db, campaign_data, current_user.organization_id)
    return campaign


@router.get("/", response_model=CampaignListResponse)
def get_campaigns(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
) -> CampaignListResponse:
    """Get paginated list of campaigns."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    skip = (page - 1) * size
    campaigns, total = campaign_crud.get_campaigns(
        db, current_user.organization_id,
        skip=skip, limit=size, search=search, is_active=is_active
    )

    return CampaignListResponse(items=campaigns, total=total, page=page, size=size)


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CampaignResponse:
    """Get a specific campaign by ID with stages and actions."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    campaign = campaign_crud.get_campaign_by_id(db, campaign_id, current_user.organization_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    return campaign


@router.patch("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: UUID,
    campaign_data: CampaignUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CampaignResponse:
    """Update a campaign."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    campaign = campaign_crud.get_campaign_by_id(db, campaign_id, current_user.organization_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    return campaign_crud.update_campaign(db, campaign, campaign_data)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a campaign."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    campaign = campaign_crud.get_campaign_by_id(db, campaign_id, current_user.organization_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    campaign_crud.delete_campaign(db, campaign)


# ============== CAMPAIGN STAGES ==============

@router.post("/{campaign_id}/stages", response_model=CampaignStageResponse, status_code=status.HTTP_201_CREATED)
def create_stage(
    campaign_id: UUID,
    stage_data: CampaignStageCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CampaignStageResponse:
    """Create a new stage for a campaign."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    campaign = campaign_crud.get_campaign_by_id(db, campaign_id, current_user.organization_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    stage = campaign_crud.create_stage(db, stage_data, campaign_id)
    return stage


@router.patch("/stages/{stage_id}", response_model=CampaignStageResponse)
def update_stage(
    stage_id: UUID,
    stage_data: CampaignStageUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CampaignStageResponse:
    """Update a campaign stage."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    stage = campaign_crud.get_stage_by_id(db, stage_id)
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found",
        )

    return campaign_crud.update_stage(db, stage, stage_data)


@router.delete("/stages/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stage(
    stage_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a campaign stage."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    stage = campaign_crud.get_stage_by_id(db, stage_id)
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found",
        )

    campaign_crud.delete_stage(db, stage)


# ============== STAGE ACTIONS ==============

@router.post("/stages/{stage_id}/actions", response_model=StageActionResponse, status_code=status.HTTP_201_CREATED)
def create_action(
    stage_id: UUID,
    action_data: StageActionCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StageActionResponse:
    """Create a new action for a stage."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    stage = campaign_crud.get_stage_by_id(db, stage_id)
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found",
        )

    action = campaign_crud.create_action(db, action_data, stage_id)
    return action


@router.patch("/actions/{action_id}", response_model=StageActionResponse)
def update_action(
    action_id: UUID,
    action_data: StageActionUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StageActionResponse:
    """Update a stage action."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    action = campaign_crud.get_action_by_id(db, action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    return campaign_crud.update_action(db, action, action_data)


@router.delete("/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action(
    action_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a stage action."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    action = campaign_crud.get_action_by_id(db, action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action not found",
        )

    campaign_crud.delete_action(db, action)
