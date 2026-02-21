"""AI Training endpoints for document upload, processing, rules and examples.

Provides synchronous vectorization for testing and document management.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.config import settings
from app.crud import ai_agent as ai_crud
from app.db.session import get_db
from app.models.ai_agent import (
    AIAgentConfig,
    AIDocumentChunk,
    AITrainingDocument,
    TrainingDocStatus,
)
from app.schemas.ai_agent import (
    AITrainingDocumentResponse,
    AITrainingDocumentListResponse,
    AIBusinessRuleCreate,
    AIBusinessRuleResponse,
    AIBusinessRuleListResponse,
    AIConversationExampleCreate,
    AIConversationExampleResponse,
    AIConversationExampleListResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────

def _require_org(current_user) -> uuid.UUID:
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )
    return current_user.organization_id


def _require_agent_config(db: Session, organization_id: uuid.UUID) -> AIAgentConfig:
    config = ai_crud.get_agent_config_simple(db, organization_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not configured for this organization",
        )
    return config


# ── Schemas ───────────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    id: str
    name: str
    file_type: str | None
    file_size_bytes: int | None
    status: str
    message: str


class ProcessDocumentRequest(BaseModel):
    document_id: str


class ProcessDocumentResponse(BaseModel):
    document_id: str
    status: str
    chunks_created: int
    message: str


class ProcessAllResponse(BaseModel):
    documents_processed: int
    total_chunks_created: int
    errors: list[str]


# ── Document Upload ───────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
    name: str | None = Form(None),
) -> DocumentUploadResponse:
    """Upload a training document (PDF, DOCX, CSV, TXT).

    The document is saved to the database with status 'pending'.
    Call POST /process to vectorize it.

    Example (frontend):
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('name', 'Mi documento');
        this.http.post('/api/v1/ai-training/upload', formData).subscribe(...);
    """
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)

    # Determine file type
    filename = file.filename or "document"
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
    allowed_types = {"pdf", "docx", "csv", "txt"}
    if extension not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: .{extension}. Allowed: {', '.join(allowed_types)}",
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)

    # For text-based files, store content directly
    content_text: str | None = None
    if extension in ("txt", "csv"):
        content_text = file_bytes.decode("utf-8", errors="replace")

    doc_name = name or filename

    doc = AITrainingDocument(
        organization_id=org_id,
        agent_config_id=config.id,
        uploaded_by_user_id=current_user.id,
        name=doc_name,
        file_type=extension,
        file_size_bytes=file_size,
        content_text=content_text,
        status=TrainingDocStatus.PENDING,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Store the raw file bytes in the document's file_path field as a temporary
    # marker. In production, this would go to Cloud Storage.
    # For now we store content_text for text files and process PDFs/DOCX from bytes.
    # We store a reference so the processor knows to read content_text.
    if extension in ("pdf", "docx"):
        # Store raw bytes temporarily in content_text as base64 for processing
        import base64
        doc.content_text = base64.b64encode(file_bytes).decode("ascii")
        doc.file_path = f"inline:{extension}"
        db.commit()

    return DocumentUploadResponse(
        id=str(doc.id),
        name=doc.name,
        file_type=doc.file_type,
        file_size_bytes=doc.file_size_bytes,
        status=doc.status.value,
        message=f"Document '{doc_name}' uploaded. Call POST /process to vectorize.",
    )


# ── Document Processing (Synchronous for testing) ────────────────────

@router.post("/process", response_model=ProcessDocumentResponse)
def process_document(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    request: ProcessDocumentRequest,
) -> ProcessDocumentResponse:
    """Process a single pending document: chunk it and vectorize via Vertex AI.

    This is a synchronous endpoint for testing. In production, this would be
    triggered by a Cloud Tasks worker.

    Example (frontend):
        this.http.post('/api/v1/ai-training/process', { document_id: '...' }).subscribe(...);
    """
    org_id = _require_org(current_user)

    doc = ai_crud.get_training_document_by_id(db, uuid.UUID(request.document_id), org_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status == TrainingDocStatus.PROCESSED:
        return ProcessDocumentResponse(
            document_id=str(doc.id),
            status="already_processed",
            chunks_created=doc.chunk_count,
            message="Document already processed",
        )

    try:
        chunks_created = _process_single_document(db, doc, org_id)
        return ProcessDocumentResponse(
            document_id=str(doc.id),
            status="processed",
            chunks_created=chunks_created,
            message=f"Successfully created {chunks_created} chunks",
        )
    except Exception as e:
        doc.status = TrainingDocStatus.FAILED
        doc.error_message = str(e)
        db.commit()
        logger.exception("Failed to process document %s", doc.id)
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")


@router.post("/process-all", response_model=ProcessAllResponse)
def process_all_documents(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> ProcessAllResponse:
    """Process all pending documents for the organization.

    Example (frontend):
        this.http.post('/api/v1/ai-training/process-all', {}).subscribe(...);
    """
    org_id = _require_org(current_user)

    stmt = select(AITrainingDocument).where(
        AITrainingDocument.organization_id == org_id,
        AITrainingDocument.status == TrainingDocStatus.PENDING,
    )
    pending_docs = list(db.execute(stmt).scalars().all())

    total_chunks = 0
    errors: list[str] = []

    for doc in pending_docs:
        try:
            chunks = _process_single_document(db, doc, org_id)
            total_chunks += chunks
        except Exception as e:
            errors.append(f"Document {doc.id} ({doc.name}): {e}")
            logger.exception("Failed to process document %s", doc.id)

    return ProcessAllResponse(
        documents_processed=len(pending_docs) - len(errors),
        total_chunks_created=total_chunks,
        errors=errors,
    )


def _process_single_document(
    db: Session,
    doc: AITrainingDocument,
    org_id: uuid.UUID,
) -> int:
    """Process a single document: chunk and vectorize."""
    import numpy as np
    from app.services.document_processor import DocumentProcessor
    from app.services.vector_search import VectorSearchService

    doc.status = TrainingDocStatus.PROCESSING
    db.commit()

    processor = DocumentProcessor(max_tokens=500, overlap_tokens=50)

    # Determine how to get file bytes
    file_type = doc.file_type or "txt"
    if doc.file_path and doc.file_path.startswith("inline:"):
        import base64
        file_bytes = base64.b64decode(doc.content_text or "")
    else:
        file_bytes = (doc.content_text or "").encode("utf-8")
        file_type = file_type if file_type in ("csv",) else "txt"

    chunks = processor.process_file(file_bytes, file_type, doc.name)

    if not chunks:
        doc.status = TrainingDocStatus.PROCESSED
        doc.chunk_count = 0
        doc.processed_at = datetime.now(timezone.utc)
        db.commit()
        return 0

    # Vectorize and upsert
    vector_service = VectorSearchService(db=db)
    datapoint_ids = vector_service.upsert_chunks(
        organization_id=str(org_id),
        chunks=chunks,
        db=db,
    )

    # Get embeddings for local storage (only available in local mode)
    local_embeddings = vector_service.get_last_embeddings()

    # Store chunks in PostgreSQL for text retrieval
    for i, (chunk, dp_id) in enumerate(zip(chunks, datapoint_ids)):
        db_chunk = AIDocumentChunk(
            organization_id=org_id,
            document_id=doc.id,
            chunk_text=chunk.text,
            vertex_datapoint_id=dp_id,
        )
        db_chunk.metadata_ = chunk.metadata
        # Store embedding vector if in local mode
        if local_embeddings and i < len(local_embeddings):
            db_chunk.embedding_vector = np.array(
                local_embeddings[i], dtype=np.float32
            ).tobytes()
        db.add(db_chunk)

    doc.status = TrainingDocStatus.PROCESSED
    doc.chunk_count = len(chunks)
    doc.processed_at = datetime.now(timezone.utc)
    if doc.file_path and doc.file_path.startswith("inline:"):
        doc.content_text = None
    db.commit()

    return len(chunks)


# ── Business Rules (convenience wrappers) ─────────────────────────────

@router.post("/rules", response_model=AIBusinessRuleResponse, status_code=status.HTTP_201_CREATED)
def add_business_rule(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    data: AIBusinessRuleCreate,
) -> AIBusinessRuleResponse:
    """Add a business rule for the AI agent.

    Example (frontend):
        this.http.post('/api/v1/ai-training/rules', {
            rule_text: 'Nunca ofrecer descuentos mayores al 10%',
            priority: 'high'
        }).subscribe(...);
    """
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_business_rule(db, data, org_id, config.id)


@router.get("/rules", response_model=AIBusinessRuleListResponse)
def list_business_rules(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> AIBusinessRuleListResponse:
    """List business rules for the organization."""
    org_id = _require_org(current_user)
    items, total = ai_crud.get_business_rules(db, org_id, skip=(page - 1) * size, limit=size)
    return AIBusinessRuleListResponse(items=items, total=total, page=page, size=size)


# ── Q&A Examples (convenience wrappers) ───────────────────────────────

@router.post("/examples", response_model=AIConversationExampleResponse, status_code=status.HTTP_201_CREATED)
def add_example(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    data: AIConversationExampleCreate,
) -> AIConversationExampleResponse:
    """Add a Q&A conversation example for few-shot training.

    Example (frontend):
        this.http.post('/api/v1/ai-training/examples', {
            question: '¿Cuándo vence mi factura?',
            answer: 'Su factura vence el día indicado...',
            category: 'consulta_factura'
        }).subscribe(...);
    """
    org_id = _require_org(current_user)
    config = _require_agent_config(db, org_id)
    return ai_crud.create_conversation_example(db, data, org_id, config.id)


@router.get("/examples", response_model=AIConversationExampleListResponse)
def list_examples(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
) -> AIConversationExampleListResponse:
    """List Q&A examples for the organization."""
    org_id = _require_org(current_user)
    items, total = ai_crud.get_conversation_examples(
        db, org_id, skip=(page - 1) * size, limit=size, category=category,
    )
    return AIConversationExampleListResponse(items=items, total=total, page=page, size=size)


# ── Documents listing ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(default=3, ge=1, le=10)


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]
    tokens_used: int


@router.post("/chat", response_model=ChatResponse)
def chat_with_knowledge_base(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    request: ChatRequest,
) -> ChatResponse:
    """Ask a question against the organization's knowledge base (RAG).

    Uses vector search to find relevant chunks, then feeds them to Gemini
    to generate an answer.

    Example:
        curl -X POST .../api/v1/ai-training/chat \\
          -H "Authorization: Bearer <token>" \\
          -H "Content-Type: application/json" \\
          -d '{"question": "¿Cuál es la política de cobranza?"}'
    """
    org_id = _require_org(current_user)

    from app.services.vector_search import VectorSearchService

    vector_service = VectorSearchService(db=db)
    results = vector_service.search_context(
        organization_id=str(org_id),
        query=request.question,
        top_k=request.top_k,
        db=db,
    )

    # Hydrate chunk texts from PostgreSQL
    sources: list[dict] = []
    context_texts: list[str] = []
    if results:
        dp_ids = [r.datapoint_id for r in results]
        stmt = select(AIDocumentChunk).where(
            AIDocumentChunk.vertex_datapoint_id.in_(dp_ids),
        )
        chunks_map = {
            c.vertex_datapoint_id: c
            for c in db.execute(stmt).scalars().all()
        }
        for r in results:
            chunk = chunks_map.get(r.datapoint_id)
            if chunk:
                context_texts.append(chunk.chunk_text)
                sources.append({
                    "datapoint_id": r.datapoint_id,
                    "score": round(r.score, 4),
                    "text_preview": chunk.chunk_text[:150] + "...",
                })

    # Build prompt and call Gemini
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig

    vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_LOCATION)

    context_section = "\n---\n".join(context_texts) if context_texts else "No hay documentos de entrenamiento."

    # Include business rules
    from app.models.ai_agent import AIBusinessRule
    rules_stmt = select(AIBusinessRule).where(
        AIBusinessRule.organization_id == org_id,
        AIBusinessRule.is_active.is_(True),
    ).order_by(AIBusinessRule.sort_order)
    rules = [r.rule_text for r in db.execute(rules_stmt).scalars().all()]

    rules_text = "\n".join(f"- {r}" for r in rules) if rules else "No hay reglas de negocio configuradas."

    prompt = f"""Eres un asistente de cobranzas de CobroFlow. Responde la pregunta del usuario
