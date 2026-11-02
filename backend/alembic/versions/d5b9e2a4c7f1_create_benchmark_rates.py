"""Create benchmark_rates table

Revision ID: d5b9e2a4c7f1
Revises: a8d3f6b2c7e4
Create Date: 2026-11-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d5b9e2a4c7f1"
down_revision: Union[str, Sequence[str], None] = "a8d3f6b2c7e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "benchmark_rates",
        sa.Column("series", sa.String(length=20), primary_key=True),
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("benchmark_rates")
