import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.invoice import Invoice
    from app.models.payment import Payment


class Debtor(Base):
    """Debtor/Client model - represents customers who owe money."""
    __tablename__ = "debtors"

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
    erp_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="External ID from ERP (SAP/QBO)",
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="CUIT/RFC of the client",
    )
    risk_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Risk score 0-100",
    )
    tags: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text),
        nullable=True,
        comment="Tags for segmentation (e.g., VIP, Retail)",
    )
    ai_profile_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="AI-generated summary of debtor behavior",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="debtors",
    )
    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice",
        back_populates="debtor",
        cascade="all, delete-orphan",
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="debtor",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Debtor(id={self.id}, name={self.name})>"