basándote EXCLUSIVAMENTE en el contexto proporcionado. Si la información no está en el contexto,
indica que no tienes información suficiente.

## Contexto de Documentos
{context_section}

## Reglas de Negocio
{rules_text}

## Pregunta del Usuario
{request.question}

Responde de forma concisa y profesional en español.
"""

    model = GenerativeModel(
        model_name=settings.VERTEX_FLASH_MODEL,
        generation_config=GenerationConfig(
            temperature=0.3,
            max_output_tokens=1024,
        ),
    )
    response = model.generate_content(prompt)

    tokens_used = 0
    if response.usage_metadata:
        tokens_used = (
            response.usage_metadata.prompt_token_count
            + response.usage_metadata.candidates_token_count
        )

    return ChatResponse(
        answer=response.text.strip(),
        sources=sources,
        tokens_used=tokens_used,
    )


@router.get("/documents", response_model=AITrainingDocumentListResponse)
def list_documents(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    doc_status: str | None = Query(None, alias="status"),
) -> AITrainingDocumentListResponse:
    """List training documents for the organization."""
    org_id = _require_org(current_user)
    items, total = ai_crud.get_training_documents(
        db, org_id, skip=(page - 1) * size, limit=size, status=doc_status,
    )
    return AITrainingDocumentListResponse(items=items, total=total, page=page, size=size)
