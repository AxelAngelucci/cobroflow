import csv
import io
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.crud import debtor as debtor_crud
from app.crud import invoice as invoice_crud
from app.crud import payment as payment_crud
from app.db.session import get_db
from app.models.invoice import InvoiceStatus
from app.schemas.debtor import (
    DebtorCreate,
    DebtorUpdate,
    DebtorResponse,
    DebtorListResponse,
    DebtorImportRow,
    DebtorImportError,
    DebtorImportResponse,
)
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceBulkCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceListResponse,
)
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
)

router = APIRouter()


# ============== IMPORT ==============

IMPORT_TEMPLATE_COLUMNS = ["nombre", "email", "telefono", "cuit", "erp_id", "tags"]


@router.get("/import/template")
def download_import_template(current_user: CurrentUser) -> StreamingResponse:
    """Download a CSV template for bulk client import."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(IMPORT_TEMPLATE_COLUMNS)
    writer.writerow(["Distribuidora Norte S.A.", "contacto@empresa.com", "+54 11 4555-1234", "30-71234567-9", "SAP-001", "VIP,Mayorista"])
    writer.writerow(["Comercio Sur S.R.L.", "info@comerciosur.com", "+54 11 4555-5678", "30-98765432-1", "", "Minorista"])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plantilla_importacion_clientes.csv"},
    )


@router.post("/import", response_model=DebtorImportResponse, status_code=status.HTTP_201_CREATED)
async def import_clients(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> DebtorImportResponse:
    """
    Bulk import clients from a CSV file.

    Expected columns: nombre, email, telefono, cuit, erp_id, tags
    The 'tags' column accepts comma-separated values.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted",
        )

    content = await file.read()

    # Try UTF-8 first, then latin-1
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    valid_rows: list[DebtorCreate] = []
    errors: list[DebtorImportError] = []
    skipped = 0

    for row_num, row in enumerate(reader, start=2):  # row 1 is header
        # Normalize column names (strip whitespace, lowercase)
        normalized = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}

        name = normalized.get("nombre", "")
        if not name:
            skipped += 1
            continue

        # Parse tags
        tags_str = normalized.get("tags", "")
        tags = [t.strip() for t in tags_str.split(",") if t.strip()] if tags_str else None

        try:
            import_row = DebtorImportRow(
                name=name,
                email=normalized.get("email") or None,
                phone=normalized.get("telefono") or None,
                tax_id=normalized.get("cuit") or None,
                erp_id=normalized.get("erp_id") or None,
                tags=tags_str or None,
            )

            debtor_create = DebtorCreate(
                name=import_row.name,
                email=import_row.email,
                phone=import_row.phone,
                tax_id=import_row.tax_id,
                erp_id=import_row.erp_id,
                tags=tags,
            )
            valid_rows.append(debtor_create)

        except ValidationError as e:
            for err in e.errors():
                errors.append(DebtorImportError(
                    row=row_num,
                    field=str(err.get("loc", [""])[0]),
                    message=err.get("msg", "Validation error"),
                ))

    # Bulk create valid rows
    if valid_rows:
        debtor_crud.create_debtors_bulk(db, valid_rows, current_user.organization_id)

    return DebtorImportResponse(
        imported=len(valid_rows),
        skipped=skipped,
        errors=errors,
    )


# ============== DEBTORS (Clients) ==============

@router.post("/", response_model=DebtorResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    debtor_data: DebtorCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> DebtorResponse:
    """Create a new client/debtor."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    debtor = debtor_crud.create_debtor(db, debtor_data, current_user.organization_id)
    return debtor


@router.get("/", response_model=DebtorListResponse)
def get_clients(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
) -> DebtorListResponse:
    """
    Get paginated list of clients/debtors with aggregated stats.
    
    Returns clients ordered by total debt (highest first) with:
    - total_debt: Sum of all invoice balances
    - overdue_amount: Sum of overdue invoice balances
    - total_invoices: Total invoice count
    - overdue_invoices: Overdue invoice count
    - status: Calculated status (healthy, at_risk, critical, blocked)
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    skip = (page - 1) * size
    debtors, total = debtor_crud.get_debtors_with_stats(
        db, current_user.organization_id, skip=skip, limit=size, search=search
    )
    
    return DebtorListResponse(items=debtors, total=total, page=page, size=size)


@router.get("/{client_id}", response_model=DebtorResponse)
def get_client(
    client_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> DebtorResponse:
    """Get a specific client/debtor by ID."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    return debtor


@router.patch("/{client_id}", response_model=DebtorResponse)
def update_client(
    client_id: UUID,
    debtor_data: DebtorUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> DebtorResponse:
    """Update a client/debtor."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    return debtor_crud.update_debtor(db, debtor, debtor_data)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a client/debtor."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    debtor_crud.delete_debtor(db, debtor)


# ============== INVOICES ==============

@router.post("/{client_id}/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    client_id: UUID,
    invoice_data: InvoiceCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> InvoiceResponse:
    """Create a new invoice for a client."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    # Verify client exists
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Override debtor_id with path parameter
    invoice_data.debtor_id = client_id
    
    invoice = invoice_crud.create_invoice(db, invoice_data, current_user.organization_id)
    return invoice


@router.post("/{client_id}/invoices/bulk", response_model=list[InvoiceResponse], status_code=status.HTTP_201_CREATED)
def create_invoices_bulk(
    client_id: UUID,
    bulk_data: InvoiceBulkCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[InvoiceResponse]:
    """Create multiple invoices for a client in bulk."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    # Verify client exists
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    invoices = invoice_crud.create_invoices_bulk(
        db, bulk_data.invoices, client_id, current_user.organization_id
    )
    return invoices


@router.get("/{client_id}/invoices", response_model=InvoiceListResponse)
def get_client_invoices(
    client_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: InvoiceStatus | None = Query(None),
) -> InvoiceListResponse:
    """Get paginated list of invoices for a client."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    # Verify client exists
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    skip = (page - 1) * size
    invoices, total = invoice_crud.get_invoices(
        db, current_user.organization_id,
        skip=skip, limit=size, debtor_id=client_id, status=status
    )
    
    return InvoiceListResponse(items=invoices, total=total, page=page, size=size)


@router.patch("/invoices/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> InvoiceResponse:
    """Update an invoice."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    invoice = invoice_crud.get_invoice_by_id(db, invoice_id, current_user.organization_id)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    
    return invoice_crud.update_invoice(db, invoice, invoice_data)


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete an invoice."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    invoice = invoice_crud.get_invoice_by_id(db, invoice_id, current_user.organization_id)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    
    invoice_crud.delete_invoice(db, invoice)


# ============== PAYMENTS ==============

@router.post("/{client_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    client_id: UUID,
    payment_data: PaymentCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> PaymentResponse:
    """
    Create a payment for a client.
    
    Optionally allocate the payment to specific invoices.
    When allocated, invoice balances are automatically updated.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    # Verify client exists
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Override debtor_id with path parameter
    payment_data.debtor_id = client_id
    
    payment = payment_crud.create_payment(db, payment_data, current_user.organization_id)
    return payment


@router.get("/{client_id}/payments", response_model=PaymentListResponse)
def get_client_payments(
    client_id: UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> PaymentListResponse:
    """Get paginated list of payments for a client."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    
    # Verify client exists
    debtor = debtor_crud.get_debtor_by_id(db, client_id, current_user.organization_id)
    if not debtor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    skip = (page - 1) * size
    payments, total = payment_crud.get_payments(
        db, current_user.organization_id, skip=skip, limit=size, debtor_id=client_id
    )
    
    return PaymentListResponse(items=payments, total=total, page=page, size=size)
