import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.debtor import Debtor
    from app.models.invoice import Invoice


class Payment(Base):
    """Payment model."""
    __tablename__ = "payments"

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
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    method: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Transfer, Check, etc.",
    )
    reference_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    proof_file_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Uploaded receipt",
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization")
    debtor: Mapped["Debtor"] = relationship(
        "Debtor",
        back_populates="payments",
    )
    allocations: Mapped[list["PaymentAllocation"]] = relationship(
        "PaymentAllocation",
        back_populates="payment",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, amount={self.amount})>"


class PaymentAllocation(Base):
    """Payment allocation model - links payments to invoices."""
    __tablename__ = "payment_allocations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payments.id"),
        nullable=False,
    )
    invoice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("invoices.id"),
        nullable=False,
    )
    amount_allocated: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    # Relationships
    payment: Mapped["Payment"] = relationship(
        "Payment",
        back_populates="allocations",
    )
    invoice: Mapped["Invoice"] = relationship(
        "Invoice",
        back_populates="payment_allocations",
    )

    def __repr__(self) -> str:
        return f"<PaymentAllocation(id={self.id}, amount={self.amount_allocated})>"
