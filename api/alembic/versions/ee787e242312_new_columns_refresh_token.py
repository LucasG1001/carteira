"""new columns refresh token

Revision ID: ee787e242312
Revises: 405494a17ac8
Create Date: 2025-04-11 18:45:34.953221

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ee787e242312'
down_revision: Union[str, None] = '405494a17ac8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('refresh_token', sa.Column('ip_address', sa.String(length=45), nullable=False))
    op.add_column('refresh_token', sa.Column('user_agent', sa.Enum('MOBILE', 'TABLET', 'PC', 'BOT', 'UNKOWN', name='auth_provider'), nullable=False))
    op.add_column('refresh_token', sa.Column('create_at', sa.TIMESTAMP(), nullable=False))
    op.alter_column('refresh_token', 'value',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('refresh_token', 'expires_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('refresh_token', 'expires_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
    op.alter_column('refresh_token', 'value',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.drop_column('refresh_token', 'create_at')
    op.drop_column('refresh_token', 'user_agent')
    op.drop_column('refresh_token', 'ip_address')
    # ### end Alembic commands ###
