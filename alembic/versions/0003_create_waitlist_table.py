"""Create waitlist table for landing page email signups

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create waitlist table
    op.create_table(
        'waitlist',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('confirmed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('metro', sa.String(100), nullable=True),
        sa.Column('newsletter', sa.Boolean(), nullable=False, server_default='true'),
    )

    # Create indexes
    op.create_index('ix_waitlist_email', 'waitlist', ['email'], unique=True)
    op.create_index('ix_waitlist_created_at', 'waitlist', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_waitlist_created_at', 'waitlist')
    op.drop_index('ix_waitlist_email', 'waitlist')

    # Drop table
    op.drop_table('waitlist')
