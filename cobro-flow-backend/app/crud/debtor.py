from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func, case, and_
from sqlalchemy.orm import Session

from app.models.debtor import Debtor
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.debtor import DebtorCreate, DebtorUpdate, DebtorWithStats, DebtorStatus


def calculate_debtor_status(
    overdue_amount: Decimal,
    total_debt: Decimal,
    overdue_invoices: int,
    risk_score: int | None,
) -> DebtorStatus:
    """Calculate debtor status based on overdue amount and risk score."""
    risk = risk_score or 50  # Default to medium risk if not set
    
    # Calculate overdue ratio
    overdue_ratio = float(overdue_amount / total_debt) if total_debt > 0 else 0
    
    # Blocked: very high risk or too much overdue
    if risk >= 85 or overdue_ratio > 0.8:
        return DebtorStatus.BLOCKED
    
    # Critical: high risk or significant overdue
    if risk >= 70 or overdue_ratio > 0.5 or overdue_invoices >= 5:
        return DebtorStatus.CRITICAL
    
    # At risk: medium risk or some overdue
    if risk >= 50 or overdue_ratio > 0.2 or overdue_invoices >= 2:
        return DebtorStatus.AT_RISK
    
    # Healthy: low risk and no/minimal overdue
    return DebtorStatus.HEALTHY


def get_debtor_by_id(db: Session, debtor_id: UUID, organization_id: UUID) -> Debtor | None:
    """Get a debtor by ID within an organization."""
    stmt = select(Debtor).where(
        Debtor.id == debtor_id,
        Debtor.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_debtors_with_stats(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
) -> tuple[list[DebtorWithStats], int]:
    """Get paginated list of debtors with aggregated stats."""
    
    # Subquery for invoice stats per debtor
    invoice_stats = (
        select(
            Invoice.debtor_id,
            func.coalesce(func.sum(Invoice.balance), 0).label("total_debt"),
            func.coalesce(
                func.sum(
                    case(
                        (Invoice.status == InvoiceStatus.OVERDUE, Invoice.balance),
                        else_=0
                    )
                ), 0
            ).label("overdue_amount"),
            func.count(Invoice.id).label("total_invoices"),
            func.coalesce(
                func.sum(
                    case(
                        (Invoice.status == InvoiceStatus.OVERDUE, 1),
                        else_=0
                    )
                ), 0
            ).label("overdue_invoices"),
        )
        .where(Invoice.organization_id == organization_id)
        .group_by(Invoice.debtor_id)
        .subquery()
    )
    
    # Main query with left join to include debtors without invoices
    stmt = (
        select(
            Debtor,
            func.coalesce(invoice_stats.c.total_debt, 0).label("total_debt"),
            func.coalesce(invoice_stats.c.overdue_amount, 0).label("overdue_amount"),
            func.coalesce(invoice_stats.c.total_invoices, 0).label("total_invoices"),
            func.coalesce(invoice_stats.c.overdue_invoices, 0).label("overdue_invoices"),
        )
        .outerjoin(invoice_stats, Debtor.id == invoice_stats.c.debtor_id)
        .where(Debtor.organization_id == organization_id)
    )
    
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            Debtor.name.ilike(search_filter) |
            Debtor.email.ilike(search_filter) |
            Debtor.tax_id.ilike(search_filter)
        )
    
    # Count total (need a separate count query)
    count_stmt = select(func.count(Debtor.id)).where(
        Debtor.organization_id == organization_id
    )
    if search:
        search_filter = f"%{search}%"
        count_stmt = count_stmt.where(
            Debtor.name.ilike(search_filter) |
            Debtor.email.ilike(search_filter) |
            Debtor.tax_id.ilike(search_filter)
        )
    total = db.execute(count_stmt).scalar() or 0
    
    # Get paginated results ordered by total_debt desc
    stmt = stmt.order_by(
        func.coalesce(invoice_stats.c.total_debt, 0).desc()
    ).offset(skip).limit(limit)
    
    results = db.execute(stmt).all()
    
    # Transform to DebtorWithStats
    debtors_with_stats = []
    for row in results:
        debtor = row[0]
        total_debt = Decimal(str(row[1]))
        overdue_amount = Decimal(str(row[2]))
        total_invoices = int(row[3])
        overdue_invoices = int(row[4])
        
        status = calculate_debtor_status(
            overdue_amount, total_debt, overdue_invoices, debtor.risk_score
        )
        
        debtor_data = DebtorWithStats(
            id=debtor.id,
            organization_id=debtor.organization_id,
            name=debtor.name,
            email=debtor.email,
            phone=debtor.phone,
            tax_id=debtor.tax_id,
            erp_id=debtor.erp_id,
            risk_score=debtor.risk_score,
            tags=debtor.tags,
            ai_profile_summary=debtor.ai_profile_summary,
            created_at=debtor.created_at,
            total_debt=total_debt,
            overdue_amount=overdue_amount,
            total_invoices=total_invoices,
            overdue_invoices=overdue_invoices,
            status=status,
        )
        debtors_with_stats.append(debtor_data)
    
    return debtors_with_stats, total


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
