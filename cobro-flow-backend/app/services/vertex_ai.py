"""Gemini AI generation service with RAG context retrieval.

Uses Google AI Studio (google-generativeai) instead of Vertex AI.
"""

from __future__ import annotations

import logging
from uuid import UUID

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_agent import AIDocumentChunk, AIBusinessRule, AIConversationExample
from app.services.vector_search import VectorSearchService

logger = logging.getLogger(__name__)

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}


class VertexAIGenerator:
    """Generates AI messages using Gemini models with RAG context."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._vector_service = VectorSearchService(db=db)
        genai.configure(api_key=settings.GEMINI_API_KEY)

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
        rag_query = (
            f"cobranza deuda {debtor_context.get('name', '')} "
            f"monto {debtor_context.get('total_debt', '')} "
            f"días mora {debtor_context.get('days_overdue', '')}"
        )
        rag_context = self._retrieve_rag_context(organization_id, rag_query)
        business_rules = self._get_business_rules(organization_id)
        examples = self._get_few_shot_examples(organization_id, limit=3)

        prompt = self._build_campaign_prompt(
            campaign_context=campaign_context,
            debtor_context=debtor_context,
            agent_personality=agent_personality,
            channel=channel,
            rag_context=rag_context,
            business_rules=business_rules,
            examples=examples,
        )

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            safety_settings=SAFETY_SETTINGS,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
                top_p=0.9,
            ),
        )

        response = model.generate_content(prompt)

        tokens_used = 0
        if response.usage_metadata:
            tokens_used = (
                response.usage_metadata.prompt_token_count
                + response.usage_metadata.candidates_token_count
            )

        message_text = response.text.strip()

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
            for h in interaction_history[-10:]:
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

        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            safety_settings=SAFETY_SETTINGS,
            generation_config=genai.GenerationConfig(
                temperature=0.4,
                max_output_tokens=2048,
                top_p=0.95,
            ),
        )

        response = model.generate_content(prompt)
        return response.text.strip()

    # ── Conversational response generation ───────────────────────────

    def generate_conversation_response(
        self,
        organization_id: str,
        conversation_history: list[dict[str, str]],
        debtor_context: dict,
        agent_personality: dict | None = None,
        channel: str = "whatsapp",
    ) -> dict[str, str | int]:
        """Generate an AI agent reply for an ongoing debtor conversation.

        Returns {"content": str, "tokens_used": int, "sentiment": str}.
        """
        last_client_msg = next(
            (m["content"] for m in reversed(conversation_history) if m["role"] == "client"),
            "",
        )
        rag_context = self._retrieve_rag_context(organization_id, last_client_msg) if last_client_msg else ""
        business_rules = self._get_business_rules(organization_id)
        examples = self._get_few_shot_examples(organization_id, limit=3)

        system_prompt = self._build_conversation_system_prompt(
            debtor_context=debtor_context,
            agent_personality=agent_personality,
            channel=channel,
            rag_context=rag_context,
            business_rules=business_rules,
            examples=examples,
        )

        history = []
        for msg in conversation_history[:-1]:
            role = "user" if msg["role"] == "client" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            safety_settings=SAFETY_SETTINGS,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
                top_p=0.9,
            ),
            system_instruction=system_prompt,
        )

        last_msg = conversation_history[-1]["content"] if conversation_history else ""
        chat = model.start_chat(history=history)
        response = chat.send_message(last_msg)

        tokens_used = 0
        if response.usage_metadata:
            tokens_used = (
                response.usage_metadata.prompt_token_count
                + response.usage_metadata.candidates_token_count
            )

        content_text = response.text.strip()
        return {
            "content": content_text,
            "tokens_used": tokens_used,
            "sentiment": self._classify_response_sentiment(content_text),
        }

    def _classify_response_sentiment(self, text: str) -> str:
        """Heuristic sentiment classification to avoid extra API calls."""
        text_lower = text.lower()
        negative_kw = ["lamentamos", "no podemos", "no es posible", "rechaz", "desafortunadamente"]
        positive_kw = ["acuerdo", "pagado", "confirmado", "gracias", "perfecto", "excelente", "regulariz"]
        if any(kw in text_lower for kw in negative_kw):
            return "negative"
        if any(kw in text_lower for kw in positive_kw):
            return "positive"
        return "neutral"

    def _build_conversation_system_prompt(
        self,
        debtor_context: dict,
        agent_personality: dict | None,
        channel: str,
        rag_context: str,
        business_rules: list[str],
        examples: list[dict[str, str]],
    ) -> str:
        """Build the system prompt for conversational AI agent responses."""
        personality_section = ""
        if agent_personality:
            personality_section = f"""
## Tu Personalidad
- Tono: {agent_personality.get('tone', 'professional')}
- Formalidad: {agent_personality.get('formality_level', 3)}/5
- Empatía: {agent_personality.get('empathy_level', 3)}/5
- Idioma: {agent_personality.get('language', 'es')}
"""
            if agent_personality.get("system_prompt"):
                personality_section += f"{agent_personality['system_prompt']}\n"
            if agent_personality.get("custom_instructions"):
                personality_section += f"Instrucciones adicionales: {agent_personality['custom_instructions']}\n"
            if agent_personality.get("forbidden_topics"):
                personality_section += f"Temas prohibidos: {', '.join(agent_personality['forbidden_topics'])}\n"

        rules_section = ""
        if business_rules:
            rules_list = "\n".join(f"- {r}" for r in business_rules)
            rules_section = f"""
## Reglas de Negocio (OBLIGATORIAS)
{rules_list}
"""

        rag_section = ""
        if rag_context:
            rag_section = f"""
## Información de Referencia
{rag_context}
"""

        examples_section = ""
        if examples:
            ex_list = "\n".join(
                f"Cliente: {e['question']}\nAgente: {e['answer']}"
                for e in examples
            )
            examples_section = f"""
## Ejemplos de Respuesta
{ex_list}
"""

        channel_instructions = {
            "whatsapp": "Respuestas concisas, máximo 300 palabras. Puedes usar emojis con moderación.",
            "email": "Respuestas formales y estructuradas. Incluye saludo y despedida.",
            "sms": "Respuestas muy breves, máximo 160 caracteres.",
            "ai_voice": "Lenguaje natural, oraciones cortas. Sin formato especial.",
        }

        return f"""Eres un agente de cobranzas de IA profesional. Tu objetivo es resolver la situación de deuda del cliente de manera empática y efectiva.

## Deudor
- Nombre: {debtor_context.get('name', 'Cliente')}
- Deuda total: ${debtor_context.get('total_debt', 0):,.2f} {debtor_context.get('currency', 'ARS')}
- Días de mora: {debtor_context.get('days_overdue', 0)}
- Canal: {channel.upper()}
{channel_instructions.get(channel, '')}{personality_section}{rules_section}{rag_section}{examples_section}
IMPORTANTE: Responde SOLO como el agente, sin prefijos como "Agente:". Sé directo y útil."""
