"""
Reset + Seed script para CobroFlow.

Borra TODOS los datos de todas las tablas y crea:
  - 1 organización de prueba
  - 1 usuario admin  (admin@cobroflow.test / Admin1234!)
  - 2 deudores de prueba con números reales
  - 1 config de agente IA activa con auto-respond

Uso:
    cd cobro-flow-backend
    python -m scripts.reset_and_seed
"""

from __future__ import annotations

import sys
import uuid
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

# Aseguramos que el root del backend esté en el path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.debtor import Debtor
from app.models.ai_agent import AIAgentConfig, AgentStatus
from app.models.invoice import Invoice, InvoiceStatus

# ── Credenciales del usuario de prueba ─────────────────────────────────
TEST_EMAIL    = "admin@cobroflow.dev"
TEST_PASSWORD = "Admin1234!"
TEST_ORG_NAME = "CobroFlow Test"

# ── Deudores de prueba ──────────────────────────────────────────────────
DEBTORS = [
    {
        "name": "Axel (yo)",
        "email": "axel@test.com",
        "phone": "+5491126636803",   # tu número
    },
    {
        "name": "Deudor Dos",
        "email": "deudor2@test.com",
        "phone": "+5492473500783",   # +54 9 2473 50-0783 normalizado
    },
]

# Tablas en orden inverso de FK para poder truncar sin conflictos
TABLES_IN_ORDER = [
    # AI agent (hijos primero)
    "ai_conversation_messages",
    "ai_conversations",
    "ai_agent_analytics",
    "ai_conversation_examples",
    "ai_business_rules",
    "ai_training_sessions",
    "ai_training_documents",
    "ai_agent_operating_hours",
    "ai_agent_channel_configs",
    "ai_agent_escalation_rules",
    "ai_agent_personalities",
    "ai_agent_configs",
    # Cobranzas
    "campaign_debtors",
    "campaigns",
    "communications",
    "payments",
    "invoices",
    "debtors",
    # Core
    "users",
    "organizations",
]


def truncate_all(db) -> None:
    print("[reset] Borrando datos...")
    for table in TABLES_IN_ORDER:
        try:
            db.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE'))
            print(f"   ok{table}")
        except Exception as e:
            print(f"   WARN{table}: {e}")
            db.rollback()
    db.commit()
    print()


def seed(db) -> None:
    # ── Organización ──
    org_id = uuid.uuid4()
    org = Organization(id=org_id, name=TEST_ORG_NAME)
    db.add(org)
    db.flush()
    print(f"[ok]Organización creada  id={org_id}")

    # ── Usuario admin ──
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        organization_id=org_id,
        email=TEST_EMAIL,
        full_name="Admin Test",
        role=UserRole.ADMIN,
        hashed_password=get_password_hash(TEST_PASSWORD),
    )
    db.add(user)
    db.flush()
    print(f"[ok]Usuario creado       email={TEST_EMAIL}  password={TEST_PASSWORD}")

    # ── Deudores + facturas vencidas ──
    today = date.today()
    invoices_data = [
        # (número, días_vencida, monto)
        ("FC-0001", 45, Decimal("85000.00")),
        ("FC-0002", 15, Decimal("42500.00")),
    ]
    for idx, d in enumerate(DEBTORS):
        debtor_id = uuid.uuid4()
        debtor = Debtor(
            id=debtor_id,
            organization_id=org_id,
            name=d["name"],
            email=d["email"],
            phone=d["phone"],
            risk_score=60,
        )
        db.add(debtor)
        db.flush()

        inv_num, days_overdue, amount = invoices_data[idx]
        due = today - timedelta(days=days_overdue)
        invoice = Invoice(
            id=uuid.uuid4(),
            organization_id=org_id,
            debtor_id=debtor_id,
            invoice_number=inv_num,
            issue_date=due - timedelta(days=30),
            due_date=due,
            amount=amount,
            balance=amount,
            currency="ARS",
            status=InvoiceStatus.OVERDUE,
        )
        db.add(invoice)
        print(f"[ok]Deudor creado        nombre={d['name']}  phone={d['phone']}  deuda=${amount} ({days_overdue}d vencida)")

    # ── Config agente IA ──
    agent_cfg = AIAgentConfig(
        id=uuid.uuid4(),
        organization_id=org_id,
        name="Agente IA CobroFlow",
        status=AgentStatus.ACTIVE,
        model_provider="vertex",
        model_name="gemini-2.0-flash-001",
        auto_respond=True,
        require_approval=False,
    )
    db.add(agent_cfg)

    db.commit()
    print(f"\n[DONE]Seed completo. Organización: {org_id}")
    print(f"\n   Login:  {TEST_EMAIL}")
    print(f"   Pass:   {TEST_PASSWORD}\n")


def main() -> None:
    db = SessionLocal()
    try:
        truncate_all(db)
        seed(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
