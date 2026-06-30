"""Add subcategory to expenses

Revision ID: e7b3f0a9c1d2
Revises: d4e8a1c2b9f7
Create Date: 2026-06-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e7b3f0a9c1d2"
down_revision: Union[str, Sequence[str], None] = "d4e8a1c2b9f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("expenses", sa.Column("subcategory", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("expenses", "subcategory")
