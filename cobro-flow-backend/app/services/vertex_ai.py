"""Vertex AI Gemini generation service with RAG context retrieval."""

from __future__ import annotations

import logging
from uuid import UUID

import vertexai
from vertexai.generative_models import (
    GenerativeModel,
    GenerationConfig,
    HarmCategory,
    HarmBlockThreshold,
    SafetySetting,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_agent import AIDocumentChunk, AIBusinessRule, AIConversationExample
from app.services.vector_search import VectorSearchService

logger = logging.getLogger(__name__)

# ── Safety settings applied to all Gemini calls ──────────────────────
SAFETY_SETTINGS = [
    SafetySetting(
        category=HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    SafetySetting(
        category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    SafetySetting(
        category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
    SafetySetting(
        category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    ),
]


class VertexAIGenerator:
    """Generates AI messages using Vertex AI Gemini models with RAG context."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._vector_service = VectorSearchService(db=db)

        vertexai.init(
            project=settings.GCP_PROJECT_ID,
            location=settings.GCP_LOCATION,
        )

        self._flash_model = GenerativeModel(
            model_name=settings.VERTEX_FLASH_MODEL,
            safety_settings=SAFETY_SETTINGS,
            generation_config=GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
                top_p=0.9,
            ),
        )

        self._pro_model = GenerativeModel(
            model_name=settings.VERTEX_PRO_MODEL,
            safety_settings=SAFETY_SETTINGS,
            generation_config=GenerationConfig(
                temperature=0.4,
                max_output_tokens=2048,
                top_p=0.95,
            ),
        )

    # ── RAG context retrieval ─────────────────────────────────────────

    def _retrieve_rag_context(
        self,
        organization_id: str,
        query: str,
        top_k: int = 5,
    ) -> str:
        """Search Vector Search and hydrate chunk texts from PostgreSQL."""
        results = self._vector_service.search_context(
            organization_id=organization_id,
            query=query,
            top_k=top_k,
        )

        if not results:
            return ""

        datapoint_ids = [r.datapoint_id for r in results]

        stmt = select(AIDocumentChunk).where(
            AIDocumentChunk.vertex_datapoint_id.in_(datapoint_ids),
            AIDocumentChunk.organization_id == organization_id,
        )
        chunks = list(self._db.execute(stmt).scalars().all())

        # Reorder by search score
        id_to_chunk = {c.vertex_datapoint_id: c for c in chunks}
        ordered_texts: list[str] = []
        for r in results:
            chunk = id_to_chunk.get(r.datapoint_id)
            if chunk:
                ordered_texts.append(chunk.chunk_text)

        return "\n---\n".join(ordered_texts)

    def _get_business_rules(self, organization_id: str) -> list[str]:
        """Fetch active business rules ordered by priority."""
        stmt = (
            select(AIBusinessRule)
            .where(
                AIBusinessRule.organization_id == organization_id,
                AIBusinessRule.is_active.is_(True),
            )
            .order_by(AIBusinessRule.sort_order.asc())
        )
        rules = list(self._db.execute(stmt).scalars().all())
        return [r.rule_text for r in rules]

    def _get_few_shot_examples(
        self,
        organization_id: str,
        limit: int = 5,
    ) -> list[dict[str, str]]:
        """Fetch active conversation examples for few-shot prompting."""
        stmt = (
            select(AIConversationExample)
            .where(
                AIConversationExample.organization_id == organization_id,
                AIConversationExample.is_active.is_(True),
            )
            .limit(limit)
        )
        examples = list(self._db.execute(stmt).scalars().all())
        return [{"question": e.question, "answer": e.answer} for e in examples]

    # ── Campaign message generation ───────────────────────────────────

    def generate_campaign_message(
        self,
        organization_id: str,
        campaign_context: dict,
        debtor_context: dict,
        agent_personality: dict | None = None,
        channel: str = "email",
    ) -> dict[str, str | int]:
        """Generate a personalized collection message using Gemini Flash + RAG.

        Returns {"message": str, "subject": str | None, "tokens_used": int}.
        """
        # Build RAG query from debtor context
        rag_query = (
            f"cobranza deuda {debtor_context.get('name', '')} "
            f"monto {debtor_context.get('total_debt', '')} "
            f"días mora {debtor_context.get('days_overdue', '')}"
        )
        rag_context = self._retrieve_rag_context(organization_id, rag_query)
        business_rules = self._get_business_rules(organization_id)
        examples = self._get_few_shot_examples(organization_id, limit=3)

        # Build structured prompt
        prompt = self._build_campaign_prompt(
            campaign_context=campaign_context,
            debtor_context=debtor_context,
            agent_personality=agent_personality,
            channel=channel,
            rag_context=rag_context,
            business_rules=business_rules,
            examples=examples,
        )

        response = self._flash_model.generate_content(prompt)

        tokens_used = 0
        if response.usage_metadata:
            tokens_used = (
                response.usage_metadata.prompt_token_count
                + response.usage_metadata.candidates_token_count
            )

        message_text = response.text.strip()

        # For email, try to split subject from body
        subject = None
        if channel == "email" and "\n" in message_text:
            first_line = message_text.split("\n", 1)[0]
            if first_line.lower().startswith("asunto:"):
                subject = first_line.replace("Asunto:", "").replace("asunto:", "").strip()
                message_text = message_text.split("\n", 1)[1].strip()

        return {
            "message": message_text,
            "subject": subject,
            "tokens_used": tokens_used,
        }

    def _build_campaign_prompt(
        self,
        campaign_context: dict,
        debtor_context: dict,
        agent_personality: dict | None,
        channel: str,
        rag_context: str,
        business_rules: list[str],
        examples: list[dict[str, str]],
    ) -> str:
        """Assemble the structured prompt for campaign message generation."""

        personality_section = ""
        if agent_personality:
            personality_section = f"""
## Personalidad del Agente
- Tono: {agent_personality.get('tone', 'professional')}
- Nivel de formalidad: {agent_personality.get('formality_level', 3)}/5
- Nivel de empatía: {agent_personality.get('empathy_level', 3)}/5
- Idioma: {agent_personality.get('language', 'es')}
"""
            if agent_personality.get('custom_instructions'):
                personality_section += f"- Instrucciones adicionales: {agent_personality['custom_instructions']}\n"
            if agent_personality.get('forbidden_topics'):
                personality_section += f"- Temas prohibidos: {', '.join(agent_personality['forbidden_topics'])}\n"

        rules_section = ""
        if business_rules:
            rules_list = "\n".join(f"  - {r}" for r in business_rules)
            rules_section = f"""
## Reglas de Negocio (OBLIGATORIAS)
{rules_list}
"""

        rag_section = ""
        if rag_context:
            rag_section = f"""
## Contexto de Documentos de Entrenamiento
{rag_context}
"""

        examples_section = ""
        if examples:
            ex_list = "\n".join(
                f"  Pregunta: {e['question']}\n  Respuesta: {e['answer']}"
                for e in examples
            )
            examples_section = f"""
## Ejemplos de Conversación
{ex_list}
"""

        channel_instructions = {
            "whatsapp": "Máximo 1000 caracteres. Usa emojis con moderación. No incluyas asunto.",
            "email": "Incluye una línea 'Asunto: ...' al inicio. Formato profesional con saludo y despedida.",
            "sms": "Máximo 160 caracteres. Directo y conciso. No incluyas asunto.",
            "call": "Genera un guión para llamada telefónica con saludo, cuerpo y cierre.",
            "ai_voice": "Genera un guión natural para voz IA. Oraciones cortas y claras.",
        }

        stage_info = ""
        if campaign_context.get("stage_name"):
            stage_info = f"- Etapa actual: {campaign_context['stage_name']}"
            if campaign_context.get("tone_instructions"):
                stage_info += f"\n- Instrucciones de tono para esta etapa: {campaign_context['tone_instructions']}"

        return f"""Eres un agente de cobranzas profesional que genera mensajes personalizados.

## Campaña
- Nombre: {campaign_context.get('campaign_name', 'Campaña de Cobranza')}
- Tipo: {campaign_context.get('campaign_type', 'friendly')}
{stage_info}

## Deudor
- Nombre: {debtor_context.get('name', 'Cliente')}
- Deuda total: ${debtor_context.get('total_debt', 0):,.2f} {debtor_context.get('currency', 'ARS')}
- Días de mora: {debtor_context.get('days_overdue', 0)}
- Score de riesgo: {debtor_context.get('risk_score', 50)}/100
- Facturas pendientes: {debtor_context.get('pending_invoices', 'N/A')}

## Canal: {channel.upper()}
{channel_instructions.get(channel, 'Genera un mensaje apropiado para el canal.')}
{personality_section}{rules_section}{rag_section}{examples_section}
## Instrucciones
Genera ÚNICAMENTE el mensaje de cobranza. No incluyas explicaciones ni meta-comentarios.
El mensaje debe ser persuasivo pero respetuoso, incentivando al deudor a regularizar su situación.
"""

    # ── Debtor profile generation ─────────────────────────────────────

    def generate_debtor_profile(
        self,
        organization_id: str,
        debtor_data: dict,
        interaction_history: list[dict] | None = None,
    ) -> str:
        """Generate an AI profile summary for a debtor using Gemini Pro."""
        history_section = ""
        if interaction_history:
            history_lines = []
            for h in interaction_history[-10:]:  # Last 10 interactions
                history_lines.append(
                    f"- [{h.get('date', 'N/A')}] {h.get('channel', '')}: {h.get('summary', '')}"
                )
            history_section = f"""
## Historial de Interacciones
{chr(10).join(history_lines)}
"""

        prompt = f"""Analiza el siguiente perfil de deudor y genera un resumen ejecutivo
en español de máximo 200 palabras. Incluye patrones de comportamiento,
nivel de riesgo y recomendaciones de estrategia de cobranza.

## Datos del Deudor
- Nombre: {debtor_data.get('name', 'N/A')}
- Score de riesgo: {debtor_data.get('risk_score', 'N/A')}/100
- Deuda total: ${debtor_data.get('total_debt', 0):,.2f}
- Facturas pendientes: {debtor_data.get('pending_invoices', 0)}
- Tags: {', '.join(debtor_data.get('tags', []))}
{history_section}
Genera ÚNICAMENTE el resumen analítico sin encabezados ni meta-comentarios.
"""

        response = self._pro_model.generate_content(prompt)
        return response.text.strip()
