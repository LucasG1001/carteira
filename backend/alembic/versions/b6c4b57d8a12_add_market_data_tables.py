"""Add market data tables

Revision ID: b6c4b57d8a12
Revises: 30430b60cecf
Create Date: 2026-04-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b6c4b57d8a12"
down_revision: Union[str, Sequence[str], None] = "30430b60cecf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "stock_prices",
        sa.Column("ticker", sa.String(length=50), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("open", sa.Float(), nullable=False),
        sa.Column("high", sa.Float(), nullable=False),
        sa.Column("low", sa.Float(), nullable=False),
        sa.Column("close", sa.Float(), nullable=False),
        sa.Column("volume", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("ticker", "date"),
    )
    op.create_index(op.f("ix_stock_prices_ticker"), "stock_prices", ["ticker"], unique=False)
    op.create_index(op.f("ix_stock_prices_date"), "stock_prices", ["date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_stock_prices_date"), table_name="stock_prices")
    op.drop_index(op.f("ix_stock_prices_ticker"), table_name="stock_prices")
    op.drop_table("stock_prices")
