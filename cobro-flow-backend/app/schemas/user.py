from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base schema for user."""
    email: EmailStr
    full_name: str | None = None
    role: UserRole = UserRole.AGENT


class UserCreate(UserBase):
    """Schema for creating a user."""
    organization_id: UUID | None = None
    auth_id: str | None = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: EmailStr | None = None
    full_name: str | None = None
    role: UserRole | None = None
    organization_id: UUID | None = None
    auth_id: str | None = None


class UserResponse(UserBase):
    """Schema for user response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    organization_id: UUID | None
    auth_id: str | None
    created_at: datetime
