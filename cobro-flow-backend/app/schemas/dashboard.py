from datetime import datetime

from pydantic import BaseModel


class DashboardKpi(BaseModel):
    id: str
    label: str
    value: str  # formatted: "$1,247,890" or "73.4%"
    change: float  # % change vs previous month
    change_positive: bool


class DashboardChartPoint(BaseModel):
    month: str  # "Ene", "Feb", etc.
    billed: float
    collected: float


class DashboardChannelEffectiveness(BaseModel):
    channel: str  # "whatsapp", "email", "sms", "call"
    percentage: float
    count: int


class DashboardAttentionItem(BaseModel):
    id: str
    type: str  # "overdue", "risk", "no_contact"
    title: str
    description: str
    priority: str  # "high", "medium", "low"
    client_id: str


class DashboardActivityItem(BaseModel):
    id: str
    client_name: str
    action: str
    channel: str
    timestamp: datetime
    status: str


class DashboardSummaryResponse(BaseModel):
    kpis: list[DashboardKpi]
    chart_data: list[DashboardChartPoint]  # last 6 months
    channel_effectiveness: list[DashboardChannelEffectiveness]
    attention_items: list[DashboardAttentionItem]  # max 10
    activity_items: list[DashboardActivityItem]  # last 10 activities
