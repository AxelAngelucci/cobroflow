"""add registration fields to users and organizations

Revision ID: eec7d321498a
Revises: d1ba70341eb1
Create Date: 2026-01-31 21:39:57.137396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'eec7d321498a'
down_revision: Union[str, Sequence[str], None] = 'd1ba70341eb1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Define enum types
industry_type_enum = postgresql.ENUM(
    'RETAIL', 'SERVICES', 'MANUFACTURING', 'HEALTHCARE', 'EDUCATION',
    'TECHNOLOGY', 'FINANCE', 'REAL_ESTATE', 'HOSPITALITY', 'OTHER',
    name='industry_type'
)
company_size_enum = postgresql.ENUM(
    'MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE',
    name='company_size'
)


def upgrade() -> None:
    """Upgrade schema."""
    # Create enum types first
    industry_type_enum.create(op.get_bind(), checkfirst=True)
    company_size_enum.create(op.get_bind(), checkfirst=True)
    
    # Add columns
    op.add_column('organizations', sa.Column('industry_type', industry_type_enum, nullable=True))
    op.add_column('organizations', sa.Column('company_size', company_size_enum, nullable=True))
    op.add_column('organizations', sa.Column('monthly_collection_volume', sa.Integer(), nullable=True, comment='Estimated monthly collection volume in ARS'))
    op.add_column('users', sa.Column('phone', sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'phone')
    op.drop_column('organizations', 'monthly_collection_volume')
    op.drop_column('organizations', 'company_size')
    op.drop_column('organizations', 'industry_type')
    
    # Drop enum types
    company_size_enum.drop(op.get_bind(), checkfirst=True)
    industry_type_enum.drop(op.get_bind(), checkfirst=True)
