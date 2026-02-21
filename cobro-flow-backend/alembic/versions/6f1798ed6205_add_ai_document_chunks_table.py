"""add_ai_document_chunks_table

Revision ID: 6f1798ed6205
Revises: a3f8b2c1d4e5
Create Date: 2026-02-16 22:52:38.906616

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6f1798ed6205'
down_revision: Union[str, Sequence[str], None] = 'a3f8b2c1d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('ai_document_chunks',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('chunk_text', sa.Text(), nullable=False),
    sa.Column('vertex_datapoint_id', sa.String(length=255), nullable=False),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('embedding_vector', sa.LargeBinary(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['ai_training_documents.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('vertex_datapoint_id')
    )
    op.create_index('ix_ai_chunk_doc', 'ai_document_chunks', ['document_id'], unique=False)
    op.create_index('ix_ai_chunk_org', 'ai_document_chunks', ['organization_id'], unique=False)
    op.create_index('ix_ai_chunk_vertex_dp', 'ai_document_chunks', ['vertex_datapoint_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_ai_chunk_vertex_dp', table_name='ai_document_chunks')
    op.drop_index('ix_ai_chunk_org', table_name='ai_document_chunks')
    op.drop_index('ix_ai_chunk_doc', table_name='ai_document_chunks')
    op.drop_table('ai_document_chunks')
