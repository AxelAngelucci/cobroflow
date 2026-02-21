from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.payment import Payment, PaymentAllocation
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.payment import PaymentCreate, PaymentUpdate


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


def create_payment(db: Session, payment_data: PaymentCreate, organization_id: UUID) -> Payment:
    """Create a new payment with optional allocations."""
    data = payment_data.model_dump(exclude={"allocations"})
    allocations_data = payment_data.allocations or []
    
    payment = Payment(
        organization_id=organization_id,
        **data,
    )
    db.add(payment)
    db.flush()  # Get payment ID
    
    # Create allocations and update invoice balances
    for allocation in allocations_data:
        # Create allocation
        payment_allocation = PaymentAllocation(
            payment_id=payment.id,
            invoice_id=allocation.invoice_id,
            amount_allocated=allocation.amount_allocated,
        )
        db.add(payment_allocation)
        
        # Update invoice balance
        invoice = db.execute(
            select(Invoice).where(Invoice.id == allocation.invoice_id)
        ).scalar_one_or_none()
        
        if invoice:
            invoice.balance = invoice.balance - allocation.amount_allocated
            
            # Update status if fully paid
            if invoice.balance <= Decimal("0"):
                invoice.balance = Decimal("0")
                invoice.status = InvoiceStatus.PAID
    
    db.commit()
    db.refresh(payment)
    
    return payment


def update_payment(db: Session, payment: Payment, payment_data: PaymentUpdate) -> Payment:
    """Update a payment."""
    update_data = payment_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    db.commit()
    db.refresh(payment)
    return payment


def delete_payment(db: Session, payment: Payment) -> None:
    """Delete a payment and restore invoice balances."""
    # Restore invoice balances for allocations
    for allocation in payment.allocations:
        invoice = db.execute(
            select(Invoice).where(Invoice.id == allocation.invoice_id)
        ).scalar_one_or_none()
        
        if invoice:
            invoice.balance = invoice.balance + allocation.amount_allocated
            if invoice.status == InvoiceStatus.PAID:
                invoice.status = InvoiceStatus.PENDING
    
    db.delete(payment)
    db.commit()
