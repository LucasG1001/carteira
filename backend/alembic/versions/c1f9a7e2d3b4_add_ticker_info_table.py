"""Add ticker_info table

Revision ID: c1f9a7e2d3b4
Revises: 9a2f6d4c1e8b
Create Date: 2026-06-29 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c1f9a7e2d3b4"
down_revision: Union[str, Sequence[str], None] = "9a2f6d4c1e8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ticker_info",
        sa.Column("ticker", sa.String(length=50), nullable=False),
        sa.Column("short_name", sa.String(length=255), nullable=True),
        sa.Column("long_name", sa.String(length=255), nullable=True),
        sa.Column("sector", sa.String(length=255), nullable=True),
        sa.Column("quote_type", sa.String(length=50), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("ticker"),
    )
    op.create_index(op.f("ix_ticker_info_ticker"), "ticker_info", ["ticker"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ticker_info_ticker"), table_name="ticker_info")
    op.drop_table("ticker_info")
