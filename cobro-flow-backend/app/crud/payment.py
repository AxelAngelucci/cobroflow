from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.payment import Payment
from app.schemas.payment import PaymentUpdate


def get_payment_by_id(db: Session, payment_id: UUID, organization_id: UUID) -> Payment | None:
    """Get a payment by ID within an organization."""
    stmt = (
        select(Payment)
        .options(joinedload(Payment.allocations))
        .where(
            Payment.id == payment_id,
            Payment.organization_id == organization_id,
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def get_payments(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    debtor_id: UUID | None = None,
) -> tuple[list[Payment], int]:
    """Get paginated list of payments for an organization."""
    stmt = select(Payment).where(Payment.organization_id == organization_id)
    
    if debtor_id:
        stmt = stmt.where(Payment.debtor_id == debtor_id)
    
    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0
    
    # Get paginated results with allocations
    stmt = (
        stmt
        .options(joinedload(Payment.allocations))
        .order_by(Payment.payment_date.desc())
        .offset(skip)
        .limit(limit)
    )
    payments = list(db.execute(stmt).unique().scalars().all())
    
    return payments, total


# Note: apply_payment (create + allocations + invoice balance update) and
# reverse_payment (restore balances + reopen invoices) live in
# services/payment_service.py — import from there when those operations are needed.


def update_payment(db: Session, payment: Payment, payment_data: PaymentUpdate) -> Payment:
    """Update a payment."""
    update_data = payment_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(payment, field, value)

    db.commit()
    db.refresh(payment)
    return payment
