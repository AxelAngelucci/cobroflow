from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DebtorStatus(str, PyEnum):
    """Calculated debtor status based on overdue amount and risk."""
    HEALTHY = "healthy"       # No overdue, low risk
    AT_RISK = "at_risk"       # Some overdue or medium risk
    CRITICAL = "critical"     # High overdue or high risk
    BLOCKED = "blocked"       # Very high risk, should not extend credit


class DebtorBase(BaseModel):
    """Base schema for debtor."""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    tax_id: str | None = Field(None, max_length=50)
    erp_id: str | None = Field(None, max_length=100)
    risk_score: int | None = Field(None, ge=0, le=100)
    tags: list[str] | None = None


class DebtorCreate(DebtorBase):
    """Schema for creating a debtor."""
    pass


class DebtorUpdate(BaseModel):
    """Schema for updating a debtor."""
    name: str | None = Field(None, min_length=2, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    tax_id: str | None = Field(None, max_length=50)
    erp_id: str | None = Field(None, max_length=100)
    risk_score: int | None = Field(None, ge=0, le=100)
    tags: list[str] | None = None


class DebtorResponse(DebtorBase):
    """Schema for debtor response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    organization_id: UUID
    ai_profile_summary: str | None = None
    created_at: datetime


class DebtorStats(BaseModel):
    """Aggregated stats for a debtor."""
    total_debt: Decimal = Decimal("0.00")       # Sum of all invoice balances
    overdue_amount: Decimal = Decimal("0.00")   # Sum of overdue invoice balances
    total_invoices: int = 0                      # Total invoice count
    overdue_invoices: int = 0                    # Overdue invoice count
    status: DebtorStatus = DebtorStatus.HEALTHY  # Calculated status


class DebtorWithStats(DebtorBase):
    """Schema for debtor with aggregated stats."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    organization_id: UUID
    ai_profile_summary: str | None = None
    created_at: datetime
    
    # Aggregated stats
    total_debt: Decimal = Decimal("0.00")
    overdue_amount: Decimal = Decimal("0.00")
    total_invoices: int = 0
    overdue_invoices: int = 0
    status: DebtorStatus = DebtorStatus.HEALTHY


class DebtorListResponse(BaseModel):
    """Schema for paginated debtor list with stats."""
    items: list[DebtorWithStats]
    total: int
    page: int
    size: int


class DebtorImportRow(BaseModel):
    """Schema for a single row in a CSV import."""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    tax_id: str | None = Field(None, max_length=50)
    erp_id: str | None = Field(None, max_length=100)
    tags: str | None = Field(None, description="Comma-separated tags")


class DebtorImportError(BaseModel):
    """Schema for an import error on a specific row."""
    row: int
    field: str | None = None
    message: str


class DebtorImportResponse(BaseModel):
    """Schema for the import result."""
    imported: int
    skipped: int
    errors: list[DebtorImportError]
