from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.debtor import Debtor
from app.schemas.debtor import DebtorCreate, DebtorUpdate


def get_debtor_by_id(db: Session, debtor_id: UUID, organization_id: UUID) -> Debtor | None:
    """Get a debtor by ID within an organization."""
    stmt = select(Debtor).where(
        Debtor.id == debtor_id,
        Debtor.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_debtors(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
) -> tuple[list[Debtor], int]:
    """Get paginated list of debtors for an organization (without stats)."""
    stmt = select(Debtor).where(Debtor.organization_id == organization_id)
    
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            Debtor.name.ilike(search_filter) |
            Debtor.email.ilike(search_filter) |
            Debtor.tax_id.ilike(search_filter)
        )
    
    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0
    
    # Get paginated results
    stmt = stmt.order_by(Debtor.created_at.desc()).offset(skip).limit(limit)
    debtors = list(db.execute(stmt).scalars().all())
    
    return debtors, total


def create_debtor(db: Session, debtor_data: DebtorCreate, organization_id: UUID) -> Debtor:
    """Create a new debtor."""
    debtor = Debtor(
        organization_id=organization_id,
        **debtor_data.model_dump(),
    )
    db.add(debtor)
    db.commit()
    db.refresh(debtor)
    return debtor


def update_debtor(db: Session, debtor: Debtor, debtor_data: DebtorUpdate) -> Debtor:
    """Update a debtor."""
    update_data = debtor_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(debtor, field, value)
    
    db.commit()
    db.refresh(debtor)
    return debtor


def delete_debtor(db: Session, debtor: Debtor) -> None:
    """Delete a debtor."""
    db.delete(debtor)
    db.commit()


def create_debtors_bulk(
    db: Session,
    debtors_data: list[DebtorCreate],
    organization_id: UUID,
) -> list[Debtor]:
    """Create multiple debtors in a single transaction."""
    debtors = []

    for debtor_data in debtors_data:
        debtor = Debtor(
            organization_id=organization_id,
            **debtor_data.model_dump(),
        )
        db.add(debtor)
        debtors.append(debtor)

    db.commit()

    for debtor in debtors:
        db.refresh(debtor)

    return debtors
