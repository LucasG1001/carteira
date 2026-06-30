"""Create expenses table

Revision ID: d4e8a1c2b9f7
Revises: c1f9a7e2d3b4
Create Date: 2026-06-30 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e8a1c2b9f7"
down_revision: Union[str, Sequence[str], None] = "c1f9a7e2d3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=10), server_default=sa.text("'expense'"), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("payment_method", sa.String(length=30), nullable=True),
        sa.Column("installments", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("is_recurring", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("recurrence", sa.String(length=20), nullable=True),
        sa.Column("place", sa.String(length=150), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("tags", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_expenses_user_id"), "expenses", ["user_id"], unique=False)
    op.create_index(op.f("ix_expenses_date"), "expenses", ["date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_expenses_date"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_user_id"), table_name="expenses")
    op.drop_table("expenses")
