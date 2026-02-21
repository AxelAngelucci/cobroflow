from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.campaign import Campaign, CampaignStage, StageAction
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignStageCreate,
    CampaignStageUpdate,
    StageActionCreate,
    StageActionUpdate,
)


# ============== Campaigns ==============

def get_campaigns(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
) -> tuple[list[Campaign], int]:
    """Get paginated list of campaigns for an organization."""
    stmt = select(Campaign).where(Campaign.organization_id == organization_id)

    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(Campaign.name.ilike(search_filter))

    if is_active is not None:
        stmt = stmt.where(Campaign.is_active == is_active)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0

    # Get paginated results
    stmt = stmt.order_by(Campaign.created_at.desc()).offset(skip).limit(limit)
    campaigns = list(db.execute(stmt).scalars().all())

    return campaigns, total


def get_campaign_by_id(
    db: Session,
    campaign_id: UUID,
    organization_id: UUID,
) -> Campaign | None:
    """Get a campaign by ID with stages and actions."""
    stmt = (
        select(Campaign)
        .options(
            joinedload(Campaign.stages).joinedload(CampaignStage.actions)
        )
        .where(
            Campaign.id == campaign_id,
            Campaign.organization_id == organization_id,
        )
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def create_campaign(
    db: Session,
    campaign_data: CampaignCreate,
    organization_id: UUID,
) -> Campaign:
    """Create a new campaign with stages and actions."""
    data = campaign_data.model_dump(exclude={"stages"})

    campaign = Campaign(
        organization_id=organization_id,
        **data,
    )
    db.add(campaign)
    db.flush()

    # Create stages with actions
    for stage_data in campaign_data.stages:
        stage = CampaignStage(
            campaign_id=campaign.id,
            name=stage_data.name,
            day_start=stage_data.day_start,
            day_end=stage_data.day_end,
            tone_instructions=stage_data.tone_instructions,
        )
        db.add(stage)
        db.flush()

        for action_data in stage_data.actions:
            action = StageAction(
                stage_id=stage.id,
                **action_data.model_dump(),
            )
            db.add(action)

    db.commit()
    db.refresh(campaign)

    # Re-fetch with eager loading
    return get_campaign_by_id(db, campaign.id, organization_id)  # type: ignore


def update_campaign(
    db: Session,
    campaign: Campaign,
    campaign_data: CampaignUpdate,
) -> Campaign:
    """Update a campaign."""
    update_data = campaign_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)
    return campaign


def delete_campaign(db: Session, campaign: Campaign) -> None:
    """Delete a campaign."""
    db.delete(campaign)
    db.commit()


# ============== Campaign Stages ==============

def get_stage_by_id(db: Session, stage_id: UUID) -> CampaignStage | None:
    """Get a campaign stage by ID with actions."""
    stmt = (
        select(CampaignStage)
        .options(joinedload(CampaignStage.actions))
        .where(CampaignStage.id == stage_id)
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def create_stage(
    db: Session,
    stage_data: CampaignStageCreate,
    campaign_id: UUID,
) -> CampaignStage:
    """Create a new campaign stage with actions."""
    stage = CampaignStage(
        campaign_id=campaign_id,
        name=stage_data.name,
        day_start=stage_data.day_start,
        day_end=stage_data.day_end,
        tone_instructions=stage_data.tone_instructions,
    )
    db.add(stage)
    db.flush()

    for action_data in stage_data.actions:
        action = StageAction(
            stage_id=stage.id,
            **action_data.model_dump(),
        )
        db.add(action)

    db.commit()
    db.refresh(stage)
    return get_stage_by_id(db, stage.id)  # type: ignore


def update_stage(
    db: Session,
    stage: CampaignStage,
    stage_data: CampaignStageUpdate,
) -> CampaignStage:
    """Update a campaign stage."""
    update_data = stage_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(stage, field, value)

    db.commit()
    db.refresh(stage)
    return stage


def delete_stage(db: Session, stage: CampaignStage) -> None:
    """Delete a campaign stage."""
    db.delete(stage)
    db.commit()


# ============== Stage Actions ==============

def get_action_by_id(db: Session, action_id: UUID) -> StageAction | None:
    """Get a stage action by ID."""
    stmt = select(StageAction).where(StageAction.id == action_id)
    return db.execute(stmt).scalar_one_or_none()


def create_action(
    db: Session,
    action_data: StageActionCreate,
    stage_id: UUID,
) -> StageAction:
    """Create a new stage action."""
    action = StageAction(
        stage_id=stage_id,
        **action_data.model_dump(),
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


def update_action(
    db: Session,
    action: StageAction,
    action_data: StageActionUpdate,
) -> StageAction:
    """Update a stage action."""
    update_data = action_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(action, field, value)

    db.commit()
    db.refresh(action)
    return action


def delete_action(db: Session, action: StageAction) -> None:
    """Delete a stage action."""
    db.delete(action)
    db.commit()
