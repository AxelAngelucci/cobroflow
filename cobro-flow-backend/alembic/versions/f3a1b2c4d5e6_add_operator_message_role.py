"""add_operator_message_role

Revision ID: f3a1b2c4d5e6
Revises: c7d4e8f2a1b3
Create Date: 2026-04-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f3a1b2c4d5e6'
down_revision: Union[str, None] = 'c7d4e8f2a1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE message_role ADD VALUE IF NOT EXISTS 'operator'")


def downgrade() -> None:
    # PostgreSQL no permite eliminar valores de un enum directamente.
    # Para revertir habría que recrear el tipo sin 'operator'.
    pass
