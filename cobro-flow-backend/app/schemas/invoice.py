from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.invoice import InvoiceStatus


class InvoiceBase(BaseModel):
    """Base schema for invoice."""
    invoice_number: str = Field(..., max_length=100)
    issue_date: date
    due_date: date
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field(default="ARS", max_length=3)
    file_url: str | None = None
    erp_metadata: dict | None = None


class InvoiceCreate(InvoiceBase):
    """Schema for creating an invoice."""
    debtor_id: UUID
    balance: Decimal | None = None  # If not provided, defaults to amount


class InvoiceBulkCreate(BaseModel):
    """Schema for bulk creating invoices for a debtor."""
    debtor_id: UUID
    invoices: list[InvoiceBase]


class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice."""
    invoice_number: str | None = Field(None, max_length=100)
    issue_date: date | None = None
    due_date: date | None = None
    amount: Decimal | None = Field(None, gt=0, decimal_places=2)
    balance: Decimal | None = Field(None, ge=0, decimal_places=2)
    currency: str | None = Field(None, max_length=3)
    status: InvoiceStatus | None = None
    file_url: str | None = None
    erp_metadata: dict | None = None


class InvoiceResponse(InvoiceBase):
    """Schema for invoice response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    organization_id: UUID
    debtor_id: UUID
    balance: Decimal
    status: InvoiceStatus


class InvoiceWithDebtor(InvoiceResponse):
    """Schema for invoice with debtor info."""
    debtor_name: str | None = None


class InvoiceListResponse(BaseModel):
    """Schema for paginated invoice list."""
    items: list[InvoiceResponse]
    total: int
    page: int
    size: int
