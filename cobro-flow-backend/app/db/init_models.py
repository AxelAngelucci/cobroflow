# Import all models to register them with Base.metadata
# This file should be imported where models need to be loaded (e.g., alembic env.py)

from app.db.base import Base  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.debtor import Debtor  # noqa: F401
from app.models.invoice import Invoice  # noqa: F401
from app.models.payment import Payment, PaymentAllocation  # noqa: F401
from app.models.campaign import Campaign, CampaignStage, StageAction  # noqa: F401
from app.models.communication import (  # noqa: F401
    MessageTemplate, CollectionWorkflow, WorkflowStep,
    CommunicationLog, CommunicationEvent,
)
from app.models.ai_agent import (  # noqa: F401
    AIAgentConfig, AIAgentPersonality, AIConversation, AIConversationMessage,
    AITrainingDocument, AIBusinessRule, AIConversationExample,
    AITrainingSession, AIAgentAnalytics, AIAgentEscalationRule,
    AIAgentChannelConfig, AIAgentOperatingHours, AIDocumentChunk,
)
