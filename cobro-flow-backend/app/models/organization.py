import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.debtor import Debtor


class IndustryType(str, PyEnum):
    """Industry type enum."""
    RETAIL = "retail"
    SERVICES = "services"
    MANUFACTURING = "manufacturing"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    TECHNOLOGY = "technology"
    FINANCE = "finance"
    REAL_ESTATE = "real_estate"
    HOSPITALITY = "hospitality"
    OTHER = "other"


class CompanySize(str, PyEnum):
    """Company size enum."""
    MICRO = "micro"          # 1-10 employees
    SMALL = "small"          # 11-50 employees
    MEDIUM = "medium"        # 51-200 employees
    LARGE = "large"          # 201-1000 employees
    ENTERPRISE = "enterprise"  # 1000+ employees


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cuit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    industry_type: Mapped[IndustryType | None] = mapped_column(
        Enum(IndustryType, name="industry_type", create_type=True),
        nullable=True,
    )
    company_size: Mapped[CompanySize | None] = mapped_column(
        Enum(CompanySize, name="company_size", create_type=True),
        nullable=True,
    )
    monthly_collection_volume: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Estimated monthly collection volume in ARS",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    settings: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        server_default="{}",
    )

    # Relationships
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    debtors: Mapped[list["Debtor"]] = relationship(
        "Debtor",
        back_populates="organization",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name={self.name})>"
