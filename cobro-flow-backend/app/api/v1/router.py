from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, clients, campaigns, communications, ai_agent, ai_training

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
api_router.include_router(ai_agent.router, prefix="/ai-agent", tags=["ai-agent"])
api_router.include_router(ai_training.router, prefix="/ai-training", tags=["ai-training"])
