from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaymentAllocationBase(BaseModel):
    """Base schema for payment allocation."""
    invoice_id: UUID
    amount_allocated: Decimal = Field(..., gt=0, decimal_places=2)


class PaymentBase(BaseModel):
    """Base schema for payment."""
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    method: str | None = Field(None, max_length=50)
    reference_number: str | None = Field(None, max_length=100)
    proof_file_url: str | None = None


class PaymentCreate(PaymentBase):
    """Schema for creating a payment."""
    debtor_id: UUID
    allocations: list[PaymentAllocationBase] | None = None


class PaymentUpdate(BaseModel):
    """Schema for updating a payment."""
    amount: Decimal | None = Field(None, gt=0, decimal_places=2)
    method: str | None = Field(None, max_length=50)
    reference_number: str | None = Field(None, max_length=100)
    proof_file_url: str | None = None


class PaymentAllocationResponse(BaseModel):
    """Schema for payment allocation response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    payment_id: UUID
    invoice_id: UUID
    amount_allocated: Decimal


class PaymentResponse(PaymentBase):
    """Schema for payment response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    organization_id: UUID
    debtor_id: UUID
    payment_date: datetime
    allocations: list[PaymentAllocationResponse] = []


class PaymentListResponse(BaseModel):
    """Schema for paginated payment list."""
    items: list[PaymentResponse]
    total: int
    page: int
    size: int
