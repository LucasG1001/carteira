"""Replace destination with subcategory; groups become subcategories

Revision ID: c4e8a2f7b9d1
Revises: b2d7e4f1a6c3
Create Date: 2026-09-23 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4e8a2f7b9d1"
down_revision: Union[str, Sequence[str], None] = "b2d7e4f1a6c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "expenses",
        "destination",
        new_column_name="subcategory",
        type_=sa.String(length=100),
        existing_type=sa.String(length=50),
        existing_nullable=True,
    )

    # o antigo grupo desce para subcategoria e o destino é descartado; a categoria nasce
    # como 'Outros' e é reclassificada à mão
    op.execute("UPDATE expenses SET subcategory = category, category = 'Outros'")


def downgrade() -> None:
    op.execute(
        "UPDATE expenses SET category = COALESCE(NULLIF(subcategory, ''), 'Outros'), subcategory = NULL"
    )
    op.alter_column(
        "expenses",
        "subcategory",
        new_column_name="destination",
        type_=sa.String(length=50),
        existing_type=sa.String(length=100),
        existing_nullable=True,
    )
