"""Dashboard summary endpoint — returns KPIs, chart data, and activity for the organization."""

import logging
from datetime import date, datetime, timezone, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.db.session import get_db, DBSession
from app.models.communication import CommunicationLog
from app.models.debtor import Debtor
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.schemas.dashboard import (
    DashboardActivityItem,
    DashboardAttentionItem,
    DashboardChannelEffectiveness,
    DashboardChartPoint,
    DashboardKpi,
    DashboardSummaryResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Spanish month abbreviations (1-indexed)
_MONTH_NAMES = {
    1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr",
    5: "May", 6: "Jun", 7: "Jul", 8: "Ago",
    9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic",
}


def _pct_change(current: float, previous: float) -> float:
    """Calculate percentage change vs previous value. Returns 0.0 if no previous data."""
    if previous == 0:
        return 0.0
    return round(((current - previous) / previous) * 100, 2)


def _format_currency(value: float) -> str:
    """Format a number as currency string: $1,247,890."""
    return f"${value:,.0f}"


def _format_pct(value: float) -> str:
    """Format a number as percentage string: 73.4%."""
    return f"{value:.1f}%"


def _current_month_range() -> tuple[datetime, datetime]:
    today = datetime.now(timezone.utc)
    start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # first day of next month
    if today.month == 12:
        end = today.replace(year=today.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        end = today.replace(month=today.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return start, end


def _prev_month_range() -> tuple[datetime, datetime]:
    today = datetime.now(timezone.utc)
    end = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if today.month == 1:
        start = end.replace(year=today.year - 1, month=12)
    else:
        start = end.replace(month=today.month - 1)
    return start, end


# ---------------------------------------------------------------------------
# KPI helpers
# ---------------------------------------------------------------------------

def _kpi_total_receivable(db: Session, org_id: UUID) -> tuple[float, float]:
    """SUM of balance where status != paid — current and previous month are not
    time-scoped (it's a snapshot of the ledger). We compute the diff as the
    change in total balance from last month-start to now.

    For simplicity: current = now, previous = balance of invoices created
    before the start of this month (rough proxy for month-over-month change).
    """
    # Current total outstanding balance (all time, unpaid/overdue/pending)
    stmt_current = select(func.coalesce(func.sum(Invoice.balance), 0)).where(
        Invoice.organization_id == org_id,
        Invoice.status.notin_([InvoiceStatus.PAID, InvoiceStatus.CANCELLED]),
    )
    current = float(db.execute(stmt_current).scalar_one())

    # Previous: same but only invoices created before this month start
    month_start, _ = _current_month_range()
    stmt_prev = select(func.coalesce(func.sum(Invoice.balance), 0)).where(
        Invoice.organization_id == org_id,
        Invoice.status.notin_([InvoiceStatus.PAID, InvoiceStatus.CANCELLED]),
        Invoice.due_date < month_start.date(),
    )
    previous = float(db.execute(stmt_prev).scalar_one())

    return current, previous


def _kpi_overdue(db: Session, org_id: UUID) -> tuple[float, float]:
    """SUM of balance where due_date < today and status not paid."""
    today = date.today()
    stmt = select(func.coalesce(func.sum(Invoice.balance), 0)).where(
        Invoice.organization_id == org_id,
        Invoice.status.notin_([InvoiceStatus.PAID, InvoiceStatus.CANCELLED]),
        Invoice.due_date < today,
    )
    current = float(db.execute(stmt).scalar_one())

    # Previous month: overdue as of last month's last day
    month_start, _ = _current_month_range()
    prev_day = (month_start - timedelta(days=1)).date()
    stmt_prev = select(func.coalesce(func.sum(Invoice.balance), 0)).where(
        Invoice.organization_id == org_id,
        Invoice.status.notin_([InvoiceStatus.PAID, InvoiceStatus.CANCELLED]),
        Invoice.due_date < prev_day,
    )
    previous = float(db.execute(stmt_prev).scalar_one())

    return current, previous


def _kpi_paid_this_month(db: Session, org_id: UUID) -> tuple[float, float]:
    """SUM of payments.amount in current month vs previous month."""
    cur_start, cur_end = _current_month_range()
    stmt_cur = select(func.coalesce(func.sum(Payment.amount), 0)).where(
        Payment.organization_id == org_id,
        Payment.payment_date >= cur_start,
        Payment.payment_date < cur_end,
    )
    current = float(db.execute(stmt_cur).scalar_one())

    prev_start, prev_end = _prev_month_range()
    stmt_prev = select(func.coalesce(func.sum(Payment.amount), 0)).where(
        Payment.organization_id == org_id,
        Payment.payment_date >= prev_start,
        Payment.payment_date < prev_end,
    )
    previous = float(db.execute(stmt_prev).scalar_one())

    return current, previous


def _kpi_recovery_rate(db: Session, org_id: UUID) -> tuple[float, float]:
    """(paid_this_month / billed_this_month) * 100. Returns (current, previous)."""
    cur_start, cur_end = _current_month_range()

    # Billed this month = SUM(amount) of invoices with issue_date in current month
    stmt_billed_cur = select(func.coalesce(func.sum(Invoice.amount), 0)).where(
        Invoice.organization_id == org_id,
        Invoice.due_date >= cur_start.date(),
        Invoice.due_date < cur_end.date(),
    )
    billed_cur = float(db.execute(stmt_billed_cur).scalar_one())

    paid_cur, paid_prev = _kpi_paid_this_month(db, org_id)

    try:
        current = round((paid_cur / billed_cur) * 100, 2) if billed_cur > 0 else 0.0
    except ZeroDivisionError:
        current = 0.0

    # Previous month
    prev_start, prev_end = _prev_month_range()
    stmt_billed_prev = select(func.coalesce(func.sum(Invoice.amount), 0)).where(
        Invoice.organization_id == org_id,
        Invoice.due_date >= prev_start.date(),
        Invoice.due_date < prev_end.date(),
    )
    billed_prev = float(db.execute(stmt_billed_prev).scalar_one())

    try:
        previous = round((paid_prev / billed_prev) * 100, 2) if billed_prev > 0 else 0.0
    except ZeroDivisionError:
        previous = 0.0

    return current, previous


# ---------------------------------------------------------------------------
# Chart data helper
# ---------------------------------------------------------------------------

def _chart_data(db: Session, org_id: UUID) -> list[DashboardChartPoint]:
    """Last 6 months of billed (invoice.amount) and collected (payments.amount)."""
    today = datetime.now(timezone.utc)
    points: list[DashboardChartPoint] = []

    for i in range(5, -1, -1):
        # Calculate year/month for this slot
        total_months = today.month - 1 - i
        year = today.year + total_months // 12
        month = total_months % 12 + 1
        if total_months < 0:
            year = today.year - 1
            month = 12 + (today.month - i)
            if month <= 0:
                month += 12
                year -= 1

        # Recompute correctly: subtract i months from current
        month_ref = today.replace(day=1) - timedelta(days=1)
        # Walk back i months from start of current month
        cur_month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        target_dt = cur_month_start
        for _ in range(i):
            target_dt = (target_dt - timedelta(days=1)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )

        target_year = target_dt.year
        target_month = target_dt.month

        # Next month boundary
        if target_month == 12:
            next_month_dt = target_dt.replace(year=target_year + 1, month=1)
        else:
            next_month_dt = target_dt.replace(month=target_month + 1)

        # Billed: SUM(invoice.amount) where due_date in [target_dt, next_month_dt)
        stmt_billed = select(func.coalesce(func.sum(Invoice.amount), 0)).where(
            Invoice.organization_id == org_id,
            Invoice.due_date >= target_dt.date(),
            Invoice.due_date < next_month_dt.date(),
        )
        billed = float(db.execute(stmt_billed).scalar_one())

        # Collected: SUM(payment.amount) where payment_date in [target_dt, next_month_dt)
        stmt_collected = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.organization_id == org_id,
            Payment.payment_date >= target_dt,
            Payment.payment_date < next_month_dt,
        )
        collected = float(db.execute(stmt_collected).scalar_one())

        points.append(DashboardChartPoint(
            month=_MONTH_NAMES[target_month],
            billed=billed,
            collected=collected,
        ))

    return points


# ---------------------------------------------------------------------------
# Channel effectiveness
# ---------------------------------------------------------------------------

def _channel_effectiveness(db: Session, org_id: UUID) -> list[DashboardChannelEffectiveness]:
    """Count communication_logs by channel in the last 30 days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    stmt = (
        select(CommunicationLog.channel, func.count(CommunicationLog.id).label("cnt"))
        .where(
            CommunicationLog.organization_id == org_id,
            CommunicationLog.created_at >= cutoff,
        )
        .group_by(CommunicationLog.channel)
    )
    rows = db.execute(stmt).all()

    if not rows:
        return []

    total = sum(r.cnt for r in rows)
    return [
        DashboardChannelEffectiveness(
            channel=str(r.channel.value) if hasattr(r.channel, "value") else str(r.channel),
            percentage=round((r.cnt / total) * 100, 1) if total > 0 else 0.0,
            count=r.cnt,
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Attention items
# ---------------------------------------------------------------------------

def _attention_items(db: Session, org_id: UUID) -> list[DashboardAttentionItem]:
    """Debtors with invoices overdue > 30 days or risk_score > 70."""
    items: list[DashboardAttentionItem] = []
    cutoff_date = date.today() - timedelta(days=30)

    # Overdue > 30 days: get distinct debtors with overdue invoices
    stmt_overdue = (
        select(Debtor.id, Debtor.name, func.sum(Invoice.balance).label("total_overdue"))
        .join(Invoice, Invoice.debtor_id == Debtor.id)
        .where(
            Debtor.organization_id == org_id,
            Invoice.organization_id == org_id,
            Invoice.status.notin_([InvoiceStatus.PAID, InvoiceStatus.CANCELLED]),
            Invoice.due_date < cutoff_date,
        )
        .group_by(Debtor.id, Debtor.name)
        .order_by(func.sum(Invoice.balance).desc())
        .limit(7)
    )
    overdue_rows = db.execute(stmt_overdue).all()

    for row in overdue_rows:
        items.append(DashboardAttentionItem(
            id=str(row.id),
            type="overdue",
            title=f"Factura vencida: {row.name}",
            description=f"Deuda vencida hace más de 30 días por {_format_currency(float(row.total_overdue))}",
            priority="high",
            client_id=str(row.id),
        ))

    # High risk_score (> 70), not already in the list
    existing_ids = {item.client_id for item in items}
    remaining = max(0, 10 - len(items))

    if remaining > 0:
        stmt_risk = (
            select(Debtor.id, Debtor.name, Debtor.risk_score)
            .where(
                Debtor.organization_id == org_id,
                Debtor.risk_score > 70,
                Debtor.id.notin_([UUID(eid) for eid in existing_ids]) if existing_ids else True,
            )
            .order_by(Debtor.risk_score.desc())
            .limit(remaining)
        )
        risk_rows = db.execute(stmt_risk).all()

        for row in risk_rows:
            items.append(DashboardAttentionItem(
                id=str(row.id),
                type="risk",
                title=f"Alto riesgo: {row.name}",
                description=f"Score de riesgo: {row.risk_score}/100",
                priority="high",
                client_id=str(row.id),
            ))

    return items[:10]


# ---------------------------------------------------------------------------
# Activity items
# ---------------------------------------------------------------------------

def _activity_items(db: Session, org_id: UUID) -> list[DashboardActivityItem]:
    """Last 10 communication_logs with debtor name."""
    stmt = (
        select(
            CommunicationLog.id,
            CommunicationLog.channel,
            CommunicationLog.status,
            CommunicationLog.created_at,
            CommunicationLog.direction,
            Debtor.name.label("debtor_name"),
        )
        .join(Debtor, Debtor.id == CommunicationLog.debtor_id)
        .where(CommunicationLog.organization_id == org_id)
        .order_by(CommunicationLog.created_at.desc())
        .limit(10)
    )
    rows = db.execute(stmt).all()

    return [
        DashboardActivityItem(
            id=str(row.id),
            client_name=row.debtor_name,
            action=f"Comunicación {str(row.direction.value) if hasattr(row.direction, 'value') else str(row.direction)}",
            channel=str(row.channel.value) if hasattr(row.channel, "value") else str(row.channel),
            timestamp=row.created_at,
            status=str(row.status.value) if hasattr(row.status, "value") else str(row.status),
        )
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: CurrentUser,
    db: DBSession,
) -> DashboardSummaryResponse:
    """Return dashboard KPIs, chart data, channel effectiveness, attention items, and activity."""
    org_id: UUID = current_user.organization_id

    # --- KPIs ---
    total_rec_cur, total_rec_prev = _kpi_total_receivable(db, org_id)
    overdue_cur, overdue_prev = _kpi_overdue(db, org_id)
    paid_cur, paid_prev = _kpi_paid_this_month(db, org_id)
    rate_cur, rate_prev = _kpi_recovery_rate(db, org_id)

    kpis: list[DashboardKpi] = [
        DashboardKpi(
            id="total_receivable",
            label="Total por Cobrar",
            value=_format_currency(total_rec_cur),
            change=_pct_change(total_rec_cur, total_rec_prev),
            change_positive=total_rec_cur <= total_rec_prev,  # less receivable is better
        ),
        DashboardKpi(
            id="overdue",
            label="Monto Vencido",
            value=_format_currency(overdue_cur),
            change=_pct_change(overdue_cur, overdue_prev),
            change_positive=overdue_cur <= overdue_prev,  # less overdue is better
        ),
        DashboardKpi(
            id="paid_this_month",
            label="Pagado este Mes",
            value=_format_currency(paid_cur),
            change=_pct_change(paid_cur, paid_prev),
            change_positive=paid_cur >= paid_prev,  # more paid is better
        ),
        DashboardKpi(
            id="recovery_rate",
            label="Tasa de Recuperación",
            value=_format_pct(rate_cur),
            change=_pct_change(rate_cur, rate_prev),
            change_positive=rate_cur >= rate_prev,
        ),
    ]

    return DashboardSummaryResponse(
        kpis=kpis,
        chart_data=_chart_data(db, org_id),
        channel_effectiveness=_channel_effectiveness(db, org_id),
        attention_items=_attention_items(db, org_id),
        activity_items=_activity_items(db, org_id),
    )
