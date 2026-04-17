"""Add entry side to transactions

Revision ID: f7d2c6a1b9ef
Revises: b6c4b57d8a12
Create Date: 2026-04-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7d2c6a1b9ef"
down_revision: Union[str, Sequence[str], None] = "b6c4b57d8a12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("transactions", sa.Column("entry_side", sa.String(length=20), nullable=True))

    op.execute(
        """
        UPDATE transactions
        SET entry_side = CASE
            WHEN lower(operation_type) IN (
                'compra',
                'transferência - liquidação',
                'transferencia - liquidacao',
                'bonificação em ativos',
                'bonificacao em ativos'
            ) THEN 'Credito'
            WHEN lower(operation_type) IN (
                'venda',
                'retirada de custódia',
                'retirada de custodia'
            ) THEN 'Debito'
            ELSE entry_side
        END
        """
    )


def downgrade() -> None:
    op.drop_column("transactions", "entry_side")
