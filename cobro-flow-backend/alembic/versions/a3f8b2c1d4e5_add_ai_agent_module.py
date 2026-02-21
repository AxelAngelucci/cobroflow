"""add ai agent module

Revision ID: a3f8b2c1d4e5
Revises: 202df094637c
Create Date: 2026-02-15 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a3f8b2c1d4e5'
down_revision: Union[str, Sequence[str], None] = '202df094637c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all AI Agent tables."""

    # ── Enums ──────────────────────────────────────────────────────────
    agent_status = postgresql.ENUM(
        'active', 'paused', 'training', 'error',
        name='agent_status', create_type=True,
    )
    agent_status.create(op.get_bind(), checkfirst=True)

    agent_tone = postgresql.ENUM(
        'professional', 'friendly', 'firm', 'empathetic',
        name='agent_tone', create_type=True,
    )
    agent_tone.create(op.get_bind(), checkfirst=True)

    conversation_status = postgresql.ENUM(
        'active', 'resolved', 'escalated', 'expired',
        name='conversation_status', create_type=True,
    )
    conversation_status.create(op.get_bind(), checkfirst=True)

    message_role = postgresql.ENUM(
        'agent', 'client', 'system',
        name='message_role', create_type=True,
    )
    message_role.create(op.get_bind(), checkfirst=True)

    message_sentiment = postgresql.ENUM(
        'positive', 'neutral', 'negative',
        name='message_sentiment', create_type=True,
    )
    message_sentiment.create(op.get_bind(), checkfirst=True)

    training_doc_status = postgresql.ENUM(
        'pending', 'processing', 'processed', 'failed',
        name='training_doc_status', create_type=True,
    )
    training_doc_status.create(op.get_bind(), checkfirst=True)

    training_session_status = postgresql.ENUM(
        'running', 'completed', 'failed',
        name='training_session_status', create_type=True,
    )
    training_session_status.create(op.get_bind(), checkfirst=True)

    rule_priority = postgresql.ENUM(
        'high', 'medium', 'low',
        name='rule_priority', create_type=True,
    )
    rule_priority.create(op.get_bind(), checkfirst=True)

    escalation_reason = postgresql.ENUM(
        'negative_sentiment', 'high_debt', 'repeated_failure',
        'client_request', 'agent_uncertainty', 'custom',
        name='escalation_reason', create_type=True,
    )
    escalation_reason.create(op.get_bind(), checkfirst=True)

    # ── 1. ai_agent_configs ────────────────────────────────────────────
    op.create_table('ai_agent_configs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), server_default='Agente IA CobroFlow', nullable=False),
        sa.Column('status', postgresql.ENUM('active', 'paused', 'training', 'error', name='agent_status', create_type=False), nullable=True),
        sa.Column('model_provider', sa.String(length=50), server_default='openai', nullable=False),
        sa.Column('model_name', sa.String(length=100), server_default='gpt-4o', nullable=False),
        sa.Column('temperature', sa.Float(), server_default='0.7', nullable=True),
        sa.Column('max_tokens', sa.Integer(), server_default='2048', nullable=True),
        sa.Column('auto_respond', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('require_approval', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('max_retries', sa.Integer(), server_default='3', nullable=True),
        sa.Column('retry_delay_minutes', sa.Integer(), server_default='30', nullable=True),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id'),
    )

    # ── 2. ai_agent_personalities ──────────────────────────────────────
    op.create_table('ai_agent_personalities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('tone', postgresql.ENUM('professional', 'friendly', 'firm', 'empathetic', name='agent_tone', create_type=False), nullable=True),
        sa.Column('greeting_template', sa.Text(), nullable=True),
        sa.Column('farewell_template', sa.Text(), nullable=True),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('language', sa.String(length=5), server_default='es', nullable=True),
        sa.Column('formality_level', sa.Integer(), server_default='3', nullable=True),
        sa.Column('empathy_level', sa.Integer(), server_default='3', nullable=True),
        sa.Column('forbidden_topics', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('custom_instructions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_config_id'),
    )

    # ── 3. ai_conversations ────────────────────────────────────────────
    op.create_table('ai_conversations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('debtor_id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('channel', postgresql.ENUM('email', 'sms', 'whatsapp', 'phone', name='channel_type', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('active', 'resolved', 'escalated', 'expired', name='conversation_status', create_type=False), nullable=True),
        sa.Column('overall_sentiment', postgresql.ENUM('positive', 'neutral', 'negative', name='message_sentiment', create_type=False), nullable=True),
        sa.Column('escalated_to_user_id', sa.UUID(), nullable=True),
        sa.Column('escalation_reason', postgresql.ENUM('negative_sentiment', 'high_debt', 'repeated_failure', 'client_request', 'agent_uncertainty', 'custom', name='escalation_reason', create_type=False), nullable=True),
        sa.Column('resolution_summary', sa.Text(), nullable=True),
        sa.Column('total_messages', sa.Integer(), server_default='0', nullable=True),
        sa.Column('first_response_time_ms', sa.Integer(), nullable=True),
        sa.Column('resolution_time_ms', sa.Integer(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.ForeignKeyConstraint(['debtor_id'], ['debtors.id']),
        sa.ForeignKeyConstraint(['escalated_to_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_conv_org_status', 'ai_conversations', ['organization_id', 'status'])
    op.create_index('ix_ai_conv_org_debtor', 'ai_conversations', ['organization_id', 'debtor_id'])
    op.create_index('ix_ai_conv_org_created', 'ai_conversations', ['organization_id', 'created_at'])

    # ── 4. ai_conversation_messages ────────────────────────────────────
    op.create_table('ai_conversation_messages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('conversation_id', sa.UUID(), nullable=False),
        sa.Column('role', postgresql.ENUM('agent', 'client', 'system', name='message_role', create_type=False), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sentiment', postgresql.ENUM('positive', 'neutral', 'negative', name='message_sentiment', create_type=False), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('cost', sa.Numeric(precision=10, scale=6), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['ai_conversations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_msg_conv_created', 'ai_conversation_messages', ['conversation_id', 'created_at'])

    # ── 5. ai_training_documents ───────────────────────────────────────
    op.create_table('ai_training_documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=500), nullable=False),
        sa.Column('file_path', sa.String(length=1000), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('content_text', sa.Text(), nullable=True),
        sa.Column('embedding_id', sa.String(length=500), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'processing', 'processed', 'failed', name='training_doc_status', create_type=False), nullable=True),
        sa.Column('chunk_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('uploaded_by_user_id', sa.UUID(), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_doc_org_status', 'ai_training_documents', ['organization_id', 'status'])

    # ── 6. ai_business_rules ───────────────────────────────────────────
    op.create_table('ai_business_rules',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('rule_text', sa.Text(), nullable=False),
        sa.Column('priority', postgresql.ENUM('high', 'medium', 'low', name='rule_priority', create_type=False), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_rule_org_active', 'ai_business_rules', ['organization_id', 'is_active'])

    # ── 7. ai_conversation_examples ────────────────────────────────────
    op.create_table('ai_conversation_examples',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 8. ai_training_sessions ────────────────────────────────────────
    op.create_table('ai_training_sessions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('status', postgresql.ENUM('running', 'completed', 'failed', name='training_session_status', create_type=False), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('documents_processed', sa.Integer(), server_default='0', nullable=True),
        sa.Column('rules_applied', sa.Integer(), server_default='0', nullable=True),
        sa.Column('examples_added', sa.Integer(), server_default='0', nullable=True),
        sa.Column('accuracy_before', sa.Float(), nullable=True),
        sa.Column('accuracy_after', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 9. ai_agent_analytics ──────────────────────────────────────────
    op.create_table('ai_agent_analytics',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('channel', postgresql.ENUM('email', 'sms', 'whatsapp', 'phone', name='channel_type', create_type=False), nullable=True),
        sa.Column('total_conversations', sa.Integer(), server_default='0', nullable=True),
        sa.Column('resolved_conversations', sa.Integer(), server_default='0', nullable=True),
        sa.Column('escalated_conversations', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_messages_sent', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_messages_received', sa.Integer(), server_default='0', nullable=True),
        sa.Column('avg_response_time_ms', sa.Integer(), nullable=True),
        sa.Column('avg_resolution_time_ms', sa.Integer(), nullable=True),
        sa.Column('positive_sentiment_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('neutral_sentiment_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('negative_sentiment_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('payments_collected_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('payments_collected_amount', sa.Numeric(precision=15, scale=2), server_default='0', nullable=True),
        sa.Column('payment_promises_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_tokens_used', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_cost', sa.Numeric(precision=10, scale=4), server_default='0', nullable=True),
        sa.Column('satisfaction_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'date', 'channel', name='uq_analytics_org_date_channel'),
    )
    op.create_index('ix_ai_analytics_org_date', 'ai_agent_analytics', ['organization_id', 'date'])

    # ── 10. ai_agent_escalation_rules ──────────────────────────────────
    op.create_table('ai_agent_escalation_rules',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('reason', postgresql.ENUM('negative_sentiment', 'high_debt', 'repeated_failure', 'client_request', 'agent_uncertainty', 'custom', name='escalation_reason', create_type=False), nullable=False),
        sa.Column('condition_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('assign_to_user_id', sa.UUID(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('priority', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.ForeignKeyConstraint(['assign_to_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── 11. ai_agent_channel_configs ───────────────────────────────────
    op.create_table('ai_agent_channel_configs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('channel', postgresql.ENUM('email', 'sms', 'whatsapp', 'phone', name='channel_type', create_type=False), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('max_messages_per_conversation', sa.Integer(), server_default='50', nullable=True),
        sa.Column('greeting_message', sa.Text(), nullable=True),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_config_id', 'channel', name='uq_agent_channel'),
    )

    # ── 12. ai_agent_operating_hours ───────────────────────────────────
    op.create_table('ai_agent_operating_hours',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_config_id', sa.UUID(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('start_time', sa.String(length=5), server_default='09:00', nullable=False),
        sa.Column('end_time', sa.String(length=5), server_default='18:00', nullable=False),
        sa.Column('timezone', sa.String(length=50), server_default='America/Mexico_City', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['agent_config_id'], ['ai_agent_configs.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_config_id', 'day_of_week', name='uq_agent_day'),
        sa.CheckConstraint('day_of_week >= 0 AND day_of_week <= 6', name='ck_day_of_week'),
    )


def downgrade() -> None:
    """Drop all AI Agent tables."""
    op.drop_table('ai_agent_operating_hours')
    op.drop_table('ai_agent_channel_configs')
    op.drop_table('ai_agent_escalation_rules')
    op.drop_table('ai_agent_analytics')
    op.drop_table('ai_training_sessions')
    op.drop_table('ai_conversation_examples')
    op.drop_table('ai_business_rules')
    op.drop_table('ai_training_documents')
    op.drop_table('ai_conversation_messages')
    op.drop_table('ai_conversations')
    op.drop_table('ai_agent_personalities')
    op.drop_table('ai_agent_configs')

    # Drop enums
    op.execute("DROP TYPE IF EXISTS escalation_reason")
    op.execute("DROP TYPE IF EXISTS rule_priority")
    op.execute("DROP TYPE IF EXISTS training_session_status")
    op.execute("DROP TYPE IF EXISTS training_doc_status")
    op.execute("DROP TYPE IF EXISTS message_sentiment")
    op.execute("DROP TYPE IF EXISTS message_role")
    op.execute("DROP TYPE IF EXISTS conversation_status")
    op.execute("DROP TYPE IF EXISTS agent_tone")
    op.execute("DROP TYPE IF EXISTS agent_status")
