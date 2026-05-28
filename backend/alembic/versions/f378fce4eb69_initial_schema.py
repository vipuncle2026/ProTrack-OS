"""initial_schema

Revision ID: f378fce4eb69
Revises:
Create Date: 2026-05-25 10:16:18.322189

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f378fce4eb69'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables with foreign keys."""

    # ─── users ──────────────────────────────────────────────────────────────
    op.create_table('users',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('username', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('email', sa.String(), unique=True, index=True),
        sa.Column('full_name', sa.String()),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), default="user"),
        sa.Column('department_id', sa.String()),
        sa.Column('department_name', sa.String()),
        sa.Column('avatar', sa.String(), default=""),
    )

    # ─── projects ───────────────────────────────────────────────────────────
    op.create_table('projects',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), unique=True, index=True),
        sa.Column('type', sa.String()),
        sa.Column('status', sa.String(), default="potential"),
        sa.Column('description', sa.Text(), default=""),
        sa.Column('budget', sa.Float(), default=0),
        sa.Column('actual_cost', sa.Float(), default=0),
        sa.Column('owner_id', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('owner_name', sa.String()),
        sa.Column('department_id', sa.String()),
        sa.Column('department_name', sa.String()),
        sa.Column('start_date', sa.String()),
        sa.Column('end_date', sa.String()),
        sa.Column('created_at', sa.String()),
        sa.Column('updated_at', sa.String()),
    )

    # ─── contacts ───────────────────────────────────────────────────────────
    op.create_table('contacts',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('company', sa.String(), default=""),
        sa.Column('position', sa.String(), default=""),
        sa.Column('department', sa.String(), default=""),
        sa.Column('phone', sa.String(), default=""),
        sa.Column('mobile', sa.String(), default=""),
        sa.Column('email', sa.String(), default=""),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('role', sa.String(), default="other"),
        sa.Column('notes', sa.Text(), default=""),
        sa.Column('created_at', sa.String()),
        sa.Column('updated_at', sa.String()),
    )

    # ─── visit_logs ─────────────────────────────────────────────────────────
    op.create_table('visit_logs',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('contact_id', sa.String(), sa.ForeignKey('contacts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('contact_name', sa.String()),
        sa.Column('visit_date', sa.String()),
        sa.Column('location', sa.String(), default=""),
        sa.Column('purpose', sa.String(), default=""),
        sa.Column('content', sa.Text(), default=""),
        sa.Column('result', sa.Text(), default=""),
        sa.Column('next_action', sa.Text(), default=""),
        sa.Column('attachments', sa.JSON(), default=[]),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.String()),
        sa.Column('updated_at', sa.String()),
    )

    # ─── quotes ─────────────────────────────────────────────────────────────
    op.create_table('quotes',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('quote_number', sa.String(), unique=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('contact_id', sa.String(), sa.ForeignKey('contacts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('quote_date', sa.String()),
        sa.Column('valid_until', sa.String()),
        sa.Column('status', sa.String(), default="draft"),
        sa.Column('subtotal', sa.Float(), default=0),
        sa.Column('discount', sa.Float(), default=0),
        sa.Column('tax_rate', sa.Float(), default=6),
        sa.Column('tax_amount', sa.Float(), default=0),
        sa.Column('total', sa.Float(), default=0),
        sa.Column('items', sa.JSON(), default=[]),
        sa.Column('notes', sa.Text(), default=""),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.String()),
        sa.Column('updated_at', sa.String()),
    )

    # ─── contracts ──────────────────────────────────────────────────────────
    op.create_table('contracts',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('contract_number', sa.String(), unique=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('name', sa.String()),
        sa.Column('status', sa.String(), default="draft"),
        sa.Column('amount', sa.Float(), default=0),
        sa.Column('payment_method', sa.String(), default=""),
        sa.Column('sign_date', sa.String()),
        sa.Column('start_date', sa.String()),
        sa.Column('end_date', sa.String()),
        sa.Column('contract_file', sa.String(), default=""),
        sa.Column('terms', sa.Text(), default=""),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.String()),
        sa.Column('updated_at', sa.String()),
    )

    # ─── payments ───────────────────────────────────────────────────────────
    op.create_table('payments',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('payment_number', sa.String(), unique=True, index=True),
        sa.Column('contract_id', sa.String(), sa.ForeignKey('contracts.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('payment_date', sa.String()),
        sa.Column('amount', sa.Float(), default=0),
        sa.Column('payment_method', sa.String(), default=""),
        sa.Column('status', sa.String(), default="pending"),
        sa.Column('invoice_number', sa.String(), default=""),
        sa.Column('invoice_file', sa.String(), default=""),
        sa.Column('notes', sa.Text(), default=""),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.String()),
        sa.Column('updated_at', sa.String()),
    )

    # ─── services ───────────────────────────────────────────────────────────
    op.create_table('services',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('contract_id', sa.String(), sa.ForeignKey('contracts.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('service_type', sa.String()),
        sa.Column('title', sa.String()),
        sa.Column('description', sa.Text(), default=""),
        sa.Column('assigned_to', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('assigned_name', sa.String()),
        sa.Column('status', sa.String(), default="pending"),
        sa.Column('start_date', sa.String()),
        sa.Column('end_date', sa.String()),
        sa.Column('estimated_hours', sa.Float(), default=0),
        sa.Column('actual_hours', sa.Float(), default=0),
        sa.Column('report', sa.Text(), default=""),
        sa.Column('rating', sa.Integer(), default=0),
        sa.Column('created_at', sa.String()),
        sa.Column('updated_at', sa.String()),
    )


def downgrade() -> None:
    """Drop all tables in reverse dependency order."""
    op.drop_table('services')
    op.drop_table('payments')
    op.drop_table('contracts')
    op.drop_table('quotes')
    op.drop_table('visit_logs')
    op.drop_table('contacts')
    op.drop_table('projects')
    op.drop_table('users')
