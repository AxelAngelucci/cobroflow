"""Payment business logic service.

Encapsulates operations that span multiple domain entities (Payment + Invoice),
keeping the CRUD layer focused on simple insert/select/delete without Invoice
side-effects.
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment, PaymentAllocation
from app.schemas.payment import PaymentCreate


def apply_payment(db: Session, payment_data: PaymentCreate, organization_id: UUID) -> Payment:
    """Create a payment record and apply allocations to invoice balances.

    For each allocation:
    - Creates a ``PaymentAllocation`` row.
    - Reduces the related ``Invoice.balance`` by the allocated amount.
    - Marks the invoice as PAID when its balance reaches zero.

    All changes are committed in a single transaction.
    """
    data = payment_data.model_dump(exclude={"allocations"})
    allocations_data = payment_data.allocations or []

    payment = Payment(
        organization_id=organization_id,
        **data,
    )
    db.add(payment)
    db.flush()  # Obtain payment ID before creating allocations

    for allocation in allocations_data:
        payment_allocation = PaymentAllocation(
            payment_id=payment.id,
            invoice_id=allocation.invoice_id,
            amount_allocated=allocation.amount_allocated,
        )
        db.add(payment_allocation)

        invoice = db.execute(
            select(Invoice).where(Invoice.id == allocation.invoice_id)
        ).scalar_one_or_none()

        if invoice:
            invoice.balance = invoice.balance - allocation.amount_allocated

            # Mark as fully paid when balance reaches or falls below zero
            if invoice.balance <= Decimal("0"):
                invoice.balance = Decimal("0")
                invoice.status = InvoiceStatus.PAID

    db.commit()
    db.refresh(payment)
    return payment


def reverse_payment(db: Session, payment: Payment) -> None:
    """Reverse a payment, restoring invoice balances and reopening paid invoices.

    Deletes the payment record after restoring all affected invoices.
    All changes are committed in a single transaction.
    """
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
