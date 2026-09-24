"""Drop address and tags from expenses

Revision ID: a8d3f6b2c7e4
Revises: c4e8a2f7b9d1
Create Date: 2026-09-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a8d3f6b2c7e4"
down_revision: Union[str, Sequence[str], None] = "c4e8a2f7b9d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("expenses", "address")
    op.drop_column("expenses", "tags")


def downgrade() -> None:
    op.add_column("expenses", sa.Column("tags", sa.String(length=255), nullable=True))
    op.add_column("expenses", sa.Column("address", sa.String(length=255), nullable=True))
