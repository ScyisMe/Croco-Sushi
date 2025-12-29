"""add show_discount_badge to promotions

Revision ID: 14f5860962b3
Revises: f435a5e034a6
Create Date: 2025-12-29 23:15:00.000000+02:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session


# revision identifiers, used by Alembic.
revision: str = '14f5860962b3'
down_revision: Union[str, None] = 'f435a5e034a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add column as nullable first
    op.add_column('promotions', sa.Column('show_discount_badge', sa.Boolean(), nullable=True))
    
    # 2. Update existing rows to have 'True'
    op.execute("UPDATE promotions SET show_discount_badge = true")
    
    # 3. Alter column to be not-null
    op.alter_column('promotions', 'show_discount_badge', nullable=False, server_default=sa.true())


def downgrade() -> None:
    op.drop_column('promotions', 'show_discount_badge')
