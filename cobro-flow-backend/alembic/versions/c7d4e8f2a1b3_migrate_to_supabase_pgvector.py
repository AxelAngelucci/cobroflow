"""migrate_to_supabase_pgvector

Revision ID: c7d4e8f2a1b3
Revises: 6f1798ed6205
Create Date: 2026-03-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c7d4e8f2a1b3'
down_revision: Union[str, Sequence[str], None] = '6f1798ed6205'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Migrate embedding_vector from LargeBinary to pgvector vector(768)."""
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.drop_column('ai_document_chunks', 'embedding_vector')

    op.execute(
        'ALTER TABLE ai_document_chunks ADD COLUMN embedding_vector vector(768)'
    )

    op.execute(
        'CREATE INDEX IF NOT EXISTS ix_ai_document_chunks_embedding '
        'ON ai_document_chunks '
        'USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100)'
    )


def downgrade() -> None:
    """Revert pgvector column back to LargeBinary."""
    op.execute(
        'DROP INDEX IF EXISTS ix_ai_document_chunks_embedding'
    )

    op.drop_column('ai_document_chunks', 'embedding_vector')

    op.add_column(
        'ai_document_chunks',
        sa.Column('embedding_vector', sa.LargeBinary(), nullable=True),
    )
