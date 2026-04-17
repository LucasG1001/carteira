"""Allow reupload of same file hash

Revision ID: 9a2f6d4c1e8b
Revises: f7d2c6a1b9ef
Create Date: 2026-04-17 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9a2f6d4c1e8b"
down_revision: Union[str, Sequence[str], None] = "f7d2c6a1b9ef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_uploads_file_hash", table_name="uploads")
    op.create_index("ix_uploads_file_hash", "uploads", ["file_hash"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_uploads_file_hash", table_name="uploads")
    op.create_index("ix_uploads_file_hash", "uploads", ["file_hash"], unique=True)
