import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import String, Date, Numeric, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.debtor import Debtor
    from app.models.payment import PaymentAllocation


class InvoiceStatus(str, PyEnum):
    """Invoice status enum."""
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class Invoice(Base):
    """Invoice model."""
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        nullable=False,
    )
    debtor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("debtors.id"),
        nullable=False,
    )
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        comment="Original amount",
    )
    balance: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        comment="Pending amount (updated with payments)",
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="ARS",
        server_default="ARS",
    )
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status", create_type=True),
        default=InvoiceStatus.PENDING,
    )
    file_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Link to PDF if uploaded",
    )
    erp_metadata: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Extra data from ERP",
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization")
    debtor: Mapped["Debtor"] = relationship(
        "Debtor",
        back_populates="invoices",
    )
    payment_allocations: Mapped[list["PaymentAllocation"]] = relationship(
        "PaymentAllocation",
        back_populates="invoice",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Invoice(id={self.id}, number={self.invoice_number})>"
