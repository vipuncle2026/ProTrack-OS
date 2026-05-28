"""add_is_primary_to_contact

Revision ID: ae87ba6da6a6
Revises: 2d2c5447ee0f
Create Date: 2026-05-25 20:34:34.982472

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'ae87ba6da6a6'
down_revision: Union[str, Sequence[str], None] = '2d2c5447ee0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table, column):
    """Check if a column exists in the table."""
    conn = op.get_bind()
    insp = inspect(conn)
    cols = [c['name'] for c in insp.get_columns(table)]
    return column in cols


def upgrade() -> None:
    """Upgrade schema."""
    # 添加 contacts.is_primary（幂等：已存在则跳过）
    if not _has_column('contacts', 'is_primary'):
        with op.batch_alter_table('contacts', schema=None) as batch_op:
            batch_op.add_column(sa.Column('is_primary', sa.Boolean(), nullable=True))

    # 删除 projects.contact_name / contact_id（幂等：不存在则跳过）
    with op.batch_alter_table('projects', schema=None) as batch_op:
        if _has_column('projects', 'contact_name'):
            batch_op.drop_column('contact_name')
        if _has_column('projects', 'contact_id'):
            batch_op.drop_column('contact_id')


def downgrade() -> None:
    """Downgrade schema."""
    # 还原 projects.contact_id / contact_name
    with op.batch_alter_table('projects', schema=None) as batch_op:
        if not _has_column('projects', 'contact_id'):
            batch_op.add_column(sa.Column('contact_id', sa.VARCHAR(), nullable=True))
        if not _has_column('projects', 'contact_name'):
            batch_op.add_column(sa.Column('contact_name', sa.VARCHAR(), nullable=True))

    # 删除 contacts.is_primary
    if _has_column('contacts', 'is_primary'):
        with op.batch_alter_table('contacts', schema=None) as batch_op:
            batch_op.drop_column('is_primary')
