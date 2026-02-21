from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceBase


def get_invoice_by_id(db: Session, invoice_id: UUID, organization_id: UUID) -> Invoice | None:
    """Get an invoice by ID within an organization."""
    stmt = select(Invoice).where(
        Invoice.id == invoice_id,
        Invoice.organization_id == organization_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_invoices(
    db: Session,
    organization_id: UUID,
    skip: int = 0,
    limit: int = 20,
    debtor_id: UUID | None = None,
    status: InvoiceStatus | None = None,
) -> tuple[list[Invoice], int]:
    """Get paginated list of invoices for an organization."""
    stmt = select(Invoice).where(Invoice.organization_id == organization_id)
    
    if debtor_id:
        stmt = stmt.where(Invoice.debtor_id == debtor_id)
    
    if status:
        stmt = stmt.where(Invoice.status == status)
    
    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0
    
    # Get paginated results
    stmt = stmt.order_by(Invoice.due_date.desc()).offset(skip).limit(limit)
    invoices = list(db.execute(stmt).scalars().all())
    
    return invoices, total


def get_invoices_by_debtor(db: Session, debtor_id: UUID, organization_id: UUID) -> list[Invoice]:
    """Get all invoices for a debtor."""
    stmt = select(Invoice).where(
        Invoice.debtor_id == debtor_id,
        Invoice.organization_id == organization_id,
    ).order_by(Invoice.due_date.desc())
    return list(db.execute(stmt).scalars().all())


def create_invoice(db: Session, invoice_data: InvoiceCreate, organization_id: UUID) -> Invoice:
    """Create a new invoice."""
    data = invoice_data.model_dump()
    
    # If balance not provided, set it to amount
    if data.get("balance") is None:
        data["balance"] = data["amount"]
    
    invoice = Invoice(
        organization_id=organization_id,
        **data,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def create_invoices_bulk(
    db: Session,
    invoices_data: list[InvoiceBase],
    debtor_id: UUID,
    organization_id: UUID,
) -> list[Invoice]:
    """Create multiple invoices for a debtor."""
    invoices = []
    
    for invoice_data in invoices_data:
        data = invoice_data.model_dump()
        invoice = Invoice(
            organization_id=organization_id,
            debtor_id=debtor_id,
            balance=data["amount"],  # Default balance to amount
            **data,
        )
        db.add(invoice)
        invoices.append(invoice)
    
    db.commit()
    
    for invoice in invoices:
        db.refresh(invoice)
    
    return invoices


def update_invoice(db: Session, invoice: Invoice, invoice_data: InvoiceUpdate) -> Invoice:
    """Update an invoice."""
    update_data = invoice_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    db.commit()
    db.refresh(invoice)
    return invoice


def delete_invoice(db: Session, invoice: Invoice) -> None:
    """Delete an invoice."""
    db.delete(invoice)
    db.commit()
