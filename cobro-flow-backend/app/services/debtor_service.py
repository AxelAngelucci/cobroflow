"""Debtor business logic service.

Encapsulates domain rules that go beyond simple DB access:
- Status calculation (pure function, no DB)
- Enriched debtor listing that combines the query result with status derivation
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func, case
from sqlalchemy.orm import Session

from app.models.debtor import Debtor
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.debtor import DebtorWithStats, DebtorStatus


def calculate_debtor_status(
    overdue_amount: Decimal,
    total_debt: Decimal,
    overdue_invoices: int,
    risk_score: int | None,
) -> DebtorStatus:
    """Calculate debtor status based on overdue amount and risk score.

    Pure function — no DB access.
    """
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


def get_debtors_enriched(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
) -> tuple[list[DebtorWithStats], int]:
    """Return paginated debtors with aggregated invoice stats and derived status.

    Replaces the former ``crud.debtor.get_debtors_with_stats``.
    The raw invoice aggregation query lives here; status derivation is
    delegated to ``calculate_debtor_status``.
    """
    # Subquery for invoice stats per debtor
    invoice_stats = (
        select(
            Invoice.debtor_id,
            func.coalesce(func.sum(Invoice.balance), 0).label("total_debt"),
            func.coalesce(
                func.sum(
                    case(
                        (Invoice.status == InvoiceStatus.OVERDUE, Invoice.balance),
                        else_=0,
                    )
                ),
                0,
            ).label("overdue_amount"),
            func.count(Invoice.id).label("total_invoices"),
            func.coalesce(
                func.sum(
                    case(
                        (Invoice.status == InvoiceStatus.OVERDUE, 1),
                        else_=0,
                    )
                ),
                0,
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
            Debtor.name.ilike(search_filter)
            | Debtor.email.ilike(search_filter)
            | Debtor.tax_id.ilike(search_filter)
        )

    # Count total (separate query)
    count_stmt = select(func.count(Debtor.id)).where(
        Debtor.organization_id == organization_id
    )
    if search:
        search_filter = f"%{search}%"
        count_stmt = count_stmt.where(
            Debtor.name.ilike(search_filter)
            | Debtor.email.ilike(search_filter)
            | Debtor.tax_id.ilike(search_filter)
        )
    total = db.execute(count_stmt).scalar() or 0

    # Paginated results ordered by total_debt desc
    stmt = stmt.order_by(
        func.coalesce(invoice_stats.c.total_debt, 0).desc()
    ).offset(skip).limit(limit)

    results = db.execute(stmt).all()

    debtors_with_stats: list[DebtorWithStats] = []
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
