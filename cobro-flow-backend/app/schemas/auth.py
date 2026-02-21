from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole
from app.models.organization import IndustryType, CompanySize


class UserRegister(BaseModel):
    """Schema for user registration with organization data."""
    # User fields
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=50)
    password: str = Field(..., min_length=6)
    
    # Organization fields
    company_name: str = Field(..., min_length=2, max_length=255)
    cuit: str = Field(..., min_length=11, max_length=20)
    industry_type: IndustryType
    company_size: CompanySize
    monthly_collection_volume: int = Field(..., gt=0)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    sub: str
    exp: int


class OrganizationResponse(BaseModel):
    """Schema for organization in auth response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    cuit: str | None
    industry_type: IndustryType | None
    company_size: CompanySize | None
    monthly_collection_volume: int | None


class UserAuthResponse(BaseModel):
    """Schema for authenticated user response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: str
    full_name: str | None
    phone: str | None
    role: UserRole
    organization_id: UUID | None
    organization: OrganizationResponse | None = None
