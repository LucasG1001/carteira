"""Split expense taxonomy into group, destination and classification

Revision ID: b2d7e4f1a6c3
Revises: a3f5c9e1d2b8
Create Date: 2026-08-14 22:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2d7e4f1a6c3"
down_revision: Union[str, Sequence[str], None] = "a3f5c9e1d2b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("expenses", sa.Column("classification", sa.String(length=20), nullable=True))
    op.alter_column("expenses", "subcategory", new_column_name="destination")

    # category guardava Essenciais/Lazer e subcategory guardava o grupo do gasto:
    # a classificação sai de category, category vira o grupo e o destino nasce vazio.
    op.execute("UPDATE expenses SET classification = category")
    op.execute("UPDATE expenses SET category = COALESCE(NULLIF(destination, ''), 'Outros')")
    op.execute("UPDATE expenses SET destination = NULL")
    op.execute("UPDATE expenses SET classification = 'Essencial' WHERE classification = 'Essenciais'")


def downgrade() -> None:
    op.execute("UPDATE expenses SET destination = category")
    op.execute("UPDATE expenses SET category = COALESCE(NULLIF(classification, ''), 'Outros')")
    op.alter_column("expenses", "destination", new_column_name="subcategory")
    op.drop_column("expenses", "classification")
