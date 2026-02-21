from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OrganizationBase(BaseModel):
    """Base schema for organization."""
    name: str
    cuit: str | None = None
    settings: dict = {}


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization."""
    pass


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization."""
    name: str | None = None
    cuit: str | None = None
    settings: dict | None = None


class OrganizationResponse(OrganizationBase):
    """Schema for organization response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
